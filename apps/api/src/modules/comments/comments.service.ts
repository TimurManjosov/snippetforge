import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type SafeUser } from '../users';
import { SnippetsService } from '../snippets/snippets.service';
import {
  CommentsRepository,
  type PaginatedComments,
} from './comments.repository';
import { type Comment } from '../../lib/db/schema';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly repository: CommentsRepository,
    private readonly snippetsService: SnippetsService,
  ) {}

  /**
   * Asserts the snippet is readable by the given user.
   * Public snippets: anyone can read.
   * Private snippets: only owner or ADMIN, otherwise 404 (anti-enumeration).
   */
  private async assertSnippetReadable(
    snippetId: string,
    user?: SafeUser,
  ): Promise<void> {
    const snippet = await this.snippetsService.findById(
      snippetId,
      user?.id,
    ).catch((error) => {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // ForbiddenException from SnippetsService -> convert to 404 (anti-enumeration)
      throw new NotFoundException('Snippet not found');
    });

    // Additional anti-enumeration: private snippet + not owner/admin -> 404
    if (!snippet.isPublic) {
      if (!user || (snippet.userId !== user.id && user.role !== 'ADMIN')) {
        throw new NotFoundException('Snippet not found');
      }
    }
  }

  private isOwnerOrAdmin(comment: Comment, user?: SafeUser): boolean {
    if (!user) return false;
    return comment.userId === user.id || user.role === 'ADMIN';
  }

  async create(
    snippetId: string,
    user: SafeUser,
    body: string,
    parentId?: string,
  ): Promise<Comment> {
    await this.assertSnippetReadable(snippetId, user);

    // Validate parent comment if provided
    if (parentId) {
      const parent = await this.repository.findById(parentId);
      if (!parent || parent.snippetId !== snippetId) {
        throw new NotFoundException('Comment not found');
      }
    }

    const comment = await this.repository.create({
      snippetId,
      userId: user.id,
      body,
      parentId,
    });

    if (parentId) {
      await this.repository.incrementReplyCount(parentId);
    }

    return comment;
  }

  async list(
    snippetId: string,
    user: SafeUser | undefined,
    options: {
      parentId?: string;
      page: number;
      limit: number;
      order: 'asc' | 'desc';
    },
  ): Promise<PaginatedComments> {
    await this.assertSnippetReadable(snippetId, user);
    return this.repository.listVisibleBySnippet(snippetId, options);
  }

  async get(commentId: string, user?: SafeUser): Promise<Comment> {
    const comment = await this.repository.findById(commentId);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Soft-deleted or hidden -> 404 for non-owner/admin
    if (
      (comment.deletedAt || comment.status !== 'visible') &&
      !this.isOwnerOrAdmin(comment, user)
    ) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(
    commentId: string,
    user: SafeUser,
    body: string,
  ): Promise<Comment> {
    const comment = await this.repository.findById(commentId);

    if (!comment || !this.isOwnerOrAdmin(comment, user)) {
      throw new NotFoundException('Comment not found');
    }

    const updated = await this.repository.updateBody(commentId, body);
    if (!updated) {
      throw new NotFoundException('Comment not found');
    }

    return updated;
  }

  async softDelete(commentId: string, user: SafeUser): Promise<void> {
    const comment = await this.repository.findById(commentId);

    if (!comment || !this.isOwnerOrAdmin(comment, user)) {
      throw new NotFoundException('Comment not found');
    }

    // Idempotent: already deleted -> no-op
    if (comment.deletedAt) {
      return;
    }

    await this.repository.softDelete(commentId);

    // Decrement parent reply count if this was a reply
    if (comment.parentId) {
      await this.repository.decrementReplyCount(comment.parentId);
    }
  }

  async flag(
    commentId: string,
    user: SafeUser,
    reason: string,
    message?: string,
  ): Promise<{ flagged: true }> {
    const comment = await this.repository.findById(commentId);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Idempotent: onConflictDoNothing
    await this.repository.addFlag(commentId, user.id, reason, message);

    return { flagged: true };
  }

  async unflag(
    commentId: string,
    user: SafeUser,
    reason: string,
  ): Promise<{ unflagged: true }> {
    // Idempotent: if not found -> still 204
    await this.repository.removeFlag(commentId, user.id, reason);
    return { unflagged: true };
  }
}
