import { z } from 'zod';

export const PublicUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  displayName: z.string().max(80).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().max(500).nullable().optional(),
  websiteUrl: z.string().max(200).nullable().optional(),
  createdAt: z.string().datetime().optional(),
});

export type PublicUserDto = z.infer<typeof PublicUserSchema>;
