import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Max 100 characters'),
  description: z.string().trim().max(500, 'Max 500 characters').optional().or(z.literal('')),
  isPublic: z.boolean(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
