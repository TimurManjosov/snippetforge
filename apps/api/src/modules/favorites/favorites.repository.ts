import { Injectable, Logger } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';
import { favorites, snippets } from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';
import {
  calculatePaginationMeta,
  type PaginationMeta,
  type SnippetPreview,
} from '../snippets/snippets.types';

export interface PaginatedFavorites {
  items: SnippetPreview[];
  meta: PaginationMeta;
}

@Injectable()
export class FavoritesRepository {
  private readonly logger = new Logger(FavoritesRepository.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Add a favorite (idempotent via onConflictDoNothing)
   */
  async add(userId: string, snippetId: string): Promise<void> {
    await this.db.drizzle
      .insert(favorites)
      .values({ userId, snippetId })
      .onConflictDoNothing();
  }

  /**
   * Remove a favorite (idempotent: no error if not found)
   */
  async remove(userId: string, snippetId: string): Promise<void> {
    await this.db.drizzle
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.snippetId, snippetId),
        ),
      );
  }

  /**
   * List favorites for a user with snippet previews (no code)
   * Ordered by createdAt desc (uses favorites_user_created_idx)
   */
  async listByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedFavorites> {
    const safeLimit = Math.min(limit, 50);
    const offset = (page - 1) * safeLimit;

    // Query data: join favorites → snippets for preview fields
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
      .from(favorites)
      .innerJoin(snippets, eq(favorites.snippetId, snippets.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .limit(safeLimit)
      .offset(offset);

    // Count query
    const [{ total }] = await this.db.drizzle
      .select({ total: count() })
      .from(favorites)
      .where(eq(favorites.userId, userId));

    return {
      items,
      meta: calculatePaginationMeta(total, page, safeLimit),
    };
  }
}
