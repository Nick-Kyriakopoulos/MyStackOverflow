'use server';

import {revalidatePath} from "next/cache";
import {Question} from "@/lib/types";
import {fetchClient} from "@/lib/fetchClient";
import {questionSchema, QuestionSchema} from "@/lib/schemas/questionSchema";
import {sanitizeContent} from "@/lib/sanitize";
import {deleteImagesByUrl} from "@/lib/actions/image-actions";
import {extractImageUrls, orphanedImageUrls} from "@/lib/imageRules";

export async function getQuestions(tag?: string) {
    let url = '/questions';
    if (tag) url += '?tag=' + tag;
    return fetchClient<Question[]>(url, 'GET')
}

export async function getQuestionsById(id: string) {
    return fetchClient<Question>(`/questions/${id}`, 'GET');
}
export async function searchQuestions(query: string) {
    return fetchClient<Question[]>(`/search?query=${encodeURIComponent(query)}`, 'GET');
}

export async function updateQuestion(id: string, input: QuestionSchema) {
    const parsed = questionSchema.safeParse(input);

    if (!parsed.success) {
        return {data: null, error: {message: 'Invalid question data', status: 400}};
    }

    const content = sanitizeContent(parsed.data.content);

    // Read the old content before overwriting it, so images the user removed
    // during this edit can be cleaned up afterwards.
    const {data: existing} = await getQuestionsById(id);

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
    const {data: existing} = await getQuestionsById(id);

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

    const result = await fetchClient<Question>('/questions', 'POST', {
        body: {
            title: parsed.data.title,
            content: sanitizeContent(parsed.data.content),
            tags: parsed.data.tags,
        },
    });

    if (!result.error) revalidatePath('/questions');

    return result;
}