import {z} from 'zod';

// TipTap always emits markup - an "empty" editor is '<p></p>', not '' - so the
// length checks have to run against the text content, not the raw HTML.
export function htmlTextLength(html: string) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length;
}

export const questionSchema = z.object({
    title: z.string()
        .min(10, 'Title must be at least 10 characters')
        .max(150, 'Title must be 150 characters or fewer'),
    content: z.string()
        .refine(value => htmlTextLength(value) >= 20, 'Your question must be at least 20 characters'),
    tags: z.array(z.string())
        .min(1, 'Select at least one tag')
        .max(5, 'You can select up to 5 tags'),
});

export type QuestionSchema = z.infer<typeof questionSchema>;
