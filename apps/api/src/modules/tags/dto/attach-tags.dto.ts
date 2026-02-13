// src/modules/tags/dto/attach-tags.dto.ts

import { z } from 'zod';

/**
 * Attach Tags DTO - Validation für Tag-Zuordnung
 *
 * VALIDATION RULES:
 * - slugs: Array von Tag-Slugs
 * - Duplikate werden serverseitig gefiltert
 */

export const AttachTagsSchema = z.object({
  slugs: z
    .array(z.string().min(1).max(50))
    .min(1, 'At least one tag slug is required')
    .transform((slugs) => [...new Set(slugs.map((s) => s.toLowerCase().trim()))]),
});

/**
 * TypeScript Type aus Schema generiert
 */
export type AttachTagsDto = z.infer<typeof AttachTagsSchema>;
