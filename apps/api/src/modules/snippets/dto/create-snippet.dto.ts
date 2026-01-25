// src/modules/snippets/dto/create-snippet.dto.ts

import { z } from 'zod';

/**
 * Create Snippet DTO - Validation für Snippet-Erstellung
 *
 * WARUM Zod statt class-validator?
 * 1. Type Inference: Schema generiert automatisch TypeScript Types
 * 2. Runtime + Compile-Time Safety: Ein Schema für beides
 * 3. Bessere Fehlermeldungen: Detaillierte Validation Errors
 * 4. Shared: Kann in Frontend UND Backend verwendet werden
 * 5. Functional: Kein Decorator-Magic, pure Functions
 *
 * VALIDATION RULES:
 * - title: 1-200 Zeichen, required
 * - description: Optional, max 1000 Zeichen
 * - code: Required, 1-50000 Zeichen
 * - language: Required, valides Format
 * - isPublic: Optional, default true
 */

export const CreateSnippetSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .transform((val) => val.trim()),

  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .transform((val) => (val ? val.trim() : val)),

  code: z
    .string()
    .min(1, 'Code is required')
    .max(50000, 'Code must be at most 50000 characters'),

  language: z
    .string()
    .min(1, 'Language is required')
    .max(50, 'Language must be at most 50 characters')
    .transform((val) => val.toLowerCase().trim())
    .refine(
      (val) => /^[a-z0-9-]+$/.test(val),
      'Language must be lowercase alphanumeric with hyphens',
    ),

  isPublic: z.boolean().default(true).optional(),
});

/**
 * TypeScript Type aus Schema generiert
 *
 * Equivalent zu:
 * interface CreateSnippetDto {
 *   title: string
 *   description?: string
 *   code: string
 *   language: string
 *   isPublic?: boolean
 * }
 *
 * ABER: Automatisch synchron mit Validation Rules!
 */
export type CreateSnippetDto = z.infer<typeof CreateSnippetSchema>;

/**
 * Validation Function
 * Kann auch außerhalb von NestJS verwendet werden
 */
export function validateCreateSnippetDto(data: unknown): CreateSnippetDto {
  return CreateSnippetSchema.parse(data);
}

/**
 * Safe Validation (wirft keinen Error)
 * Gibt Result-Object zurück
 */
export function safeValidateCreateSnippetDto(data: unknown) {
  return CreateSnippetSchema.safeParse(data);
}
