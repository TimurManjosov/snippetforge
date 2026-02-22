import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type SafeUser } from '../users';
import { SnippetsRepository } from '../snippets/snippets.repository';
import {
  FavoritesRepository,
  type PaginatedFavorites,
} from './favorites.repository';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    private readonly repository: FavoritesRepository,
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
   * Add a snippet to favorites (idempotent)
   */
  async addFavorite(user: SafeUser, snippetId: string): Promise<{ ok: true }> {
    await this.assertSnippetReadable(snippetId, user);
    await this.repository.add(user.id, snippetId);
    return { ok: true };
  }

  /**
   * Remove a snippet from favorites (idempotent)
   */
  async removeFavorite(user: SafeUser, snippetId: string): Promise<void> {
    await this.repository.remove(user.id, snippetId);
  }

  /**
   * List user's favorites with snippet previews
   * ANNAHME: max limit = 50
   */
  async listFavorites(
    user: SafeUser,
    page = 1,
    limit = 20,
  ): Promise<PaginatedFavorites> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 50);

    return this.repository.listByUser(user.id, safePage, safeLimit);
  }
}
