import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReactionsRepository } from '../../../src/modules/reactions/reactions.repository';
import { ReactionsService } from '../../../src/modules/reactions/reactions.service';
import { SnippetsRepository } from '../../../src/modules/snippets/snippets.repository';
import {
  createMockReactionsRepository,
  type MockReactionsRepository,
} from '../../mocks/reactions.mock';
import { createMockSnippet } from '../../mocks/snippets.mock';
import { type SafeUser } from '../../../src/modules/users';

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

describe('ReactionsService', () => {
  let service: ReactionsService;
  let repository: MockReactionsRepository;
  let snippetsRepository: { findById: jest.Mock };

  beforeEach(async () => {
    repository = createMockReactionsRepository();
    snippetsRepository = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        { provide: ReactionsRepository, useValue: repository },
        { provide: SnippetsRepository, useValue: snippetsRepository },
      ],
    }).compile();

    service = module.get<ReactionsService>(ReactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // SET REACTION
  // ============================================================

  describe('set', () => {
    it('sets a reaction on a public snippet', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.add.mockResolvedValue(undefined);

      const result = await service.set(snippet.id, ownerUser, 'like');

      expect(result).toEqual({ ok: true });
      expect(repository.add).toHaveBeenCalledWith(
        snippet.id,
        ownerUser.id,
        'like',
      );
    });

    it('is idempotent - duplicate set returns ok', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.add.mockResolvedValue(undefined);

      const result = await service.set(snippet.id, ownerUser, 'like');
      expect(result).toEqual({ ok: true });
    });

    it('throws 404 for nonexistent snippet', async () => {
      snippetsRepository.findById.mockResolvedValue(null);

      await expect(
        service.set('nonexistent', ownerUser, 'like'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for private snippet from foreign user', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);

      await expect(
        service.set(snippet.id, foreignUser, 'like'),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows owner to react on own private snippet', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.add.mockResolvedValue(undefined);

      const result = await service.set(snippet.id, ownerUser, 'star');
      expect(result).toEqual({ ok: true });
    });

    it('allows admin to react on private snippet', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.add.mockResolvedValue(undefined);

      const result = await service.set(snippet.id, adminUser, 'love');
      expect(result).toEqual({ ok: true });
    });
  });

  // ============================================================
  // REMOVE REACTION
  // ============================================================

  describe('remove', () => {
    it('removes a reaction from a public snippet', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.remove.mockResolvedValue(undefined);

      await service.remove(snippet.id, ownerUser, 'like');

      expect(repository.remove).toHaveBeenCalledWith(
        snippet.id,
        ownerUser.id,
        'like',
      );
    });

    it('is idempotent - removing nonexistent reaction does not throw', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.remove.mockResolvedValue(undefined);

      await expect(
        service.remove(snippet.id, ownerUser, 'like'),
      ).resolves.toBeUndefined();
    });

    it('throws 404 for nonexistent snippet', async () => {
      snippetsRepository.findById.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent', ownerUser, 'like'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for private snippet from foreign user', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);

      await expect(
        service.remove(snippet.id, foreignUser, 'like'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // GET REACTIONS
  // ============================================================

  describe('getReactions', () => {
    it('returns counts for a public snippet without auth', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.counts.mockResolvedValue({ like: 5, star: 2 });

      const result = await service.getReactions(snippet.id);

      expect(result).toEqual({ counts: { like: 5, star: 2 } });
      expect(result).not.toHaveProperty('viewer');
    });

    it('returns counts and viewer info when user is authenticated', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.counts.mockResolvedValue({ like: 5, star: 2 });
      repository.userReactions.mockResolvedValue(['like']);

      const result = await service.getReactions(snippet.id, ownerUser);

      expect(result).toEqual({
        counts: { like: 5, star: 2 },
        viewer: ['like'],
      });
    });

    it('returns empty counts when no reactions exist', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.counts.mockResolvedValue({});

      const result = await service.getReactions(snippet.id);

      expect(result).toEqual({ counts: {} });
    });

    it('throws 404 for nonexistent snippet', async () => {
      snippetsRepository.findById.mockResolvedValue(null);

      await expect(
        service.getReactions('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for private snippet without auth', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);

      await expect(
        service.getReactions(snippet.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows owner to get reactions on private snippet', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.counts.mockResolvedValue({ like: 1 });
      repository.userReactions.mockResolvedValue(['like']);

      const result = await service.getReactions(snippet.id, ownerUser);

      expect(result).toEqual({
        counts: { like: 1 },
        viewer: ['like'],
      });
    });

    it('allows admin to get reactions on private snippet', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.counts.mockResolvedValue({});
      repository.userReactions.mockResolvedValue([]);

      const result = await service.getReactions(snippet.id, adminUser);

      expect(result).toEqual({
        counts: {},
        viewer: [],
      });
    });

    it('throws 404 for private snippet from foreign user', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);

      await expect(
        service.getReactions(snippet.id, foreignUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
