import { z } from 'zod';

export const AddFavoriteSchema = z.object({
  snippetId: z.string().uuid(),
});

export type AddFavoriteDto = z.infer<typeof AddFavoriteSchema>;
