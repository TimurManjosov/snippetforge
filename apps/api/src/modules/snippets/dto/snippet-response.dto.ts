// src/modules/snippets/dto/snippet-response.dto.ts

import { z } from 'zod';

/**
 * Snippet Response Schemas - Für API Response Dokumentation
 *
 * WARUM Response DTOs?
 * - Dokumentation: Swagger kann Schema nutzen
 * - Typsicherheit: Frontend weiß was es bekommt
 * - Konsistenz: Alle Snippet-Responses haben gleiches Format
 * - Security: Kann sensitive Felder filtern (z.B. internal IDs)
 */

/**
 * Basic User Info Schema (für Snippet-Author)
 */
export const SnippetAuthorSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
});

/**
 * Full Snippet Response Schema
 * Verwendet für einzelne Snippet-Ansicht (mit Code)
 */
export const SnippetResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  code: z.string(),
  language: z.string(),
  userId: z.string().uuid(),
  isPublic: z.boolean(),
  viewCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Snippet Response with User Info
 * Für Ansichten wo Author-Info benötigt wird
 */
export const SnippetWithUserResponseSchema = SnippetResponseSchema.extend({
  user: SnippetAuthorSchema,
});

/**
 * Snippet Preview Response Schema (ohne Code)
 * Verwendet für Listen-Ansichten (Performance!)
 *
 * PERFORMANCE: Code kann 50KB groß sein - für Listen nicht nötig!
 */
export const SnippetPreviewResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  language: z.string(),
  userId: z.string().uuid(),
  isPublic: z.boolean(),
  viewCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Pagination Metadata Schema
 */
export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

/**
 * Paginated Snippets Response Schema
 */
export const PaginatedSnippetsResponseSchema = z.object({
  data: z.array(SnippetResponseSchema),
  meta: PaginationMetaSchema,
});

/**
 * Paginated Snippet Previews Response Schema
 */
export const PaginatedSnippetPreviewsResponseSchema = z.object({
  data: z.array(SnippetPreviewResponseSchema),
  meta: PaginationMetaSchema,
});

/**
 * Snippet Statistics Response Schema
 */
export const SnippetStatsResponseSchema = z.object({
  total: z.number(),
  public: z.number(),
  private: z.number(),
  totalViews: z.number(),
  mostViewed: SnippetResponseSchema.optional(),
  latestSnippet: SnippetResponseSchema.optional(),
});

// ============================================================
// TYPESCRIPT TYPES
// ============================================================

export type SnippetAuthorDto = z.infer<typeof SnippetAuthorSchema>;
export type SnippetResponseDto = z.infer<typeof SnippetResponseSchema>;
export type SnippetWithUserResponseDto = z.infer<
  typeof SnippetWithUserResponseSchema
>;
export type SnippetPreviewResponseDto = z.infer<
  typeof SnippetPreviewResponseSchema
>;
export type PaginationMetaDto = z.infer<typeof PaginationMetaSchema>;
export type PaginatedSnippetsResponseDto = z.infer<
  typeof PaginatedSnippetsResponseSchema
>;
export type PaginatedSnippetPreviewsResponseDto = z.infer<
  typeof PaginatedSnippetPreviewsResponseSchema
>;
export type SnippetStatsResponseDto = z.infer<
  typeof SnippetStatsResponseSchema
>;
