import {z} from 'zod';

export const profileSchema = z.object({
    displayName: z.string()
        .min(2, 'Your name must be at least 2 characters')
        .max(50, 'Your name must be 50 characters or fewer'),
    // Empty means "no picture" - the form clears it by sending an empty string.
    imageUrl: z.string().url('That is not a valid image address').or(z.literal('')),
});

export type ProfileSchema = z.infer<typeof profileSchema>;
