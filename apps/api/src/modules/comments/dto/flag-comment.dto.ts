import { z } from 'zod';

export const FlagCommentSchema = z.object({
  reason: z.enum(['spam', 'abuse', 'off-topic', 'other'], {
    required_error: 'Reason is required',
    invalid_type_error: 'Reason must be one of: spam, abuse, off-topic, other',
  }),
  message: z
    .string()
    .max(500, 'Message must be at most 500 characters')
    .transform((v) => v.trim())
    .optional(),
});

export type FlagCommentDto = z.infer<typeof FlagCommentSchema>;
