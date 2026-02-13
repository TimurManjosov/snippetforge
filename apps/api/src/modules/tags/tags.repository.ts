// src/modules/tags/tags.repository.ts

import { Injectable, Logger } from '@nestjs/common';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import {
  snippetTags,
  tags,
  type NewSnippetTag,
  type NewTag,
  type Tag,
} from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';
import { type TagWithCount } from './tags.types';

/**
 * TagsRepository - Data Access Layer für Tags
 *
 * VERANTWORTLICHKEITEN:
 * - Alle Datenbank-Queries für Tags und SnippetTags
 * - Keine Business Logic
 * - Typsichere Rückgaben
 */
@Injectable()
export class TagsRepository {
  private readonly logger = new Logger(TagsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  // ============================================================
  // TAG OPERATIONS
  // ============================================================

  /**
   * Erstellt neuen Tag
   *
   * @param data - Tag-Daten (name, slug)
   * @returns Erstellter Tag
   * @throws Database Error bei Duplicate slug (unique constraint)
   */
  async createTag(data: NewTag): Promise<Tag> {
    this.logger.debug(`Creating tag: ${data.name}`);

    const [tag] = await this.db.drizzle.insert(tags).values(data).returning();

    this.logger.log(`Tag created: ${tag.id} (${tag.slug})`);
    return tag;
  }

  /**
   * Findet Tag anhand der ID
   *
   * @param id - Tag UUID
   * @returns Tag oder null
   */
  async findTagById(id: string): Promise<Tag | null> {
    const tag = await this.db.drizzle.query.tags.findFirst({
      where: eq(tags.id, id),
    });

    return tag ?? null;
  }

  /**
   * Findet Tag anhand des Slugs
   *
   * @param slug - Tag slug
   * @returns Tag oder null
   */
  async findTagBySlug(slug: string): Promise<Tag | null> {
    const tag = await this.db.drizzle.query.tags.findFirst({
      where: eq(tags.slug, slug),
    });

    return tag ?? null;
  }

  /**
   * Findet mehrere Tags anhand ihrer Slugs
   *
   * @param slugs - Array von Tag slugs
   * @returns Array von Tags (nur gefundene)
   */
  async findTagsBySlugs(slugs: string[]): Promise<Tag[]> {
    if (slugs.length === 0) return [];

    return this.db.drizzle.query.tags.findMany({
      where: inArray(tags.slug, slugs),
    });
  }

  /**
   * Listet alle Tags mit Snippet-Count
   *
   * PERFORMANCE: Single query mit LEFT JOIN und GROUP BY
   *
   * @returns Array von Tags mit snippetCount, sortiert nach slug
   */
  async findAllTagsWithCount(): Promise<TagWithCount[]> {
    this.logger.debug('Finding all tags with snippet count');

    const result = await this.db.drizzle
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
        snippetCount: count(snippetTags.snippetId),
      })
      .from(tags)
      .leftJoin(snippetTags, eq(tags.id, snippetTags.tagId))
      .groupBy(tags.id)
      .orderBy(tags.slug);

    return result;
  }

  // ============================================================
  // SNIPPET-TAG OPERATIONS (Many-to-Many)
  // ============================================================

  /**
   * Attached Tags an Snippet (Batch Insert mit Idempotenz)
   *
   * PERFORMANCE: onConflictDoNothing für Idempotenz
   * Duplicate Entries werden ignoriert (kein Error)
   *
   * @param snippetId - Snippet UUID
   * @param tagIds - Array von Tag UUIDs
   * @returns Anzahl neu erstellter Relationen
   */
  async attachTagsToSnippet(
    snippetId: string,
    tagIds: string[],
  ): Promise<number> {
    if (tagIds.length === 0) return 0;

    this.logger.debug(
      `Attaching ${tagIds.length} tags to snippet: ${snippetId}`,
    );

    const values: NewSnippetTag[] = tagIds.map((tagId) => ({
      snippetId,
      tagId,
    }));

    const result = await this.db.drizzle
      .insert(snippetTags)
      .values(values)
      .onConflictDoNothing()
      .returning();

    this.logger.log(
      `Attached ${result.length} new tags to snippet: ${snippetId}`,
    );
    return result.length;
  }

  /**
   * Entfernt Tag von Snippet
   *
   * @param snippetId - Snippet UUID
   * @param tagId - Tag UUID
   * @returns true wenn gelöscht, false wenn nicht gefunden
   */
  async detachTagFromSnippet(
    snippetId: string,
    tagId: string,
  ): Promise<boolean> {
    this.logger.debug(
      `Detaching tag ${tagId} from snippet: ${snippetId}`,
    );

    const result = await this.db.drizzle
      .delete(snippetTags)
      .where(
        and(
          eq(snippetTags.snippetId, snippetId),
          eq(snippetTags.tagId, tagId),
        ),
      )
      .returning();

    const deleted = result.length > 0;
    if (deleted) {
      this.logger.log(`Tag ${tagId} detached from snippet: ${snippetId}`);
    }

    return deleted;
  }

  /**
   * Findet alle Tag-IDs die bereits an Snippet angehängt sind
   *
   * @param snippetId - Snippet UUID
   * @param tagIds - Array von Tag UUIDs
   * @returns Array von bereits angehängten Tag-IDs
   */
  async findExistingTagRelations(
    snippetId: string,
    tagIds: string[],
  ): Promise<string[]> {
    if (tagIds.length === 0) return [];

    const existing = await this.db.drizzle
      .select({ tagId: snippetTags.tagId })
      .from(snippetTags)
      .where(
        and(
          eq(snippetTags.snippetId, snippetId),
          inArray(snippetTags.tagId, tagIds),
        ),
      );

    return existing.map((row) => row.tagId);
  }

  /**
   * Findet alle Tags eines Snippets
   *
   * @param snippetId - Snippet UUID
   * @returns Array von Tags
   */
  async findTagsBySnippetId(snippetId: string): Promise<Tag[]> {
    const result = await this.db.drizzle
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
      })
      .from(tags)
      .innerJoin(snippetTags, eq(tags.id, snippetTags.tagId))
      .where(eq(snippetTags.snippetId, snippetId))
      .orderBy(tags.slug);

    return result;
  }
}
