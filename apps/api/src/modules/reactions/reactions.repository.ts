import { Injectable, Logger } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import { snippetReactions } from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';
import { type ReactionType } from './dto';

@Injectable()
export class ReactionsRepository {
  private readonly logger = new Logger(ReactionsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Add a reaction (idempotent via onConflictDoNothing)
   */
  async add(
    snippetId: string,
    userId: string,
    type: ReactionType,
  ): Promise<void> {
    await this.db.drizzle
      .insert(snippetReactions)
      .values({ snippetId, userId, type })
      .onConflictDoNothing();
  }

  /**
   * Remove a reaction (idempotent: no error if not found)
   */
  async remove(
    snippetId: string,
    userId: string,
    type: ReactionType,
  ): Promise<void> {
    await this.db.drizzle
      .delete(snippetReactions)
      .where(
        and(
          eq(snippetReactions.snippetId, snippetId),
          eq(snippetReactions.userId, userId),
          eq(snippetReactions.type, type),
        ),
      );
  }

  /**
   * Get aggregated counts per reaction type for a snippet
   */
  async counts(snippetId: string): Promise<Record<string, number>> {
    const rows = await this.db.drizzle
      .select({
        type: snippetReactions.type,
        count: count(),
      })
      .from(snippetReactions)
      .where(eq(snippetReactions.snippetId, snippetId))
      .groupBy(snippetReactions.type);

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.type] = row.count;
    }
    return result;
  }

  /**
   * Get reaction types the given user has set on a snippet
   */
  async userReactions(
    snippetId: string,
    userId: string,
  ): Promise<string[]> {
    const rows = await this.db.drizzle
      .select({ type: snippetReactions.type })
      .from(snippetReactions)
      .where(
        and(
          eq(snippetReactions.snippetId, snippetId),
          eq(snippetReactions.userId, userId),
        ),
      );

    return rows.map((r) => r.type);
  }
}
