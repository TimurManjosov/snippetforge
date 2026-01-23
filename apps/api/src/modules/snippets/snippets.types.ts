// src/modules/snippets/snippets.types.ts

import { type NewSnippet, type Snippet } from '../../lib/db/schema';

/**
 * Snippets Types - Domain Types für Snippet-Operations
 *
 * WARUM separate Types?
 * 1. Entkopplung: API-Layer kann andere Typen haben als DB-Layer
 * 2. Erweiterbarkeit: Wir können zusätzliche Felder hinzufügen (z.B. User-Info)
 * 3. Type-Safety: TypeScript prüft alle Transformationen
 * 4. Documentation: Types dokumentieren die Datenstruktur
 *
 * CLEAN CODE REGEL #1: Domain-Driven Design
 * - Types repräsentieren Business-Konzepte, nicht DB-Tabellen
 */

// ============================================================
// BASIC TYPES (Re-export from Schema)
// ============================================================

/**
 * Snippet - Vollständiges Snippet aus DB
 * Enthält alle Felder inklusive Timestamps
 */
export type { NewSnippet, Snippet };

// ============================================================
// EXTENDED TYPES
// ============================================================

/**
 * Snippet mit User-Information (für API Responses)
 *
 * Wird später mit JOIN geholt wenn wir User-Daten anzeigen wollen
 * Beispiel: Snippet-Liste zeigt Author-Name
 */
export interface SnippetWithUser extends Snippet {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

/**
 * Snippet ohne Code (für Listen-Ansichten)
 *
 * PERFORMANCE REGEL #3: Select only needed columns
 * Code kann 50KB groß sein - für Listen brauchen wir das nicht!
 */
export interface SnippetPreview {
  id: string;
  title: string;
  description: string | null;
  language: string;
  userId: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// STATISTICS TYPES
// ============================================================

/**
 * Snippet Statistics für User-Dashboard
 *
 * Zeigt Übersicht über alle Snippets eines Users
 */
export interface SnippetStats {
  /** Gesamtanzahl Snippets */
  total: number;

  /** Anzahl öffentlicher Snippets */
  public: number;

  /** Anzahl privater Snippets */
  private: number;

  /** Summe aller Views */
  totalViews: number;

  /** Meist-angesehener Snippet (optional) */
  mostViewed?: Snippet;

  /** Zuletzt erstellter Snippet (optional) */
  latestSnippet?: Snippet;
}

/**
 * Language Statistics
 * Zeigt welche Programmiersprachen am häufigsten verwendet werden
 */
export interface LanguageStats {
  language: string;
  count: number;
  percentage: number;
}

// ============================================================
// PAGINATION TYPES
// ============================================================

/**
 * Pagination Metadata
 *
 * PERFORMANCE REGEL #2: Pagination
 * Enthält alle Infos die Frontend für Pagination braucht
 */
export interface PaginationMeta {
  /** Aktuelle Seite (1-indexed) */
  page: number;

  /** Items pro Seite */
  limit: number;

  /** Gesamtanzahl Items */
  total: number;

  /** Gesamtanzahl Seiten */
  totalPages: number;

  /** Gibt es eine nächste Seite? */
  hasNextPage: boolean;

  /** Gibt es eine vorherige Seite? */
  hasPreviousPage: boolean;
}

/**
 * Paginated Response
 * Standard-Format für paginierte Listen
 */
export interface PaginatedSnippets {
  data: Snippet[];
  meta: PaginationMeta;
}

/**
 * Paginated Previews (ohne Code)
 * Für Listen-Ansichten
 */
export interface PaginatedSnippetPreviews {
  data: SnippetPreview[];
  meta: PaginationMeta;
}

// ============================================================
// FILTER & SORT TYPES
// ============================================================

/**
 * Snippet Filter Options
 * Alle möglichen Filter-Parameter für Snippet-Suche
 */
export interface SnippetFilters {
  /** Filter nach User ID */
  userId?: string;

  /** Filter nach Programmiersprache */
  language?: string;

  /** Filter nach Sichtbarkeit */
  isPublic?: boolean;

  /** Volltextsuche (Title + Description) */
  search?: string;

  /** Filter nach Erstellungsdatum (ab) */
  createdAfter?: Date;

  /** Filter nach Erstellungsdatum (bis) */
  createdBefore?: Date;
}

/**
 * Snippet Sort Options
 * Definiert Sortierung von Snippet-Listen
 */
export type SnippetSortBy = 'createdAt' | 'updatedAt' | 'viewCount' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface SnippetSortOptions {
  sortBy: SnippetSortBy;
  order: SortOrder;
}

/**
 * Default Sort Option
 */
export const DEFAULT_SORT: SnippetSortOptions = {
  sortBy: 'createdAt',
  order: 'desc',
};

// ============================================================
// QUERY OPTIONS (Combined)
// ============================================================

/**
 * Snippet Query Options
 * Kombiniert Filter, Sort und Pagination
 */
export interface SnippetQueryOptions {
  filters?: SnippetFilters;
  sort?: SnippetSortOptions;
  page?: number;
  limit?: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Konvertiert Snippet zu Preview (entfernt Code)
 *
 * PERFORMANCE: Spart Bandwidth bei Listen-Ansichten
 */
export function toSnippetPreview(snippet: Snippet): SnippetPreview {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { code, ...preview } = snippet;
  return preview;
}

/**
 * Berechnet Pagination Meta
 *
 * @param total - Gesamtanzahl Items
 * @param page - Aktuelle Seite (1-indexed)
 * @param limit - Items pro Seite
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
