import { z } from 'zod';

export const REACTION_TYPES = [
  'like',
  'love',
  'star',
  'laugh',
  'wow',
  'sad',
  'angry',
] as const;

export const ReactionTypeSchema = z.enum(REACTION_TYPES);

export const SetReactionSchema = z.object({
  type: ReactionTypeSchema,
});

export type SetReactionDto = z.infer<typeof SetReactionSchema>;
export type ReactionType = z.infer<typeof ReactionTypeSchema>;
