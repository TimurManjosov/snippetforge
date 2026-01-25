// src/modules/snippets/dto/update-snippet.dto.ts

import { z } from 'zod';

/**
 * Update Snippet DTO - Validation für Snippet-Updates
 *
 * WARUM partial statt separate Fields?
 * 1. DRY: Keine Duplizierung der Validation Rules
 * 2. Consistency: Update verwendet gleiche Rules wie Create
 * 3. Flexibility: Frontend kann beliebige Felder updaten
 * 4. Type Safety: TypeScript prüft alle möglichen Updates
 *
 * VALIDATION RULES:
 * - Alle Felder sind optional (partial update)
 * - Aber wenn vorhanden, gelten die gleichen Rules wie bei Create
 * - title: 1-200 Zeichen
 * - description: Max 1000 Zeichen
 * - code: 1-50000 Zeichen
 * - language: Valides Format
 * - isPublic: Boolean
 *
 * WICHTIG: User kann nur eigene Snippets updaten (wird im Service geprüft)
 */

export const UpdateSnippetSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be at most 200 characters')
    .transform((val) => val.trim())
    .optional(),

  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .nullable()
    .transform((val) => (val ? val.trim() : val))
    .optional(),

  code: z
    .string()
    .min(1, 'Code cannot be empty')
    .max(50000, 'Code must be at most 50000 characters')
    .optional(),

  language: z
    .string()
    .min(1, 'Language cannot be empty')
    .max(50, 'Language must be at most 50 characters')
    .transform((val) => val.toLowerCase().trim())
    .refine(
      (val) => /^[a-z0-9-]+$/.test(val),
      'Language must be lowercase alphanumeric with hyphens',
    )
    .optional(),

  isPublic: z.boolean().optional(),
});

/**
 * TypeScript Type aus Schema generiert
 *
 * Equivalent zu:
 * interface UpdateSnippetDto {
 *   title?: string
 *   description?: string | null
 *   code?: string
 *   language?: string
 *   isPublic?: boolean
 * }
 *
 * ABER: Automatisch synchron mit Validation Rules!
 */
export type UpdateSnippetDto = z.infer<typeof UpdateSnippetSchema>;

/**
 * Validation Function
 * Kann auch außerhalb von NestJS verwendet werden
 */
export function validateUpdateSnippetDto(data: unknown): UpdateSnippetDto {
  return UpdateSnippetSchema.parse(data);
}

/**
 * Safe Validation (wirft keinen Error)
 * Gibt Result-Object zurück
 */
export function safeValidateUpdateSnippetDto(data: unknown) {
  return UpdateSnippetSchema.safeParse(data);
}
