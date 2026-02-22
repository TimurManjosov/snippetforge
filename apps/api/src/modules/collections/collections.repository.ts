import { Injectable, Logger } from '@nestjs/common';
import { and, count, desc, eq, max, sql } from 'drizzle-orm';
import {
  collections,
  collectionItems,
  snippets,
  type Collection,
} from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';
import {
  calculatePaginationMeta,
  type PaginationMeta,
  type SnippetPreview,
} from '../snippets/snippets.types';
import { type CreateCollectionDto, type UpdateCollectionDto } from './dto';

export interface PaginatedCollectionItems {
  items: SnippetPreview[];
  meta: PaginationMeta;
}

@Injectable()
export class CollectionsRepository {
  private readonly logger = new Logger(CollectionsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Create a new collection
   */
  async create(
    userId: string,
    data: CreateCollectionDto,
  ): Promise<Collection> {
    const [collection] = await this.db.drizzle
      .insert(collections)
      .values({
        userId,
        name: data.name,
        description: data.description ?? null,
        isPublic: data.isPublic ?? false,
      })
      .returning();

    return collection;
  }

  /**
   * List collections by user
   * ANNAHME: ordered by createdAt desc (consistent with other list endpoints)
   */
  async listByUser(userId: string): Promise<Collection[]> {
    return this.db.drizzle
      .select()
      .from(collections)
      .where(eq(collections.userId, userId))
      .orderBy(desc(collections.createdAt));
  }

  /**
   * Get collection by ID
   */
  async getById(id: string): Promise<Collection | null> {
    const result = await this.db.drizzle
      .select()
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Update collection fields + updatedAt
   */
  async update(
    id: string,
    patch: UpdateCollectionDto,
  ): Promise<Collection | null> {
    const [updated] = await this.db.drizzle
      .update(collections)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, id))
      .returning();

    return updated ?? null;
  }

  /**
   * Delete a collection (cascade handles items)
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.drizzle
      .delete(collections)
      .where(eq(collections.id, id))
      .returning({ id: collections.id });

    return result.length > 0;
  }

  /**
   * Add an item to a collection using atomic position assignment.
   * Computes position = COALESCE(MAX(position)+1, 1) in a single INSERT
   * to mitigate race conditions.
   * On conflict (PK collection_id+snippet_id) does nothing (idempotent).
   *
   * @returns true if inserted, false if already existed
   */
  async addItem(
    collectionId: string,
    snippetId: string,
  ): Promise<{ inserted: boolean; position: number }> {
    // Atomic insert with computed position using raw SQL template
    const result = await this.db.drizzle.execute(sql`
      INSERT INTO collection_items (collection_id, snippet_id, position)
      VALUES (
        ${collectionId},
        ${snippetId},
        COALESCE((SELECT MAX(position) + 1 FROM collection_items WHERE collection_id = ${collectionId}), 1)
      )
      ON CONFLICT (collection_id, snippet_id) DO NOTHING
      RETURNING position
    `);

    if (result.length > 0) {
      return { inserted: true, position: (result[0] as { position: number }).position };
    }

    // Already existed – fetch existing position
    const existing = await this.db.drizzle
      .select({ position: collectionItems.position })
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.snippetId, snippetId),
        ),
      )
      .limit(1);

    return { inserted: false, position: existing[0]?.position ?? 0 };
  }

  /**
   * Remove an item from a collection (idempotent)
   */
  async removeItem(collectionId: string, snippetId: string): Promise<void> {
    await this.db.drizzle
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.snippetId, snippetId),
        ),
      );
  }

  /**
   * Get max position for a collection
   */
  async getMaxPosition(collectionId: string): Promise<number | null> {
    const [result] = await this.db.drizzle
      .select({ maxPos: max(collectionItems.position) })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId));

    return result?.maxPos ?? null;
  }

  /**
   * List items with snippet preview (no code) ordered by position asc
   */
  async listItemsWithSnippetPreview(
    collectionId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedCollectionItems> {
    const safeLimit = Math.min(limit, 50);
    const offset = (page - 1) * safeLimit;

    const items = await this.db.drizzle
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
      .from(collectionItems)
      .innerJoin(snippets, eq(collectionItems.snippetId, snippets.id))
      .where(eq(collectionItems.collectionId, collectionId))
      .orderBy(collectionItems.position)
      .limit(safeLimit)
      .offset(offset);

    const [{ total }] = await this.db.drizzle
      .select({ total: count() })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId));

    return {
      items,
      meta: calculatePaginationMeta(total, page, safeLimit),
    };
  }
}
