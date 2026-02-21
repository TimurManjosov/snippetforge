import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type SafeUser } from '../users';
import { SnippetsRepository } from '../snippets/snippets.repository';
import { ReactionsRepository } from './reactions.repository';
import { type ReactionType } from './dto';

@Injectable()
export class ReactionsService {
  private readonly logger = new Logger(ReactionsService.name);

  constructor(
    private readonly repository: ReactionsRepository,
    private readonly snippetsRepository: SnippetsRepository,
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
    const snippet = await this.snippetsRepository.findById(snippetId);

    if (!snippet) {
      throw new NotFoundException('Snippet not found');
    }

    if (!snippet.isPublic) {
      if (!user || (snippet.userId !== user.id && user.role !== 'ADMIN')) {
        throw new NotFoundException('Snippet not found');
      }
    }
  }

  /**
   * Set a reaction on a snippet (idempotent)
   */
  async set(
    snippetId: string,
    user: SafeUser,
    type: ReactionType,
  ): Promise<{ ok: true }> {
    await this.assertSnippetReadable(snippetId, user);
    await this.repository.add(snippetId, user.id, type);
    return { ok: true };
  }

  /**
   * Remove a reaction from a snippet (idempotent)
   */
  async remove(
    snippetId: string,
    user: SafeUser,
    type: ReactionType,
  ): Promise<void> {
    await this.assertSnippetReadable(snippetId, user);
    await this.repository.remove(snippetId, user.id, type);
  }

  /**
   * Get aggregated reaction counts + optional viewer info
   */
  async getReactions(
    snippetId: string,
    user?: SafeUser,
  ): Promise<{ counts: Record<string, number>; viewer?: string[] }> {
    await this.assertSnippetReadable(snippetId, user);

    const counts = await this.repository.counts(snippetId);

    if (user) {
      const viewer = await this.repository.userReactions(snippetId, user.id);
      return { counts, viewer };
    }

    return { counts };
  }
}
