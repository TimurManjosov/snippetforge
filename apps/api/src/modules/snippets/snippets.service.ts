// src/modules/snippets/snippets.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SnippetsRepository } from './snippets.repository';
import {
  type PaginatedSnippetPreviews,
  type PaginatedSnippets,
  type Snippet,
  type SnippetFilters,
  type SnippetSortOptions,
  type SnippetStats,
  DEFAULT_SORT,
} from './snippets.types';

/**
 * SnippetsService - Business Logic Layer für Snippets
 *
 * VERANTWORTLICHKEITEN (Single Responsibility):
 * - Business Logic (Ownership, Validation, Public/Private)
 * - Orchestrierung mehrerer Repository Calls
 * - Error Handling (NotFoundException, ForbiddenException)
 * - Input Validation (zusätzlich zu Zod)
 *
 * CLEAN CODE REGEL #3: Service orchestrates, Repository executes
 * - Service entscheidet WAS gemacht wird (Business Rules)
 * - Repository entscheidet WIE es gemacht wird (SQL Queries)
 *
 * BUSINESS RULES:
 * 1. User kann nur eigene Snippets bearbeiten/löschen (außer ADMIN)
 * 2. Private Snippets sind nur für Owner sichtbar
 * 3. Public Snippets sind für alle sichtbar
 * 4. Code darf nicht leer sein (zusätzlich zu Zod)
 * 5. Title max 200 Zeichen
 * 6. Code max 50,000 Zeichen
 */
@Injectable()
export class SnippetsService {
  private readonly logger = new Logger(SnippetsService.name);

  constructor(private readonly repository: SnippetsRepository) {}

  // ============================================================
  // CREATE
  // ============================================================

  /**
   * Erstellt neuen Snippet
   *
   * BUSINESS RULES:
   * - Snippet gehört immer dem Creator (userId)
   * - Code darf nicht leer sein
   * - Default: isPublic = true
   *
   * @param userId - Owner des Snippets
   * @param dto - Snippet-Daten aus Request Body
   * @returns Erstellter Snippet
   * @throws BadRequestException bei ungültigen Daten
   */
  async create(
    userId: string,
    dto: {
      title: string;
      description?: string;
      code: string;
      language: string;
      isPublic?: boolean;
    },
  ): Promise<Snippet> {
    this.logger.debug(`Creating snippet for user: ${userId}`);

    // Business Validation
    this.validateSnippetData(dto);

    // Repository Call
    const snippet = await this.repository.create({
      ...dto,
      userId,
      isPublic: dto.isPublic ?? true, // Default: public
    });

    this.logger.log(`Snippet created: ${snippet.id} by user: ${userId}`);
    return snippet;
  }

  // ============================================================
  // READ - SINGLE
  // ============================================================

  /**
   * Findet Snippet anhand der ID
   *
   * BUSINESS RULES:
   * - Public Snippets: Jeder kann sehen
   * - Private Snippets: Nur Owner kann sehen (oder ADMIN)
   *
   * @param id - Snippet UUID
   * @param currentUserId - Aktueller User (optional für Public Snippets)
   * @returns Snippet
   * @throws NotFoundException wenn nicht gefunden
   * @throws ForbiddenException wenn kein Zugriff
   */
  async findById(id: string, currentUserId?: string): Promise<Snippet> {
    this.logger.debug(`Finding snippet: ${id}`);

    const snippet = await this.repository.findById(id);

    if (!snippet) {
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    // Access Control: Private Snippets nur für Owner
    if (!snippet.isPublic && snippet.userId !== currentUserId) {
      throw new ForbiddenException('You do not have access to this snippet');
    }

    return snippet;
  }

  /**
   * Findet Snippet und erhöht View Count
   *
   * Verwendet für Snippet-Detail-Seite
   *
   * @param id - Snippet UUID
   * @param currentUserId - Aktueller User (optional)
   * @returns Snippet mit erhöhtem View Count
   */
  async findByIdAndIncrementViews(
    id: string,
    currentUserId?: string,
  ): Promise<Snippet> {
    const snippet = await this.findById(id, currentUserId);

    // View Count erhöhen (Fire-and-Forget, kein await)
    // Fehler beim Increment sollen Snippet-Anzeige nicht blockieren
    this.repository.incrementViewCount(id).catch((error) => {
      this.logger.warn(
        `Failed to increment view count for snippet ${id}:`,
        error,
      );
    });

    return snippet;
  }

  // ============================================================
  // READ - LISTS
  // ============================================================

  /**
   * Findet alle Snippets eines Users
   *
   * VERWENDUNG: "Meine Snippets" Seite
   *
   * @param userId - User UUID
   * @param limit - Max Anzahl (default 20)
   * @returns Liste von Snippets (public + private)
   */
  async findUserSnippets(userId: string, limit = 20): Promise<Snippet[]> {
    this.logger.debug(`Finding snippets for user: ${userId}`);
    return this.repository.findByUserId(userId, limit);
  }

  /**
   * Findet öffentliche Snippets (paginated)
   *
   * VERWENDUNG: Explore-Seite, Homepage
   * PERFORMANCE: Nutzt Pagination
   *
   * @param page - Seite (1-indexed, default 1)
   * @param limit - Items pro Seite (default 20, max 100)
   * @returns Paginated Snippets
   */
  async findPublicSnippets(page = 1, limit = 20): Promise<PaginatedSnippets> {
    this.logger.debug(`Finding public snippets (page: ${page})`);

    // Enforce limits (Performance Regel #2)
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    return this.repository.findPublic(safePage, safeLimit);
  }

  /**
   * Findet öffentliche Snippet-Previews (OHNE Code)
   *
   * VERWENDUNG: Listen-Ansichten (Explore, Search Results)
   * PERFORMANCE REGEL #3: Select only needed columns
   * Spart ~50KB pro Snippet bei Listen!
   *
   * @param page - Seite
   * @param limit - Items pro Seite
   * @returns Paginated Previews
   */
  async findPublicPreviews(
    page = 1,
    limit = 20,
  ): Promise<PaginatedSnippetPreviews> {
    this.logger.debug(`Finding public snippet previews (page: ${page})`);

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    return this.repository.findPublicPreviews(safePage, safeLimit);
  }

  /**
   * Sucht Snippets mit Filtern
   *
   * VERWENDUNG: Search-Seite, Filter-UI
   *
   * @param filters - Filter-Optionen
   * @param sort - Sortier-Optionen
   * @param page - Seite
   * @param limit - Items pro Seite
   * @returns Paginated Snippets
   */
  async search(
    filters: SnippetFilters = {},
    sort: SnippetSortOptions = DEFAULT_SORT,
    page = 1,
    limit = 20,
  ): Promise<PaginatedSnippets> {
    this.logger.debug('Searching snippets', { filters, sort });

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    return this.repository.findWithFilters(filters, sort, safePage, safeLimit);
  }

  /**
   * Findet Snippets nach Programmiersprache
   *
   * @param language - Programmiersprache (z.B. "typescript")
   * @param limit - Max Anzahl
   * @returns Liste von Snippets
   */
  async findByLanguage(language: string, limit = 20): Promise<Snippet[]> {
    this.logger.debug(`Finding snippets by language: ${language}`);
    return this.repository.findByLanguage(language, limit);
  }

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Aktualisiert Snippet
   *
   * BUSINESS RULES:
   * - Nur Owner kann eigene Snippets bearbeiten (außer ADMIN)
   * - Validierung der neuen Daten
   *
   * @param id - Snippet UUID
   * @param userId - User der Update macht
   * @param userRole - Rolle des Users (für Admin-Check)
   * @param dto - Zu aktualisierende Felder
   * @returns Aktualisierter Snippet
   * @throws NotFoundException wenn nicht gefunden
   * @throws ForbiddenException wenn kein Owner
   */
  async update(
    id: string,
    userId: string,
    userRole: string,
    dto: {
      title?: string;
      description?: string;
      code?: string;
      language?: string;
      isPublic?: boolean;
    },
  ): Promise<Snippet> {
    this.logger.debug(`Updating snippet: ${id} by user: ${userId}`);

    // 1. Snippet holen und Ownership prüfen
    const snippet = await this.repository.findById(id);

    if (!snippet) {
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    // BUSINESS RULE: Nur Owner oder ADMIN
    if (snippet.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only modify your own snippets');
    }

    // 2. Validierung der neuen Daten
    if (dto.title !== undefined || dto.code !== undefined) {
      this.validateSnippetData({
        title: dto.title ?? snippet.title,
        code: dto.code ?? snippet.code,
        language: dto.language ?? snippet.language,
      });
    }

    // 3. Update durchführen
    const updated = await this.repository.update(id, dto);

    if (!updated) {
      // Sollte nicht passieren (wir haben gerade geprüft dass es existiert)
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    this.logger.log(`Snippet updated: ${id}`);
    return updated;
  }

  /**
   * Toggelt Public/Private Status
   *
   * VERWENDUNG: "Make Private" / "Make Public" Button
   *
   * @param id - Snippet UUID
   * @param userId - User der Toggle macht
   * @param userRole - Rolle des Users
   * @returns Aktualisierter Snippet
   */
  async togglePublic(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<Snippet> {
    this.logger.debug(`Toggling public status for snippet: ${id}`);

    const snippet = await this.repository.findById(id);

    if (!snippet) {
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    if (snippet.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only modify your own snippets');
    }

    const updated = await this.repository.update(id, {
      isPublic: !snippet.isPublic,
    });

    if (!updated) {
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    this.logger.log(
      `Snippet ${id} is now ${updated.isPublic ? 'public' : 'private'}`,
    );
    return updated;
  }

  // ============================================================
  // DELETE
  // ============================================================

  /**
   * Löscht Snippet
   *
   * BUSINESS RULES:
   * - Nur Owner kann eigene Snippets löschen (außer ADMIN)
   *
   * @param id - Snippet UUID
   * @param userId - User der Delete macht
   * @param userRole - Rolle des Users
   * @throws NotFoundException wenn nicht gefunden
   * @throws ForbiddenException wenn kein Owner
   */
  async delete(id: string, userId: string, userRole: string): Promise<void> {
    this.logger.debug(`Deleting snippet: ${id} by user: ${userId}`);

    // 1. Snippet holen und Ownership prüfen
    const snippet = await this.repository.findById(id);

    if (!snippet) {
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    // BUSINESS RULE: Nur Owner oder ADMIN
    if (snippet.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own snippets');
    }

    // 2. Delete durchführen
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      // Sollte nicht passieren
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    this.logger.log(`Snippet deleted: ${id}`);
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  /**
   * Holt Snippet-Statistiken für einen User
   *
   * VERWENDUNG: User-Dashboard
   *
   * @param userId - User UUID
   * @returns Snippet Statistics
   */
  async getUserStats(userId: string): Promise<SnippetStats> {
    this.logger.debug(`Getting snippet stats for user: ${userId}`);
    return this.repository.getUserStats(userId);
  }

  /**
   * Zählt Snippets eines Users
   *
   * @param userId - User UUID
   * @returns Anzahl der Snippets
   */
  async countUserSnippets(userId: string): Promise<number> {
    return this.repository.countByUserId(userId);
  }

  /**
   * Holt Sprachen-Statistiken
   *
   * @param userId - Optional: Nur für einen User
   * @returns Language Stats
   */
  async getLanguageStats(userId?: string) {
    this.logger.debug(
      `Getting language stats${userId ? ` for user: ${userId}` : ''}`,
    );
    return this.repository.getLanguageStats(userId);
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  /**
   * Validiert Snippet-Daten (Business Rules)
   *
   * WICHTIG: Zod validiert bereits Format (z.B. min/max length)
   * Diese Methode prüft zusätzliche Business Rules
   *
   * @param data - Snippet-Daten
   * @throws BadRequestException bei ungültigen Daten
   */
  private validateSnippetData(data: {
    title?: string;
    code?: string;
    language?: string;
  }): void {
    // Code darf nicht nur Whitespace sein
    if (data.code !== undefined) {
      const trimmedCode = data.code.trim();
      if (trimmedCode.length === 0) {
        throw new BadRequestException(
          'Code cannot be empty or contain only whitespace',
        );
      }

      // Code max 50,000 Zeichen (Business Rule)
      if (trimmedCode.length > 50000) {
        throw new BadRequestException(
          'Code exceeds maximum length of 50,000 characters',
        );
      }
    }

    // Title darf nicht nur Whitespace sein
    if (data.title !== undefined) {
      const trimmedTitle = data.title.trim();
      if (trimmedTitle.length === 0) {
        throw new BadRequestException(
          'Title cannot be empty or contain only whitespace',
        );
      }

      // Title max 200 Zeichen (Business Rule)
      if (trimmedTitle.length > 200) {
        throw new BadRequestException(
          'Title exceeds maximum length of 200 characters',
        );
      }
    }

    // Language darf nicht leer sein
    if (data.language !== undefined) {
      const trimmedLanguage = data.language.trim();
      if (trimmedLanguage.length === 0) {
        throw new BadRequestException('Language cannot be empty');
      }
    }
  }
}
