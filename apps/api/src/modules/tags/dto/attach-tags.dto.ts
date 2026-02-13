import { z } from 'zod';

export const AttachTagsSchema = z.object({
  tags: z
    .array(
      z
        .string()
        .min(1, 'Tag is required')
        .max(50, 'Tag must be at most 50 characters')
        .transform((value) => value.trim()),
    )
    .min(1, 'At least one tag is required')
    .max(50, 'At most 50 tags are allowed'),
});

export type AttachTagsDto = z.infer<typeof AttachTagsSchema>;
