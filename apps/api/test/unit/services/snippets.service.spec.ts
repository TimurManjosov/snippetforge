// test/unit/services/snippets.service.spec.ts

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SnippetsRepository } from '../../../src/modules/snippets/snippets.repository';
import { SnippetsService } from '../../../src/modules/snippets/snippets.service';
import {
  createMockSnippet,
  createMockSnippetsRepository,
  type MockSnippetsRepository,
} from '../../mocks';

/**
 * SnippetsService Unit Tests
 *
 * Tests:
 * - Business Logic (Ownership, Public/Private)
 * - Error Handling (NotFoundException, ForbiddenException)
 * - Input Validation
 * - Orchestration of Repository Calls
 */
describe('SnippetsService', () => {
  let service: SnippetsService;
  let repository: MockSnippetsRepository;

  const mockSnippet = createMockSnippet();
  const ownerId = 'owner-user-id';
  const otherUserId = 'other-user-id';

  beforeEach(async () => {
    repository = createMockSnippetsRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnippetsService,
        {
          provide: SnippetsRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<SnippetsService>(SnippetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should create a new snippet', async () => {
      // Arrange
      const dto = {
        title: 'Test Snippet',
        code: 'console.log("test")',
        language: 'javascript',
      };
      repository.create.mockResolvedValue(mockSnippet);

      // Act
      const result = await service.create(ownerId, dto);

      // Assert
      expect(result).toEqual(mockSnippet);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        userId: ownerId,
        isPublic: true, // Default
      });
    });

    it('should use provided isPublic value', async () => {
      // Arrange
      const dto = {
        title: 'Private Snippet',
        code: 'console.log("secret")',
        language: 'javascript',
        isPublic: false,
      };
      repository.create.mockResolvedValue(mockSnippet);

      // Act
      await service.create(ownerId, dto);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic: false }),
      );
    });

    it('should throw BadRequestException for empty code', async () => {
      // Arrange
      const dto = {
        title: 'Test',
        code: '   ', // Only whitespace
        language: 'javascript',
      };

      // Act & Assert
      await expect(service.create(ownerId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(ownerId, dto)).rejects.toThrow(
        'Code cannot be empty or contain only whitespace',
      );
    });

    it('should throw BadRequestException for code > 50000 chars', async () => {
      // Arrange
      const dto = {
        title: 'Test',
        code: 'x'.repeat(50001),
        language: 'javascript',
      };

      // Act & Assert
      await expect(service.create(ownerId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(ownerId, dto)).rejects.toThrow(
        'Code exceeds maximum length of 50,000 characters',
      );
    });

    it('should throw BadRequestException for empty title', async () => {
      // Arrange
      const dto = {
        title: '   ', // Only whitespace
        code: 'console.log("test")',
        language: 'javascript',
      };

      // Act & Assert
      await expect(service.create(ownerId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(ownerId, dto)).rejects.toThrow(
        'Title cannot be empty or contain only whitespace',
      );
    });
  });

  // ============================================================
  // READ - SINGLE
  // ============================================================

  describe('findById', () => {
    it('should return public snippet without userId', async () => {
      // Arrange
      const publicSnippet = createMockSnippet({ isPublic: true });
      repository.findById.mockResolvedValue(publicSnippet);

      // Act
      const result = await service.findById('snippet-id');

      // Assert
      expect(result).toEqual(publicSnippet);
    });

    it('should return public snippet with any userId', async () => {
      // Arrange
      const publicSnippet = createMockSnippet({
        isPublic: true,
        userId: ownerId,
      });
      repository.findById.mockResolvedValue(publicSnippet);

      // Act
      const result = await service.findById('snippet-id', otherUserId);

      // Assert
      expect(result).toEqual(publicSnippet);
    });

    it('should return private snippet for owner', async () => {
      // Arrange
      const privateSnippet = createMockSnippet({
        isPublic: false,
        userId: ownerId,
      });
      repository.findById.mockResolvedValue(privateSnippet);

      // Act
      const result = await service.findById('snippet-id', ownerId);

      // Assert
      expect(result).toEqual(privateSnippet);
    });

    it('should throw ForbiddenException for private snippet of other user', async () => {
      // Arrange
      const privateSnippet = createMockSnippet({
        isPublic: false,
        userId: ownerId,
      });
      repository.findById.mockResolvedValue(privateSnippet);

      // Act & Assert
      await expect(service.findById('snippet-id', otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findById('snippet-id', otherUserId)).rejects.toThrow(
        'You do not have access to this snippet',
      );
    });

    it('should throw NotFoundException when snippet not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('nonexistent')).rejects.toThrow(
        'Snippet with ID nonexistent not found',
      );
    });
  });

  describe('findByIdAndIncrementViews', () => {
    it('should return snippet with tags and increment views', async () => {
      // Arrange
      const publicSnippet = createMockSnippet({ isPublic: true });
      repository.findById.mockResolvedValue(publicSnippet);
      repository.incrementViewCount.mockResolvedValue(true);
      repository.findTagSlugsForSnippet.mockResolvedValue([
        'javascript',
        'typescript',
      ]);

      // Act
      const result = await service.findByIdAndIncrementViews('snippet-id');

      // Assert
      expect(result).toEqual({
        ...publicSnippet,
        tags: ['javascript', 'typescript'],
      });
      expect(repository.findTagSlugsForSnippet).toHaveBeenCalledWith(
        'snippet-id',
      );
    });

    it('should not fail if incrementViewCount fails', async () => {
      // Arrange
      const publicSnippet = createMockSnippet({ isPublic: true });
      repository.findById.mockResolvedValue(publicSnippet);
      repository.incrementViewCount.mockRejectedValue(new Error('DB Error'));
      repository.findTagSlugsForSnippet.mockResolvedValue([]);

      // Act - Should NOT throw
      const result = await service.findByIdAndIncrementViews('snippet-id');

      // Assert
      expect(result).toEqual({ ...publicSnippet, tags: [] });
    });
  });

  // ============================================================
  // READ - LISTS
  // ============================================================

  describe('findUserSnippets', () => {
    it('should return user snippets', async () => {
      // Arrange
      const snippets = [mockSnippet];
      repository.findByUserId.mockResolvedValue(snippets);

      // Act
      const result = await service.findUserSnippets(ownerId);

      // Assert
      expect(result).toEqual(snippets);
      expect(repository.findByUserId).toHaveBeenCalledWith(ownerId, 20);
    });

    it('should use custom limit', async () => {
      // Arrange
      repository.findByUserId.mockResolvedValue([]);

      // Act
      await service.findUserSnippets(ownerId, 50);

      // Assert
      expect(repository.findByUserId).toHaveBeenCalledWith(ownerId, 50);
    });
  });

  describe('findPublicSnippets', () => {
    it('should return paginated public snippets', async () => {
      // Arrange
      const paginatedResult = {
        data: [mockSnippet],
        meta: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      };
      repository.findPublic.mockResolvedValue(paginatedResult);

      // Act
      const result = await service.findPublicSnippets(1, 20);

      // Assert
      expect(result).toEqual(paginatedResult);
    });

    it('should enforce minimum page of 1', async () => {
      // Arrange

      repository.findPublic.mockResolvedValue({ data: [], meta: {} as any });

      // Act
      await service.findPublicSnippets(0, 20);

      // Assert
      expect(repository.findPublic).toHaveBeenCalledWith(1, 20);
    });

    it('should enforce maximum limit of 100', async () => {
      // Arrange

      repository.findPublic.mockResolvedValue({ data: [], meta: {} as any });

      // Act
      await service.findPublicSnippets(1, 200);

      // Assert
      expect(repository.findPublic).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('listPublicWithQuery', () => {
    it('should delegate normalized query to repository searchPublic', async () => {
      const query = {
        q: 'react',
        tags: ['typescript', 'nodejs'],
        language: 'typescript',
        sort: 'views' as const,
        order: 'desc' as const,
        page: 1,
        limit: 20,
      };
      const paginatedResult = {
        items: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      repository.searchPublic.mockResolvedValue(paginatedResult);

      const result = await service.listPublicWithQuery(query);

      expect(result).toEqual(paginatedResult);
      expect(repository.searchPublic).toHaveBeenCalledWith(query);
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update own snippet', async () => {
      // Arrange
      const existingSnippet = createMockSnippet({ userId: ownerId });
      const updatedSnippet = { ...existingSnippet, title: 'Updated' };
      repository.findById.mockResolvedValue(existingSnippet);
      repository.update.mockResolvedValue(updatedSnippet);

      // Act
      const result = await service.update('snippet-id', ownerId, 'USER', {
        title: 'Updated',
      });

      // Assert
      expect(result.title).toBe('Updated');
      expect(repository.update).toHaveBeenCalledWith('snippet-id', {
        title: 'Updated',
      });
    });

    it('should throw ForbiddenException when updating other user snippet', async () => {
      // Arrange
      const existingSnippet = createMockSnippet({ userId: ownerId });
      repository.findById.mockResolvedValue(existingSnippet);

      // Act & Assert
      await expect(
        service.update('snippet-id', otherUserId, 'USER', { title: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('snippet-id', otherUserId, 'USER', { title: 'Updated' }),
      ).rejects.toThrow('You can only modify your own snippets');
    });

    it('should allow ADMIN to update any snippet', async () => {
      // Arrange
      const existingSnippet = createMockSnippet({ userId: ownerId });
      const updatedSnippet = { ...existingSnippet, title: 'Admin Updated' };
      repository.findById.mockResolvedValue(existingSnippet);
      repository.update.mockResolvedValue(updatedSnippet);

      // Act
      const result = await service.update('snippet-id', otherUserId, 'ADMIN', {
        title: 'Admin Updated',
      });

      // Assert
      expect(result.title).toBe('Admin Updated');
    });

    it('should throw NotFoundException when snippet not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('nonexistent', ownerId, 'USER', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate new data', async () => {
      // Arrange
      const existingSnippet = createMockSnippet({ userId: ownerId });
      repository.findById.mockResolvedValue(existingSnippet);

      // Act & Assert - Empty title
      await expect(
        service.update('snippet-id', ownerId, 'USER', { title: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('togglePublic', () => {
    it('should toggle public to private', async () => {
      // Arrange
      const publicSnippet = createMockSnippet({
        userId: ownerId,
        isPublic: true,
      });
      const privateSnippet = { ...publicSnippet, isPublic: false };
      repository.findById.mockResolvedValue(publicSnippet);
      repository.update.mockResolvedValue(privateSnippet);

      // Act
      const result = await service.togglePublic('snippet-id', ownerId, 'USER');

      // Assert
      expect(result.isPublic).toBe(false);
      expect(repository.update).toHaveBeenCalledWith('snippet-id', {
        isPublic: false,
      });
    });

    it('should toggle private to public', async () => {
      // Arrange
      const privateSnippet = createMockSnippet({
        userId: ownerId,
        isPublic: false,
      });
      const publicSnippet = { ...privateSnippet, isPublic: true };
      repository.findById.mockResolvedValue(privateSnippet);
      repository.update.mockResolvedValue(publicSnippet);

      // Act
      const result = await service.togglePublic('snippet-id', ownerId, 'USER');

      // Assert
      expect(result.isPublic).toBe(true);
    });

    it('should throw ForbiddenException for other user', async () => {
      // Arrange
      const snippet = createMockSnippet({ userId: ownerId });
      repository.findById.mockResolvedValue(snippet);

      // Act & Assert
      await expect(
        service.togglePublic('snippet-id', otherUserId, 'USER'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================================
  // DELETE
  // ============================================================

  describe('delete', () => {
    it('should delete own snippet', async () => {
      // Arrange
      const snippet = createMockSnippet({ userId: ownerId });
      repository.findById.mockResolvedValue(snippet);
      repository.delete.mockResolvedValue(true);

      // Act
      await service.delete('snippet-id', ownerId, 'USER');

      // Assert
      expect(repository.delete).toHaveBeenCalledWith('snippet-id');
    });

    it('should throw ForbiddenException when deleting other user snippet', async () => {
      // Arrange
      const snippet = createMockSnippet({ userId: ownerId });
      repository.findById.mockResolvedValue(snippet);

      // Act & Assert
      await expect(
        service.delete('snippet-id', otherUserId, 'USER'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.delete('snippet-id', otherUserId, 'USER'),
      ).rejects.toThrow('You can only delete your own snippets');
    });

    it('should allow ADMIN to delete any snippet', async () => {
      // Arrange
      const snippet = createMockSnippet({ userId: ownerId });
      repository.findById.mockResolvedValue(snippet);
      repository.delete.mockResolvedValue(true);

      // Act
      await service.delete('snippet-id', otherUserId, 'ADMIN');

      // Assert
      expect(repository.delete).toHaveBeenCalledWith('snippet-id');
    });

    it('should throw NotFoundException when snippet not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.delete('nonexistent', ownerId, 'USER'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // STATISTICS
  // ============================================================

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      // Arrange
      const stats = {
        total: 10,
        public: 7,
        private: 3,
        totalViews: 150,
        mostViewed: mockSnippet,
        latestSnippet: mockSnippet,
      };
      repository.getUserStats.mockResolvedValue(stats);

      // Act
      const result = await service.getUserStats(ownerId);

      // Assert
      expect(result).toEqual(stats);
    });
  });

  describe('countUserSnippets', () => {
    it('should return count of user snippets', async () => {
      // Arrange
      repository.countByUserId.mockResolvedValue(42);

      // Act
      const result = await service.countUserSnippets(ownerId);

      // Assert
      expect(result).toBe(42);
    });
  });
});
