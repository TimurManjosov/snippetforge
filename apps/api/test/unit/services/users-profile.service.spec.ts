import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { UsersService } from '../../../src/modules/users/users.service';
import {
  createMockUsersRepository,
  type MockUsersRepository,
} from '../../mocks';

/**
 * UsersService – Profile & Stats Unit Tests
 */
describe('UsersService – Profile & Stats', () => {
  let service: UsersService;
  let repository: MockUsersRepository;

  const mockPublicUser = {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    username: 'testuser',
    displayName: 'Test User',
    bio: 'Hello world',
    avatarUrl: null,
    websiteUrl: 'https://example.com',
    createdAt: new Date(),
  };

  const mockPrivateUser = {
    ...mockPublicUser,
    email: 'test@example.com',
  };

  const mockStats = {
    userId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    publicSnippetCount: 5,
    commentCount: 12,
    reactionGivenCount: 3,
  };

  beforeEach(async () => {
    repository = createMockUsersRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // getPublicProfile
  // ============================================================

  describe('getPublicProfile', () => {
    it('should return public user if found', async () => {
      repository.findPublicById.mockResolvedValue(mockPublicUser);

      const result = await service.getPublicProfile(mockPublicUser.id);

      expect(repository.findPublicById).toHaveBeenCalledWith(mockPublicUser.id);
      expect(result).toEqual(mockPublicUser);
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findPublicById.mockResolvedValue(undefined);

      await expect(
        service.getPublicProfile('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for valid UUID that does not exist', async () => {
      repository.findPublicById.mockResolvedValue(undefined);

      await expect(
        service.getPublicProfile('11111111-1111-1111-1111-111111111111'),
      ).rejects.toThrow('User not found');
    });
  });

  // ============================================================
  // getMe
  // ============================================================

  describe('getMe', () => {
    it('should return private user with email if found', async () => {
      repository.findPrivateById.mockResolvedValue(mockPrivateUser);

      const result = await service.getMe(mockPrivateUser.id);

      expect(repository.findPrivateById).toHaveBeenCalledWith(
        mockPrivateUser.id,
      );
      expect(result).toEqual(mockPrivateUser);
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findPrivateById.mockResolvedValue(undefined);

      await expect(
        service.getMe('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // getStats
  // ============================================================

  describe('getStats', () => {
    it('should throw NotFoundException if user not found', async () => {
      repository.findPublicById.mockResolvedValue(undefined);

      await expect(
        service.getStats('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return numeric counts (publicSnippetCount, commentCount, reactionGivenCount)', async () => {
      repository.findPublicById.mockResolvedValue(mockPublicUser);
      repository.stats.mockResolvedValue(mockStats);

      const result = await service.getStats(mockPublicUser.id);

      expect(result.publicSnippetCount).toBe(5);
      expect(result.commentCount).toBe(12);
      expect(result.reactionGivenCount).toBe(3);
      expect(typeof result.publicSnippetCount).toBe('number');
      expect(typeof result.commentCount).toBe('number');
      expect(typeof result.reactionGivenCount).toBe('number');
    });

    it('should return 0 counts for new user with no activity', async () => {
      const zeroCounts = {
        userId: mockPublicUser.id,
        publicSnippetCount: 0,
        commentCount: 0,
        reactionGivenCount: 0,
      };
      repository.findPublicById.mockResolvedValue(mockPublicUser);
      repository.stats.mockResolvedValue(zeroCounts);

      const result = await service.getStats(mockPublicUser.id);

      expect(result.publicSnippetCount).toBe(0);
      expect(result.commentCount).toBe(0);
      expect(result.reactionGivenCount).toBe(0);
    });

    it('should call existence check before stats query', async () => {
      repository.findPublicById.mockResolvedValue(mockPublicUser);
      repository.stats.mockResolvedValue(mockStats);

      await service.getStats(mockPublicUser.id);

      expect(repository.findPublicById).toHaveBeenCalledWith(mockPublicUser.id);
      expect(repository.stats).toHaveBeenCalledWith(mockPublicUser.id);
    });

    it('should handle COUNT() string-to-number conversion via Number()', async () => {
      const statsWithStringCounts = {
        userId: mockPublicUser.id,
        publicSnippetCount: Number('42'),
        commentCount: Number('0'),
        reactionGivenCount: Number('7'),
      };
      repository.findPublicById.mockResolvedValue(mockPublicUser);
      repository.stats.mockResolvedValue(statsWithStringCounts);

      const result = await service.getStats(mockPublicUser.id);

      expect(typeof result.publicSnippetCount).toBe('number');
      expect(typeof result.commentCount).toBe('number');
      expect(typeof result.reactionGivenCount).toBe('number');
    });
  });
});
