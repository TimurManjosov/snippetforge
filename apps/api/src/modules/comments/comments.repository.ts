import { Injectable, Logger } from '@nestjs/common';
import { and, count, desc, asc, eq, isNull, sql } from 'drizzle-orm';
import {
  comments,
  commentFlags,
  type Comment,
  type CommentFlag,
} from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';
import { type PaginationMeta } from '../snippets/snippets.types';

export interface PaginatedComments {
  items: Comment[];
  meta: PaginationMeta;
}

@Injectable()
export class CommentsRepository {
  private readonly logger = new Logger(CommentsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    snippetId: string;
    userId: string | null;
    body: string;
    parentId?: string;
  }): Promise<Comment> {
    const [comment] = await this.db.drizzle
      .insert(comments)
      .values({
        snippetId: data.snippetId,
        userId: data.userId,
        body: data.body,
        parentId: data.parentId ?? null,
      })
      .returning();
    return comment;
  }

  /**
   * Atomically inserts a reply and increments the parent comment's
   * denormalised `replyCount`. Both operations succeed together or both
   * roll back, preventing `replyCount` from drifting if the second
   * statement fails.
   */
  async createReply(data: {
    snippetId: string;
    userId: string | null;
    body: string;
    parentId: string;
  }): Promise<Comment> {
    return this.db.drizzle.transaction(async (tx) => {
      const [comment] = await tx
        .insert(comments)
        .values({
          snippetId: data.snippetId,
          userId: data.userId,
          body: data.body,
          parentId: data.parentId,
        })
        .returning();

      await tx
        .update(comments)
        .set({ replyCount: sql`${comments.replyCount} + 1` })
        .where(eq(comments.id, data.parentId));

      return comment;
    });
  }

  async findById(commentId: string): Promise<Comment | null> {
    const comment = await this.db.drizzle.query.comments.findFirst({
      where: eq(comments.id, commentId),
    });
    return comment ?? null;
  }

  async listVisibleBySnippet(
    snippetId: string,
    options: {
      parentId?: string;
      page: number;
      limit: number;
      order: 'asc' | 'desc';
    },
  ): Promise<PaginatedComments> {
    const { parentId, page, limit, order } = options;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(comments.snippetId, snippetId),
      isNull(comments.deletedAt),
    ];

    if (parentId) {
      conditions.push(eq(comments.parentId, parentId));
    } else {
      conditions.push(isNull(comments.parentId));
    }

    const whereClause = and(...conditions);
    const orderFn = order === 'asc' ? asc : desc;

    const [items, [{ total }]] = await Promise.all([
      this.db.drizzle.query.comments.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [orderFn(comments.createdAt)],
      }),
      this.db.drizzle
        .select({ total: count() })
        .from(comments)
        .where(whereClause),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async updateBody(commentId: string, body: string): Promise<Comment | null> {
    const [updated] = await this.db.drizzle
      .update(comments)
      .set({ body, editedAt: new Date() })
      .where(eq(comments.id, commentId))
      .returning();
    return updated ?? null;
  }

  async softDelete(commentId: string): Promise<Comment | null> {
    const [updated] = await this.db.drizzle
      .update(comments)
      .set({ deletedAt: new Date() })
      .where(eq(comments.id, commentId))
      .returning();
    return updated ?? null;
  }

  /**
   * Atomically soft-deletes a reply and decrements its parent's
   * `replyCount`. Used instead of two separate calls to keep the
   * denormalised counter consistent across failures.
   */
  async softDeleteReply(
    commentId: string,
    parentId: string,
  ): Promise<Comment | null> {
    return this.db.drizzle.transaction(async (tx) => {
      const [updated] = await tx
        .update(comments)
        .set({ deletedAt: new Date() })
        .where(eq(comments.id, commentId))
        .returning();

      if (!updated) return null;

      await tx
        .update(comments)
        .set({
          replyCount: sql`GREATEST(${comments.replyCount} - 1, 0)`,
        })
        .where(eq(comments.id, parentId));

      return updated;
    });
  }

  async incrementReplyCount(parentId: string): Promise<void> {
    await this.db.drizzle
      .update(comments)
      .set({ replyCount: sql`${comments.replyCount} + 1` })
      .where(eq(comments.id, parentId));
  }

  async decrementReplyCount(parentId: string): Promise<void> {
    await this.db.drizzle
      .update(comments)
      .set({
        replyCount: sql`GREATEST(${comments.replyCount} - 1, 0)`,
      })
      .where(eq(comments.id, parentId));
  }

  async addFlag(
    commentId: string,
    reporterUserId: string | null,
    reason: string,
    message?: string,
  ): Promise<CommentFlag | null> {
    const [flag] = await this.db.drizzle
      .insert(commentFlags)
      .values({
        commentId,
        reporterUserId,
        reason: reason as 'spam' | 'abuse' | 'off-topic' | 'other',
        message: message ?? null,
      })
      .onConflictDoNothing()
      .returning();
    return flag ?? null;
  }

  async removeFlag(
    commentId: string,
    reporterUserId: string | null,
    reason: string,
  ): Promise<boolean> {
    const conditions = [
      eq(commentFlags.commentId, commentId),
      eq(
        commentFlags.reason,
        reason as 'spam' | 'abuse' | 'off-topic' | 'other',
      ),
    ];

    if (reporterUserId) {
      conditions.push(eq(commentFlags.reporterUserId, reporterUserId));
    } else {
      conditions.push(isNull(commentFlags.reporterUserId));
    }

    const result = await this.db.drizzle
      .delete(commentFlags)
      .where(and(...conditions))
      .returning({ id: commentFlags.id });

    return result.length > 0;
  }
}
