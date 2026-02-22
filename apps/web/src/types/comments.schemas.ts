import { z } from 'zod';

export const CommentBodySchema = z.string().trim().min(1, 'Comment cannot be empty').max(5000, 'Comment must be at most 5000 characters');

export const FlagReasonSchema = z.enum(['spam', 'abuse', 'off-topic', 'other']);

export const FlagSchema = z.object({
  reason: FlagReasonSchema,
  message: z.string().trim().max(500, 'Message must be at most 500 characters').optional(),
});
