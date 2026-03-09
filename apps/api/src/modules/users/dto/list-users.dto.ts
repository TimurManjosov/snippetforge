import { z } from 'zod';

export const ListUsersQuerySchema = z.object({
  q: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : undefined))
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z
    .enum(['createdAt', 'publicSnippetCount'])
    .optional()
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListUsersQueryDto = z.infer<typeof ListUsersQuerySchema>;
