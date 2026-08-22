import {z} from 'zod';
import {htmlTextLength} from "@/lib/schemas/questionSchema";

export const answerSchema = z.object({
    content: z.string()
        .refine(value => htmlTextLength(value) >= 20, 'Your answer must be at least 20 characters'),
});

export type AnswerSchema = z.infer<typeof answerSchema>;
