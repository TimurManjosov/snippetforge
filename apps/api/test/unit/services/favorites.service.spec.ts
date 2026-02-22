import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesRepository } from '../../../src/modules/favorites/favorites.repository';
import { FavoritesService } from '../../../src/modules/favorites/favorites.service';
import { SnippetsRepository } from '../../../src/modules/snippets/snippets.repository';
import {
  createMockFavoritesRepository,
  type MockFavoritesRepository,
} from '../../mocks/favorites.mock';
import { createMockSnippet, createMockSnippetPreview } from '../../mocks/snippets.mock';
import { type SafeUser } from '../../../src/modules/users';
import { calculatePaginationMeta } from '../../../src/modules/snippets/snippets.types';

const ownerUser: SafeUser = {
  id: 'user-test-id-123',
  email: 'owner@test.com',
  username: 'owner',
  bio: null,
  avatarUrl: null,
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const adminUser: SafeUser = {
  id: 'admin-test-id-456',
  email: 'admin@test.com',
  username: 'admin',
  bio: null,
  avatarUrl: null,
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const foreignUser: SafeUser = {
  id: 'foreign-test-id-789',
  email: 'foreign@test.com',
  username: 'foreign',
  bio: null,
  avatarUrl: null,
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FavoritesService', () => {
  let service: FavoritesService;
  let repository: MockFavoritesRepository;
  let snippetsRepository: { findById: jest.Mock };

  beforeEach(async () => {
    repository = createMockFavoritesRepository();
    snippetsRepository = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: FavoritesRepository, useValue: repository },
        { provide: SnippetsRepository, useValue: snippetsRepository },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // ADD FAVORITE
  // ============================================================

  describe('addFavorite', () => {
    it('adds a favorite on a public snippet', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.add.mockResolvedValue(undefined);

      const result = await service.addFavorite(ownerUser, snippet.id);

      expect(result).toEqual({ ok: true });
      expect(repository.add).toHaveBeenCalledWith(ownerUser.id, snippet.id);
    });

    it('is idempotent - duplicate add returns ok (onConflictDoNothing)', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.add.mockResolvedValue(undefined);

      const result = await service.addFavorite(ownerUser, snippet.id);
      expect(result).toEqual({ ok: true });
    });

    it('throws 404 when snippet not readable (nonexistent)', async () => {
      snippetsRepository.findById.mockResolvedValue(null);

      await expect(
        service.addFavorite(ownerUser, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when snippet is private and user is not owner', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);

      await expect(
        service.addFavorite(foreignUser, snippet.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows owner to favorite own private snippet', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.add.mockResolvedValue(undefined);

      const result = await service.addFavorite(ownerUser, snippet.id);
      expect(result).toEqual({ ok: true });
    });

    it('allows admin to favorite a private snippet', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.add.mockResolvedValue(undefined);

      const result = await service.addFavorite(adminUser, snippet.id);
      expect(result).toEqual({ ok: true });
    });
  });

  // ============================================================
  // REMOVE FAVORITE
  // ============================================================

  describe('removeFavorite', () => {
    it('removes a favorite', async () => {
      repository.remove.mockResolvedValue(undefined);

      await service.removeFavorite(ownerUser, 'snippet-123');

      expect(repository.remove).toHaveBeenCalledWith(ownerUser.id, 'snippet-123');
    });

    it('is idempotent - removing nonexistent favorite does not throw', async () => {
      repository.remove.mockResolvedValue(undefined);

      await expect(
        service.removeFavorite(ownerUser, 'nonexistent'),
      ).resolves.toBeUndefined();
    });
  });

  // ============================================================
  // LIST FAVORITES
  // ============================================================

  describe('listFavorites', () => {
    it('returns paginated favorites', async () => {
      const preview = createMockSnippetPreview();
      const meta = calculatePaginationMeta(1, 1, 20);
      repository.listByUser.mockResolvedValue({ items: [preview], meta });

      const result = await service.listFavorites(ownerUser, 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual(meta);
      expect(repository.listByUser).toHaveBeenCalledWith(ownerUser.id, 1, 20);
    });

    it('clamps limit to max 50', async () => {
      const meta = calculatePaginationMeta(0, 1, 50);
      repository.listByUser.mockResolvedValue({ items: [], meta });

      await service.listFavorites(ownerUser, 1, 100);

      expect(repository.listByUser).toHaveBeenCalledWith(ownerUser.id, 1, 50);
    });

    it('defaults page to 1 and limit to 20', async () => {
      const meta = calculatePaginationMeta(0, 1, 20);
      repository.listByUser.mockResolvedValue({ items: [], meta });

      await service.listFavorites(ownerUser);

      expect(repository.listByUser).toHaveBeenCalledWith(ownerUser.id, 1, 20);
    });
  });
});
