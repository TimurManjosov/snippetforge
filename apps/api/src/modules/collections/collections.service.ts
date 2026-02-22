import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type SafeUser } from '../users';
import { SnippetsRepository } from '../snippets/snippets.repository';
import {
  CollectionsRepository,
  type PaginatedCollectionItems,
} from './collections.repository';
import { type CreateCollectionDto, type UpdateCollectionDto } from './dto';
import { type Collection } from '../../lib/db/schema';

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(
    private readonly repository: CollectionsRepository,
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
   * Asserts the collection is accessible by the viewer.
   * Public: anyone can view.
   * Private: only owner or ADMIN, otherwise 404 (anti-enumeration).
   */
  private assertCollectionReadable(
    collection: Collection,
    viewer?: SafeUser,
  ): void {
    if (collection.isPublic) return;

    if (
      !viewer ||
      (collection.userId !== viewer.id && viewer.role !== 'ADMIN')
    ) {
      throw new NotFoundException('Collection not found');
    }
  }

  /**
   * Asserts the user is the owner or admin of the collection, else 404.
   */
  private assertOwnerOrAdmin(collection: Collection, user: SafeUser): void {
    if (collection.userId !== user.id && user.role !== 'ADMIN') {
      throw new NotFoundException('Collection not found');
    }
  }

  /**
   * Create a new collection
   */
  async create(user: SafeUser, dto: CreateCollectionDto): Promise<Collection> {
    try {
      return await this.repository.create(user.id, dto);
    } catch (error: unknown) {
      // Handle UNIQUE(userId, name) violation
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        throw new ConflictException('Collection name already exists');
      }
      throw error;
    }
  }

  /**
   * List collections owned by the current user
   */
  async listMine(user: SafeUser): Promise<Collection[]> {
    return this.repository.listByUser(user.id);
  }

  /**
   * Get a collection by ID for a viewer (public or owner/admin)
   * ANNAHME: default page=1, limit=20 for items
   */
  async getByIdForViewer(
    id: string,
    viewer?: SafeUser,
    page = 1,
    limit = 20,
  ): Promise<{
    collection: Collection;
    items: PaginatedCollectionItems['items'];
    meta: PaginatedCollectionItems['meta'];
  }> {
    const collection = await this.repository.getById(id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    this.assertCollectionReadable(collection, viewer);

    const { items, meta } = await this.repository.listItemsWithSnippetPreview(
      id,
      page,
      limit,
    );

    return { collection, items, meta };
  }

  /**
   * Update a collection (owner/admin only)
   */
  async update(
    user: SafeUser,
    id: string,
    dto: UpdateCollectionDto,
  ): Promise<Collection> {
    const collection = await this.repository.getById(id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    this.assertOwnerOrAdmin(collection, user);

    try {
      const updated = await this.repository.update(id, dto);
      if (!updated) {
        throw new NotFoundException('Collection not found');
      }
      return updated;
    } catch (error: unknown) {
      // Handle UNIQUE(userId, name) violation
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        throw new ConflictException('Collection name already exists');
      }
      throw error;
    }
  }

  /**
   * Delete a collection (owner/admin only)
   */
  async delete(user: SafeUser, id: string): Promise<void> {
    const collection = await this.repository.getById(id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    this.assertOwnerOrAdmin(collection, user);

    await this.repository.delete(id);
  }

  /**
   * Add a snippet to a collection (owner/admin only, idempotent)
   */
  async addItem(
    user: SafeUser,
    collectionId: string,
    snippetId: string,
  ): Promise<{ ok: true; position: number }> {
    const collection = await this.repository.getById(collectionId);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    this.assertOwnerOrAdmin(collection, user);

    await this.assertSnippetReadable(snippetId, user);

    const { position } = await this.repository.addItem(collectionId, snippetId);

    return { ok: true, position };
  }

  /**
   * Remove a snippet from a collection (owner/admin only, idempotent)
   */
  async removeItem(
    user: SafeUser,
    collectionId: string,
    snippetId: string,
  ): Promise<void> {
    const collection = await this.repository.getById(collectionId);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    this.assertOwnerOrAdmin(collection, user);

    await this.repository.removeItem(collectionId, snippetId);
  }
}
