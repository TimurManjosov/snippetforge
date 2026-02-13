import { z } from 'zod';

export const CreateTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be at most 50 characters')
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, 'Tag name is required'),
});

export type CreateTagDto = z.infer<typeof CreateTagSchema>;
