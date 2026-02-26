import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsRepository } from '../../../src/modules/collections/collections.repository';
import { CollectionsService } from '../../../src/modules/collections/collections.service';
import { SnippetsRepository } from '../../../src/modules/snippets/snippets.repository';
import {
  createMockCollectionsRepository,
  createMockCollection,
  type MockCollectionsRepository,
} from '../../mocks/collections.mock';
import { createMockSnippet } from '../../mocks/snippets.mock';
import { type SafeUser } from '../../../src/modules/users';
import { calculatePaginationMeta } from '../../../src/modules/snippets/snippets.types';

const ownerUser: SafeUser = {
  id: 'user-test-id-123',
  email: 'owner@test.com',
  username: 'owner',
  displayName: null,
  bio: null,
  avatarUrl: null,
  websiteUrl: null,
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const adminUser: SafeUser = {
  id: 'admin-test-id-456',
  email: 'admin@test.com',
  username: 'admin',
  displayName: null,
  bio: null,
  avatarUrl: null,
  websiteUrl: null,
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const foreignUser: SafeUser = {
  id: 'foreign-test-id-789',
  email: 'foreign@test.com',
  username: 'foreign',
  displayName: null,
  bio: null,
  avatarUrl: null,
  websiteUrl: null,
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CollectionsService', () => {
  let service: CollectionsService;
  let repository: MockCollectionsRepository;
  let snippetsRepository: { findById: jest.Mock };

  beforeEach(async () => {
    repository = createMockCollectionsRepository();
    snippetsRepository = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: CollectionsRepository, useValue: repository },
        { provide: SnippetsRepository, useValue: snippetsRepository },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('creates a collection successfully', async () => {
      const collection = createMockCollection();
      repository.create.mockResolvedValue(collection);

      const result = await service.create(ownerUser, {
        name: 'Test Collection',
        description: 'A test collection',
        isPublic: false,
      });

      expect(result).toEqual(collection);
    });

    it('throws 409 on duplicate name', async () => {
      const error = new Error('unique violation');
      (error as any).code = '23505';
      repository.create.mockRejectedValue(error);

      await expect(
        service.create(ownerUser, { name: 'Duplicate', isPublic: false }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============================================================
  // LIST MINE
  // ============================================================

  describe('listMine', () => {
    it('returns collections for the current user', async () => {
      const collections = [createMockCollection()];
      repository.listByUser.mockResolvedValue(collections);

      const result = await service.listMine(ownerUser);

      expect(result).toEqual(collections);
      expect(repository.listByUser).toHaveBeenCalledWith(ownerUser.id);
    });
  });

  // ============================================================
  // GET BY ID FOR VIEWER
  // ============================================================

  describe('getByIdForViewer', () => {
    it('returns a public collection without viewer', async () => {
      const collection = createMockCollection({ isPublic: true });
      repository.getById.mockResolvedValue(collection);
      repository.listItemsWithSnippetPreview.mockResolvedValue({
        items: [],
        meta: calculatePaginationMeta(0, 1, 20),
      });

      const result = await service.getByIdForViewer(collection.id);

      expect(result.collection).toEqual(collection);
    });

    it('returns a private collection for the owner', async () => {
      const collection = createMockCollection({
        isPublic: false,
        userId: ownerUser.id,
      });
      repository.getById.mockResolvedValue(collection);
      repository.listItemsWithSnippetPreview.mockResolvedValue({
        items: [],
        meta: calculatePaginationMeta(0, 1, 20),
      });

      const result = await service.getByIdForViewer(collection.id, ownerUser);

      expect(result.collection).toEqual(collection);
    });

    it('returns a private collection for admin', async () => {
      const collection = createMockCollection({
        isPublic: false,
        userId: ownerUser.id,
      });
      repository.getById.mockResolvedValue(collection);
      repository.listItemsWithSnippetPreview.mockResolvedValue({
        items: [],
        meta: calculatePaginationMeta(0, 1, 20),
      });

      const result = await service.getByIdForViewer(collection.id, adminUser);

      expect(result.collection).toEqual(collection);
    });

    it('throws 404 for private collection without viewer', async () => {
      const collection = createMockCollection({ isPublic: false });
      repository.getById.mockResolvedValue(collection);

      await expect(service.getByIdForViewer(collection.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 for private collection with non-owner', async () => {
      const collection = createMockCollection({
        isPublic: false,
        userId: ownerUser.id,
      });
      repository.getById.mockResolvedValue(collection);

      await expect(
        service.getByIdForViewer(collection.id, foreignUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for nonexistent collection', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(service.getByIdForViewer('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('updates a collection as owner', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      const updated = { ...collection, name: 'Updated Name' };
      repository.getById.mockResolvedValue(collection);
      repository.update.mockResolvedValue(updated);

      const result = await service.update(ownerUser, collection.id, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('throws 404 for non-owner', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);

      await expect(
        service.update(foreignUser, collection.id, { name: 'Hijack' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for nonexistent collection', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(
        service.update(ownerUser, 'nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 409 on duplicate name', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);
      const error = new Error('unique violation');
      (error as any).code = '23505';
      repository.update.mockRejectedValue(error);

      await expect(
        service.update(ownerUser, collection.id, { name: 'Duplicate' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============================================================
  // DELETE
  // ============================================================

  describe('delete', () => {
    it('deletes a collection as owner', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);
      repository.delete.mockResolvedValue(true);

      await service.delete(ownerUser, collection.id);

      expect(repository.delete).toHaveBeenCalledWith(collection.id);
    });

    it('throws 404 for non-owner', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);

      await expect(service.delete(foreignUser, collection.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 for nonexistent collection', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(service.delete(ownerUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows admin to delete any collection', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);
      repository.delete.mockResolvedValue(true);

      await service.delete(adminUser, collection.id);

      expect(repository.delete).toHaveBeenCalledWith(collection.id);
    });
  });

  // ============================================================
  // ADD ITEM
  // ============================================================

  describe('addItem', () => {
    it('adds a snippet to a collection as owner', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      const snippet = createMockSnippet({ isPublic: true });
      repository.getById.mockResolvedValue(collection);
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.addItem.mockResolvedValue({ inserted: true, position: 1 });

      const result = await service.addItem(
        ownerUser,
        collection.id,
        snippet.id,
      );

      expect(result).toEqual({ ok: true, position: 1 });
    });

    it('throws 404 when snippet not readable', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);
      snippetsRepository.findById.mockResolvedValue(null);

      await expect(
        service.addItem(ownerUser, collection.id, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when snippet is private and user is not owner of snippet', async () => {
      const collection = createMockCollection({ userId: foreignUser.id });
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      repository.getById.mockResolvedValue(collection);
      snippetsRepository.findById.mockResolvedValue(snippet);

      await expect(
        service.addItem(foreignUser, collection.id, snippet.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for non-owner of collection', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);

      await expect(
        service.addItem(foreignUser, collection.id, 'snippet-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('is idempotent - duplicate add returns ok', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      const snippet = createMockSnippet({ isPublic: true });
      repository.getById.mockResolvedValue(collection);
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.addItem.mockResolvedValue({ inserted: false, position: 1 });

      const result = await service.addItem(
        ownerUser,
        collection.id,
        snippet.id,
      );

      expect(result).toEqual({ ok: true, position: 1 });
    });

    it('increments position: if max=3 then inserted position=4', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      const snippet = createMockSnippet({ isPublic: true });
      repository.getById.mockResolvedValue(collection);
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.addItem.mockResolvedValue({ inserted: true, position: 4 });

      const result = await service.addItem(
        ownerUser,
        collection.id,
        snippet.id,
      );

      expect(result.position).toBe(4);
    });
  });

  // ============================================================
  // REMOVE ITEM
  // ============================================================

  describe('removeItem', () => {
    it('removes a snippet from a collection as owner', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);
      repository.removeItem.mockResolvedValue(undefined);

      await service.removeItem(ownerUser, collection.id, 'snippet-123');

      expect(repository.removeItem).toHaveBeenCalledWith(
        collection.id,
        'snippet-123',
      );
    });

    it('throws 404 for non-owner', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);

      await expect(
        service.removeItem(foreignUser, collection.id, 'snippet-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for nonexistent collection', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(
        service.removeItem(ownerUser, 'nonexistent', 'snippet-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('is idempotent - removing nonexistent item does not throw', async () => {
      const collection = createMockCollection({ userId: ownerUser.id });
      repository.getById.mockResolvedValue(collection);
      repository.removeItem.mockResolvedValue(undefined);

      await expect(
        service.removeItem(ownerUser, collection.id, 'nonexistent-snippet'),
      ).resolves.toBeUndefined();
    });
  });
});
