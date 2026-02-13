// src/modules/tags/dto/create-tag.dto.ts

import { z } from 'zod';

/**
 * Create Tag DTO - Validation für Tag-Erstellung
 *
 * VALIDATION RULES:
 * - name: 1-50 Zeichen, required
 * - slug wird serverseitig aus name generiert (nicht im DTO)
 */

export const CreateTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be at most 50 characters')
    .transform((val) => val.trim()),
});

/**
 * TypeScript Type aus Schema generiert
 */
export type CreateTagDto = z.infer<typeof CreateTagSchema>;
