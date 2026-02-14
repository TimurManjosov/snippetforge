import { z } from 'zod';

const normalizeText = (value?: string) => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeTags = (value?: string) => {
  if (value === undefined) {
    return undefined;
  }

  const tags = Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  return tags.length > 0 ? tags : undefined;
};

export const SnippetQuerySchema = z.object({
  q: z.string().optional().transform(normalizeText),
  tags: z.string().optional().transform(normalizeTags),
  language: z
    .string()
    .optional()
    .transform(normalizeText)
    .refine(
      (value) => value === undefined || value.length <= 50,
      'Language must be between 1 and 50 characters',
    ),
  sort: z
    .string()
    .optional()
    .transform((value) => (value === 'views' ? 'views' : 'createdAt')),
  order: z
    .string()
    .optional()
    .transform((value) => (value === 'asc' ? 'asc' : 'desc')),
  page: z.coerce
    .number()
    .int()
    .optional()
    .catch(1)
    .transform((value) => {
      if (value === undefined) {
        return 1;
      }

      return value < 1 ? 1 : value;
    }),
  limit: z.coerce
    .number()
    .int()
    .optional()
    .catch(20)
    .transform((value) => {
      if (value === undefined || value < 1) {
        return 20;
      }

      if (value > 100) {
        return 100;
      }

      return value;
    }),
});

export type SnippetQueryDto = z.infer<typeof SnippetQuerySchema>;
