'use server';

import {Question} from "@/lib/types";
import {fetchClient} from "@/lib/fetchClient";
import {questionSchema, QuestionSchema} from "@/lib/schemas/questionSchema";
import {sanitizeContent} from "@/lib/sanitize";

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

export async function createQuestion(input: QuestionSchema) {
    // Server actions are a public endpoint - the client-side resolver can be
    // bypassed, so the payload is validated again here before it is trusted.
    const parsed = questionSchema.safeParse(input);

    if (!parsed.success) {
        return {data: null, error: {message: 'Invalid question data', status: 400}};
    }

    return fetchClient<Question>('/questions', 'POST', {
        body: {
            title: parsed.data.title,
            content: sanitizeContent(parsed.data.content),
            tags: parsed.data.tags,
        },
    });
}