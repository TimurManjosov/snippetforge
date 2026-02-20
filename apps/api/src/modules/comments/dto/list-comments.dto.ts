import { z } from 'zod';

export const ListCommentsQuerySchema = z.object({
  parentId: z.string().uuid('parentId must be a valid UUID').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('asc'),
  depth: z.coerce.number().int().min(0).max(2).default(1),
});

export type ListCommentsQueryDto = z.infer<typeof ListCommentsQuerySchema>;
