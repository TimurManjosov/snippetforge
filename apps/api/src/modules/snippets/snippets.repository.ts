// src/modules/snippets/snippets.repository.ts

import { Injectable, Logger } from '@nestjs/common';
import { and, asc, count, desc, eq, or, sql } from 'drizzle-orm';
import { snippets, type NewSnippet, type Snippet } from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';
import {
  calculatePaginationMeta,
  DEFAULT_SORT,
  type PaginatedSnippetPreviews,
  type PaginatedSnippets,
  type SnippetFilters,
  type SnippetSortOptions,
  type SnippetStats,
} from './snippets.types';

/**
 * SnippetsRepository - Data Access Layer für Snippets
 *
 * VERANTWORTLICHKEITEN (Single Responsibility):
 * - Alle Datenbank-Queries für Snippets
 * - Keine Business Logic (z.B. keine Ownership-Checks)
 * - Keine HTTP-Concerns (keine Exceptions außer DB-Errors)
 *
 * CLEAN CODE REGEL #2: Repository Returns Domain Objects
 * - Alle Methoden geben typisierte Objekte zurück
 * - Kein `any`, kein `unknown`
 * - Explicit `null` statt `undefined` wenn nicht gefunden
 *
 * CLEAN CODE REGEL #3: Repository executes, Service orchestrates
 * - Keine if/else für Business Rules
 * - Keine Validierung von Input (macht Service)
 * - Nur reine Datenbank-Operationen
 *
 * PERFORMANCE OPTIMIERUNGEN:
 * - Nutzt alle DB-Indices (userId, language, createdAt, isPublic)
 * - Pagination verhindert Memory-Overflow
 * - Atomic Operations (incrementViewCount)
 * - Batch Queries wo möglich
 */
@Injectable()
export class SnippetsRepository {
  private readonly logger = new Logger(SnippetsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  // ============================================================
  // CREATE
  // ============================================================

  /**
   * Erstellt neuen Snippet
   *
   * PERFORMANCE: Single INSERT, nutzt RETURNING
   *
   * @param data - Snippet-Daten (ohne id, timestamps)
   * @returns Erstellter Snippet mit generierten Feldern
   * @throws Database Error bei Constraint-Violation
   */
  async create(data: NewSnippet): Promise<Snippet> {
    this.logger.debug(`Creating snippet: ${data.title}`);

    const [snippet] = await this.db.drizzle
      .insert(snippets)
      .values(data)
      .returning();

    this.logger.log(`Snippet created: ${snippet.id}`);
    return snippet;
  }

  // ============================================================
  // READ - SINGLE
  // ============================================================

  /**
   * Findet Snippet anhand der ID
   *
   * PERFORMANCE: Nutzt Primary Key Index (schnellste Query)
   *
   * @param id - Snippet UUID
   * @returns Snippet oder null wenn nicht gefunden
   */
  async findById(id: string): Promise<Snippet | null> {
    this.logger.debug(`Finding snippet by ID: ${id}`);

    const snippet = await this.db.drizzle.query.snippets.findFirst({
      where: eq(snippets.id, id),
    });

    return snippet ?? null;
  }

  // ============================================================
  // READ - LISTS
  // ============================================================

  /**
   * Findet alle Snippets eines Users
   *
   * PERFORMANCE: Nutzt snippets_user_id_idx
   *
   * @param userId - User UUID
   * @param limit - Max Anzahl (default 20, max 100)
   * @returns Liste von Snippets (sortiert nach createdAt DESC)
   */
  async findByUserId(userId: string, limit = 20): Promise<Snippet[]> {
    this.logger.debug(`Finding snippets for user: ${userId}`);

    return this.db.drizzle.query.snippets.findMany({
      where: eq(snippets.userId, userId),
      limit: Math.min(limit, 100),
      orderBy: [desc(snippets.createdAt)],
    });
  }

  /**
   * Findet öffentliche Snippets (paginated)
   *
   * PERFORMANCE:
   * - Nutzt snippets_public_created_at_idx (composite index)
   * - Zwei Queries: Data + Count (parallel möglich)
   * - Pagination verhindert Memory-Overflow
   *
   * @param page - Seite (1-indexed, default 1)
   * @param limit - Items pro Seite (default 20, max 100)
   * @returns Paginated Snippets
   */
  async findPublic(page = 1, limit = 20): Promise<PaginatedSnippets> {
    this.logger.debug(
      `Finding public snippets (page: ${page}, limit: ${limit})`,
    );

    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;

    // Query 1: Data
    const data = await this.db.drizzle.query.snippets.findMany({
      where: eq(snippets.isPublic, true),
      limit: safeLimit,
      offset,
      orderBy: [desc(snippets.createdAt)],
    });

    // Query 2: Count
    const [{ total }] = await this.db.drizzle
      .select({ total: count() })
      .from(snippets)
      .where(eq(snippets.isPublic, true));

    return {
      data,
      meta: calculatePaginationMeta(total, page, safeLimit),
    };
  }

  /**
   * Findet öffentliche Snippet-Previews (OHNE Code)
   *
   * PERFORMANCE REGEL #3: Select only needed columns
   * Spart ~50KB pro Snippet bei Listen-Ansichten!
   *
   * @param page - Seite
   * @param limit - Items pro Seite
   * @returns Paginated Previews
   */
  async findPublicPreviews(
    page = 1,
    limit = 20,
  ): Promise<PaginatedSnippetPreviews> {
    this.logger.debug(
      `Finding public snippet previews (page: ${page}, limit: ${limit})`,
    );
    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;

    // Query 1: Data (ohne code Feld!)
    const data = await this.db.drizzle
      .select({
        id: snippets.id,
        title: snippets.title,
        description: snippets.description,
        language: snippets.language,
        userId: snippets.userId,
        isPublic: snippets.isPublic,
        viewCount: snippets.viewCount,
        createdAt: snippets.createdAt,
        updatedAt: snippets.updatedAt,
      })
      .from(snippets)
      .where(eq(snippets.isPublic, true))
      .limit(safeLimit)
      .offset(offset)
      .orderBy(desc(snippets.createdAt));

    // Query 2: Count
    const [{ total }] = await this.db.drizzle
      .select({ total: count() })
      .from(snippets)
      .where(eq(snippets.isPublic, true));

    return {
      data,
      meta: calculatePaginationMeta(total, page, safeLimit),
    };
  }

  /**
   * Findet Snippets nach Programmiersprache
   *
   * PERFORMANCE: Nutzt snippets_language_idx
   *
   * @param language - Programmiersprache (z.B. "typescript")
   * @param limit - Max Anzahl
   * @returns Liste von Snippets
   */
  async findByLanguage(language: string, limit = 20): Promise<Snippet[]> {
    this.logger.debug(`Finding snippets by language: ${language}`);

    return this.db.drizzle.query.snippets.findMany({
      where: eq(snippets.language, language),
      limit: Math.min(limit, 100),
      orderBy: [desc(snippets.createdAt)],
    });
  }

  /**
   * Erweiterte Suche mit Filtern und Sortierung
   *
   * PERFORMANCE: Nutzt Indices basierend auf Filtern
   *
   * @param filters - Filter-Optionen
   * @param sort - Sortier-Optionen (default: createdAt DESC)
   * @param page - Seite
   * @param limit - Items pro Seite
   * @returns Paginated Snippets
   */
  async findWithFilters(
    filters: SnippetFilters = {},
    sort: SnippetSortOptions = DEFAULT_SORT,
    page = 1,
    limit = 20,
  ): Promise<PaginatedSnippets> {
    this.logger.debug('Finding snippets with filters', { filters, sort });

    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;

    // Build WHERE clause
    const conditions = this.buildWhereConditions(filters);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build ORDER BY
    const sortColumn = snippets[sort.sortBy];
    const orderFn = sort.order === 'asc' ? asc : desc;

    // Query 1: Data
    const data = await this.db.drizzle.query.snippets.findMany({
      where: whereClause,
      limit: safeLimit,
      offset,
      orderBy: [orderFn(sortColumn)],
    });

    // Query 2: Count
    const [{ total }] = await this.db.drizzle
      .select({ total: count() })
      .from(snippets)
      .where(whereClause);

    return {
      data,
      meta: calculatePaginationMeta(total, page, safeLimit),
    };
  }

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Aktualisiert Snippet-Daten
   *
   * WICHTIG: updatedAt wird automatisch gesetzt
   *
   * @param id - Snippet UUID
   * @param data - Zu aktualisierende Felder
   * @returns Aktualisierter Snippet oder null wenn nicht gefunden
   */
  async update(id: string, data: Partial<NewSnippet>): Promise<Snippet | null> {
    this.logger.debug(`Updating snippet: ${id}`);

    const [updatedSnippet] = await this.db.drizzle
      .update(snippets)
      .set({
        ...data,
        updatedAt: new Date(), // Timestamp immer aktualisieren
      })
      .where(eq(snippets.id, id))
      .returning();

    if (!updatedSnippet) {
      this.logger.warn(`Snippet not found for update: ${id}`);
      return null;
    }

    this.logger.log(`Snippet updated: ${id}`);
    return updatedSnippet;
  }

  /**
   * Erhöht View Count um 1 (Atomic Operation)
   *
   * PERFORMANCE: Atomic SQL Update (kein Race Condition)
   *
   * @param id - Snippet UUID
   * @returns true wenn erfolgreich, false wenn nicht gefunden
   */
  async incrementViewCount(id: string): Promise<boolean> {
    this.logger.debug(`Incrementing view count for snippet: ${id}`);

    const result = await this.db.drizzle
      .update(snippets)
      .set({
        viewCount: sql`${snippets.viewCount} + 1`,
      })
      .where(eq(snippets.id, id))
      .returning({ id: snippets.id });

    return result.length > 0;
  }

  // ============================================================
  // DELETE
  // ============================================================

  /**
   * Löscht Snippet (Hard Delete)
   *
   * HINWEIS: Soft Delete (isDeleted Flag) wäre in Production besser
   *
   * @param id - Snippet UUID
   * @returns true wenn gelöscht, false wenn nicht gefunden
   */
  async delete(id: string): Promise<boolean> {
    this.logger.debug(`Deleting snippet: ${id}`);

    const result = await this.db.drizzle
      .delete(snippets)
      .where(eq(snippets.id, id))
      .returning({ id: snippets.id });

    if (result.length === 0) {
      this.logger.warn(`Snippet not found for deletion: ${id}`);
      return false;
    }

    this.logger.log(`Snippet deleted: ${id}`);
    return true;
  }

  // ============================================================
  // BATCH OPERATIONS
  // ============================================================

  /**
   * Löscht alle Snippets eines Users (Batch Delete)
   *
   * VERWENDUNG: Bei User-Löschung (zusätzlich zu CASCADE)
   *
   * @param userId - User UUID
   * @returns Anzahl gelöschter Snippets
   */
  async deleteByUserId(userId: string): Promise<number> {
    this.logger.debug(`Deleting all snippets for user: ${userId}`);

    const result = await this.db.drizzle
      .delete(snippets)
      .where(eq(snippets.userId, userId))
      .returning({ id: snippets.id });

    this.logger.log(`Deleted ${result.length} snippets for user: ${userId}`);
    return result.length;
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  /**
   * Zählt Snippets eines Users
   *
   * @param userId - User UUID
   * @returns Anzahl der Snippets
   */
  async countByUserId(userId: string): Promise<number> {
    const [{ total }] = await this.db.drizzle
      .select({ total: count() })
      .from(snippets)
      .where(eq(snippets.userId, userId));

    return total;
  }

  /**
   * Zählt öffentliche Snippets
   *
   * @returns Anzahl öffentlicher Snippets
   */
  async countPublic(): Promise<number> {
    const [{ total }] = await this.db.drizzle
      .select({ total: count() })
      .from(snippets)
      .where(eq(snippets.isPublic, true));

    return total;
  }

  /**
   * Holt umfassende Statistiken für einen User
   *
   * PERFORMANCE: Single Query mit Aggregation
   *
   * @param userId - User UUID
   * @returns Snippet Statistics
   */
  async getUserStats(userId: string): Promise<SnippetStats> {
    this.logger.debug(`Getting stats for user: ${userId}`);

    // Alle User-Snippets holen
    const userSnippets = await this.db.drizzle.query.snippets.findMany({
      where: eq(snippets.userId, userId),
    });

    // Statistiken berechnen
    const total = userSnippets.length;
    const publicCount = userSnippets.filter((s) => s.isPublic).length;
    const privateCount = total - publicCount;
    const totalViews = userSnippets.reduce((sum, s) => sum + s.viewCount, 0);

    // Most viewed Snippet
    const mostViewed = userSnippets.sort(
      (a, b) => b.viewCount - a.viewCount,
    )[0];

    // Latest Snippet
    const latestSnippet = userSnippets.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];

    return {
      total,
      public: publicCount,
      private: privateCount,
      totalViews,
      mostViewed,
      latestSnippet,
    };
  }

  /**
   * Holt Sprachen-Statistiken
   *
   * @param userId - Optional: Nur für einen User
   * @returns Language Stats sortiert nach Count DESC
   */
  async getLanguageStats(
    userId?: string,
  ): Promise<Array<{ language: string; count: number }>> {
    this.logger.debug(
      `Getting language stats${userId ? ` for user: ${userId}` : ''}`,
    );

    const whereClause = userId ? eq(snippets.userId, userId) : undefined;

    const result = await this.db.drizzle
      .select({
        language: snippets.language,
        count: count(),
      })
      .from(snippets)
      .where(whereClause)
      .groupBy(snippets.language)
      .orderBy(desc(count()));

    return result;
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  /**
   * Baut WHERE Conditions aus Filtern
   *
   * @param filters - Filter-Optionen
   * @returns Array von Drizzle Conditions
   */
  private buildWhereConditions(filters: SnippetFilters) {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(snippets.userId, filters.userId));
    }

    if (filters.language) {
      conditions.push(eq(snippets.language, filters.language));
    }

    if (filters.isPublic !== undefined) {
      conditions.push(eq(snippets.isPublic, filters.isPublic));
    }

    if (filters.search) {
      // Simple text search (case-insensitive)
      // TODO Sprint 2: Full-text search mit PostgreSQL ts_vector
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          sql`LOWER(${snippets.title}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${snippets.description}) LIKE LOWER(${searchPattern})`,
        ),
      );
    }

    if (filters.createdAfter) {
      conditions.push(sql`${snippets.createdAt} >= ${filters.createdAfter}`);
    }

    if (filters.createdBefore) {
      conditions.push(sql`${snippets.createdAt} <= ${filters.createdBefore}`);
    }

    return conditions;
  }
}
