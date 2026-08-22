'use server';

import {revalidatePath} from "next/cache";
import {Answer} from "@/lib/types";
import {fetchClient} from "@/lib/fetchClient";
import {answerSchema, AnswerSchema} from "@/lib/schemas/answerSchema";
import {sanitizeContent} from "@/lib/sanitize";
import {deleteImagesByUrl} from "@/lib/actions/image-actions";
import {extractImageUrls, orphanedImageUrls} from "@/lib/imageRules";
import {getQuestionsById} from "@/lib/actions/question-actions";

export async function createAnswer(questionId: string, input: AnswerSchema) {
    const parsed = answerSchema.safeParse(input);

    if (!parsed.success) {
        return {data: null, error: {message: 'Invalid answer data', status: 400}};
    }

    const result = await fetchClient<Answer>(`/questions/${questionId}/answers`, 'POST', {
        body: {content: sanitizeContent(parsed.data.content)},
    });

    // The question page renders the answer list on the server, so without this
    // the new answer only shows up after a hard refresh.
    if (!result.error) revalidatePath(`/questions/${questionId}`);

    return result;
}

export async function updateAnswer(questionId: string, answerId: string, input: AnswerSchema) {
    const parsed = answerSchema.safeParse(input);

    if (!parsed.success) {
        return {data: null, error: {message: 'Invalid answer data', status: 400}};
    }

    const content = sanitizeContent(parsed.data.content);
    const previous = await findAnswer(questionId, answerId);

    const result = await fetchClient<null>(`/questions/${questionId}/answers/${answerId}`, 'PUT', {
        body: {content},
    });

    if (!result.error) {
        if (previous) await deleteImagesByUrl(orphanedImageUrls(previous.content, content));
        revalidatePath(`/questions/${questionId}`);
    }

    return result;
}

export async function deleteAnswer(questionId: string, answerId: string) {
    const previous = await findAnswer(questionId, answerId);

    const result = await fetchClient<null>(`/questions/${questionId}/answers/${answerId}`, 'DELETE');

    if (!result.error) {
        if (previous) await deleteImagesByUrl(extractImageUrls(previous.content));
        revalidatePath(`/questions/${questionId}`);
    }

    return result;
}

// There is no GET for a single answer - answers only come back nested in their
// question, which is enough to diff the images an edit removed.
async function findAnswer(questionId: string, answerId: string) {
    const {data: question} = await getQuestionsById(questionId);

    return question?.answers.find(answer => answer.id === answerId) ?? null;
}
