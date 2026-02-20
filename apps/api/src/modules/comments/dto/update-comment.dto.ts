import { z } from 'zod';

export const UpdateCommentSchema = z.object({
  body: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters')),
});

export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>;
