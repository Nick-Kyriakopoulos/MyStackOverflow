'use server';

import {revalidatePath} from "next/cache";
import {Answer, Profile, Question, SearchResult} from "@/lib/types";
import {fetchClient} from "@/lib/fetchClient";
import {questionSchema, QuestionSchema} from "@/lib/schemas/questionSchema";
import {sanitizeContent} from "@/lib/sanitize";
import {deleteImagesByUrl} from "@/lib/actions/image-actions";
import {extractImageUrls, orphanedImageUrls} from "@/lib/imageRules";
import {getProfiles} from "@/lib/actions/profile-actions";

// QuestionService stores only the author's id - the name and avatar live in
// ProfileService - so what comes back over the wire is a question without an author.
type RawAnswer = Omit<Answer, 'author'>;
type RawQuestion = Omit<Question, 'author' | 'answers'> & {answers: RawAnswer[]};

// An author whose profile could not be loaded - a ProfileService outage, or a post
// written before the service existed. The card still renders; only the name is lost.
function placeholderProfile(id: string): Profile {
    return {id, displayName: 'Unknown user', reputation: 0, createdAt: ''};
}

// One batch call per render, not one per card: collect every distinct author across
// the questions and their answers, look them all up at once, then stitch them back on.
async function withAuthors(questions: RawQuestion[]): Promise<Question[]> {
    const ids = new Set<string>();
    for (const question of questions) {
        ids.add(question.askerId);
        for (const answer of question.answers ?? []) ids.add(answer.userId);
    }

    const {data} = await getProfiles(Array.from(ids));
    const byId = new Map((data ?? []).map(profile => [profile.id, profile]));

    return questions.map(question => ({
        ...question,
        author: byId.get(question.askerId) ?? placeholderProfile(question.askerId),
        answers: (question.answers ?? []).map(answer => ({
            ...answer,
            author: byId.get(answer.userId) ?? placeholderProfile(answer.userId),
        })),
    }));
}

export async function getQuestions(tag?: string) {
    let url = '/questions';
    if (tag) url += '?tag=' + tag;

    const result = await fetchClient<RawQuestion[]>(url, 'GET');
    if (!result.data) return {data: null, error: result.error};

    return {data: await withAuthors(result.data), error: undefined};
}

export async function getQuestionsById(id: string) {
    const result = await fetchClient<RawQuestion>(`/questions/${id}`, 'GET');
    if (!result.data) return {data: null, error: result.error};

    const [question] = await withAuthors([result.data]);
    return {data: question, error: undefined};
}

export async function searchQuestions(query: string) {
    return fetchClient<SearchResult[]>(`/search?query=${encodeURIComponent(query)}`, 'GET');
}

export async function updateQuestion(id: string, input: QuestionSchema) {
    const parsed = questionSchema.safeParse(input);

    if (!parsed.success) {
        return {data: null, error: {message: 'Invalid question data', status: 400}};
    }

    const content = sanitizeContent(parsed.data.content);

    // Read the old content before overwriting it, so images the user removed
    // during this edit can be cleaned up afterwards. Raw, because only the markup
    // is needed - resolving the author here would cost a profile lookup for nothing.
    const {data: existing} = await fetchClient<RawQuestion>(`/questions/${id}`, 'GET');

    // The API answers 204 with no body, so there is nothing useful in data -
    // callers check error only. Ownership is enforced server-side (403).
    const result = await fetchClient<null>(`/questions/${id}`, 'PUT', {
        body: {
            title: parsed.data.title,
            content,
            tags: parsed.data.tags,
        },
    });

    // Only after the update actually landed - otherwise a failed save would
    // still have destroyed the images.
    if (!result.error) {
        if (existing) await deleteImagesByUrl(orphanedImageUrls(existing.content, content));
        // Both the detail page and the list render this question server-side.
        revalidatePath(`/questions/${id}`);
        revalidatePath('/questions');
    }

    return result;
}

export async function deleteQuestion(id: string) {
    const {data: existing} = await fetchClient<RawQuestion>(`/questions/${id}`, 'GET');

    const result = await fetchClient<null>(`/questions/${id}`, 'DELETE');

    if (!result.error) {
        if (existing) await deleteImagesByUrl(extractImageUrls(existing.content));
        revalidatePath('/questions');
    }

    return result;
}

export async function createQuestion(input: QuestionSchema) {
    // Server actions are a public endpoint - the client-side resolver can be
    // bypassed, so the payload is validated again here before it is trusted.
    const parsed = questionSchema.safeParse(input);

    if (!parsed.success) {
        return {data: null, error: {message: 'Invalid question data', status: 400}};
    }

    const result = await fetchClient<RawQuestion>('/questions', 'POST', {
        body: {
            title: parsed.data.title,
            content: sanitizeContent(parsed.data.content),
            tags: parsed.data.tags,
        },
    });

    if (!result.error) revalidatePath('/questions');

    return result;
}