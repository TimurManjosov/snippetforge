import { z } from 'zod';

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  isPublic: z.boolean().optional().default(false),
});

export type CreateCollectionDto = z.infer<typeof CreateCollectionSchema>;

export const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  isPublic: z.boolean().optional(),
});

export type UpdateCollectionDto = z.infer<typeof UpdateCollectionSchema>;

export const AddCollectionItemSchema = z.object({
  snippetId: z.string().uuid(),
});

export type AddCollectionItemDto = z.infer<typeof AddCollectionItemSchema>;
