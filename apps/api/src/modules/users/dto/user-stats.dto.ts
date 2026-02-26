import { z } from 'zod';

export const UserStatsSchema = z.object({
  userId: z.string().uuid(),
  publicSnippetCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  reactionGivenCount: z.number().int().nonnegative().optional(),
});

export type UserStatsDto = z.infer<typeof UserStatsSchema>;
