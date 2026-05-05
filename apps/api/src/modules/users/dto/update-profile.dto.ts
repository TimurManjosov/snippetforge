import { z } from 'zod';

export const UpdateProfileSchema = z
  .object({
    displayName: z.string().min(1).max(80).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    avatarUrl: z.string().max(500).nullable().optional(),
    websiteUrl: z.string().max(200).nullable().optional(),
  })
  .strict();

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
