import { z } from 'zod';

export const CreateCommentSchema = z.object({
  body: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, 'Comment body is required').max(5000, 'Comment body must be at most 5000 characters')),
  parentId: z.string().uuid('parentId must be a valid UUID').optional(),
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
