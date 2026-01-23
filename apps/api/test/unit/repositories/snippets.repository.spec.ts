/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// test/unit/repositories/snippets.repository.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { SnippetsRepository } from '../../../src/modules/snippets/snippets.repository';
import { DatabaseService } from '../../../src/shared/database';
import {
  createMockDatabaseService,
  createMockSnippet,
  createMockSnippets,
  type MockDatabaseService,
} from '../../mocks';

/**
 * SnippetsRepository Unit Tests
 *
 * Testet:
 * - CRUD Operationen
 * - Pagination
 * - Filtering
 * - Statistics
 * - Edge Cases
 */
describe('SnippetsRepository', () => {
  let repository: SnippetsRepository;
  let mockDb: MockDatabaseService;

  const mockSnippet = createMockSnippet();

  beforeEach(async () => {
    mockDb = createMockDatabaseService();
    mockDb.drizzle.query.snippets = {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnippetsRepository,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<SnippetsRepository>(SnippetsRepository);
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
      const newSnippet = {
        title: 'New Snippet',
        code: 'console.log("test")',
        language: 'javascript',
        userId: 'user-123',
      };

      mockDb.drizzle.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockSnippet]),
        }),
      } as any);

      // Act
      const result = await repository.create(newSnippet);

      // Assert
      expect(result).toEqual(mockSnippet);
      expect(mockDb.drizzle.insert).toHaveBeenCalled();
    });
  });

  // ============================================================
  // READ - SINGLE
  // ============================================================

  describe('findById', () => {
    it('should return snippet when found', async () => {
      // Arrange

      mockDb.drizzle.query.snippets.findFirst.mockResolvedValue(mockSnippet);

      // Act
      const result = await repository.findById('snippet-123');

      // Assert
      expect(result).toEqual(mockSnippet);
      expect(mockDb.drizzle.query.snippets.findFirst).toHaveBeenCalled();
    });

    it('should return null when not found', async () => {
      // Arrange
      mockDb.drizzle.query.snippets.findFirst.mockResolvedValue(undefined);

      // Act
      const result = await repository.findById('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ============================================================
  // READ - LISTS
  // ============================================================

  describe('findByUserId', () => {
    it('should return user snippets', async () => {
      // Arrange
      const snippets = createMockSnippets(3, { userId: 'user-123' });
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue(snippets);

      // Act
      const result = await repository.findByUserId('user-123');

      // Assert
      expect(result).toEqual(snippets);
      expect(result).toHaveLength(3);
    });

    it('should limit results to specified amount', async () => {
      // Arrange
      const snippets = createMockSnippets(5);
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue(snippets);

      // Act
      await repository.findByUserId('user-123', 5);

      // Assert
      expect(mockDb.drizzle.query.snippets.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5 }),
      );
    });

    it('should enforce max limit of 100', async () => {
      // Arrange
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue([]);

      // Act
      await repository.findByUserId('user-123', 200);

      // Assert
      expect(mockDb.drizzle.query.snippets.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
      );
    });
  });

  describe('findPublic', () => {
    it('should return paginated public snippets', async () => {
      // Arrange
      const snippets = createMockSnippets(20, { isPublic: true });
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue(snippets);
      mockDb.drizzle.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 100 }]),
        }),
      } as any);

      // Act
      const result = await repository.findPublic(1, 20);

      // Assert
      expect(result.data).toEqual(snippets);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should calculate correct pagination for page 2', async () => {
      // Arrange
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue([]);
      mockDb.drizzle.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 100 }]),
        }),
      } as any);

      // Act
      const result = await repository.findPublic(2, 20);

      // Assert
      expect(result.meta.page).toBe(2);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(true);
    });

    it('should calculate correct pagination for last page', async () => {
      // Arrange
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue([]);
      mockDb.drizzle.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 100 }]),
        }),
      } as any);

      // Act
      const result = await repository.findPublic(5, 20);

      // Assert
      expect(result.meta.page).toBe(5);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(true);
    });
  });

  describe('findPublicPreviews', () => {
    it('should return paginated public snippet previews', async () => {
      // Arrange
      const previews = createMockSnippets(2, { isPublic: true });
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue(previews);
      const orderByMock = jest.fn().mockResolvedValue(previews);
      const offsetMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
      const limitMock = jest.fn().mockReturnValue({ offset: offsetMock });
      const whereDataMock = jest.fn().mockReturnValue({ limit: limitMock });
      const fromDataMock = jest.fn().mockReturnValue({ where: whereDataMock });

      const whereCountMock = jest.fn().mockResolvedValue([{ total: 2 }]);
      const fromCountMock = jest
        .fn()
        .mockReturnValue({ where: whereCountMock });

      mockDb.drizzle.select
        .mockReturnValueOnce({ from: fromDataMock } as any)
        .mockReturnValueOnce({ from: fromCountMock } as any);

      // Act
      const result = await repository.findPublicPreviews(1, 10);

      // Assert
      expect(result.data).toEqual(previews);
      expect(result.meta.total).toBe(2);
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(offsetMock).toHaveBeenCalledWith(0);
      expect(orderByMock).toHaveBeenCalled();
    });
  });

  describe('findByLanguage', () => {
    it('should return snippets filtered by language', async () => {
      // Arrange
      const snippets = createMockSnippets(5, { language: 'typescript' });
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue(snippets);

      // Act
      const result = await repository.findByLanguage('typescript');

      // Assert
      expect(result).toEqual(snippets);
      expect(result.every((s) => s.language === 'typescript')).toBe(true);
    });
  });

  describe('findWithFilters', () => {
    it('should apply all filters and sorting options', async () => {
      // Arrange
      const snippets = createMockSnippets(2);
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue(snippets);
      mockDb.drizzle.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 2 }]),
        }),
      } as any);

      const filters = {
        userId: 'user-1',
        language: 'typescript',
        isPublic: true,
        search: 'hello',
        createdAfter: new Date('2024-01-01'),
        createdBefore: new Date('2024-12-31'),
      } as const;

      const sort = { sortBy: 'updatedAt', order: 'asc' } as const;

      // Act
      const result = await repository.findWithFilters(filters, sort, 2, 5);

      // Assert
      expect(result.data).toEqual(snippets);
      expect(result.meta.page).toBe(2);
      expect(mockDb.drizzle.query.snippets.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
          limit: 5,
          offset: 5,
        }),
      );
    });

    it('should handle empty filters with default sorting', async () => {
      // Arrange
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue([]);
      mockDb.drizzle.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 0 }]),
        }),
      } as any);

      // Act
      const result = await repository.findWithFilters();

      // Assert
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(mockDb.drizzle.query.snippets.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update snippet successfully', async () => {
      // Arrange
      const updatedSnippet = { ...mockSnippet, title: 'Updated Title' };
      mockDb.drizzle.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedSnippet]),
          }),
        }),
      } as any);

      // Act
      const result = await repository.update('snippet-123', {
        title: 'Updated Title',
      });

      // Assert
      expect(result?.title).toBe('Updated Title');
    });

    it('should return null when snippet not found', async () => {
      // Arrange
      mockDb.drizzle.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Act
      const result = await repository.update('nonexistent', {
        title: 'Updated',
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should update updatedAt timestamp', async () => {
      // Arrange
      mockDb.drizzle.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockSnippet]),
          }),
        }),
      } as any);

      // Act
      await repository.update('snippet-123', { title: 'Updated' });

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockDb.drizzle.update().set).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count atomically', async () => {
      // Arrange
      mockDb.drizzle.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ id: 'snippet-123' }]),
          }),
        }),
      } as any);

      // Act
      const result = await repository.incrementViewCount('snippet-123');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when snippet not found', async () => {
      // Arrange
      mockDb.drizzle.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // Act
      const result = await repository.incrementViewCount('nonexistent');

      // Assert
      expect(result).toBe(false);
    });
  });

  // ============================================================
  // DELETE
  // ============================================================

  describe('delete', () => {
    it('should delete snippet successfully', async () => {
      // Arrange
      mockDb.drizzle.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'snippet-123' }]),
        }),
      } as any);

      // Act
      const result = await repository.delete('snippet-123');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when snippet not found', async () => {
      // Arrange
      mockDb.drizzle.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      // Act
      const result = await repository.delete('nonexistent');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('deleteByUserId', () => {
    it('should delete all user snippets', async () => {
      // Arrange
      mockDb.drizzle.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }]),
        }),
      } as any);

      // Act
      const result = await repository.deleteByUserId('user-123');

      // Assert
      expect(result).toBe(3);
    });
  });

  // ============================================================
  // STATISTICS
  // ============================================================

  describe('countByUserId', () => {
    it('should return count of user snippets', async () => {
      // Arrange
      mockDb.drizzle.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 42 }]),
        }),
      } as any);

      // Act
      const result = await repository.countByUserId('user-123');

      // Assert
      expect(result).toBe(42);
    });
  });

  describe('countPublic', () => {
    it('should return count of public snippets', async () => {
      // Arrange
      mockDb.drizzle.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 100 }]),
        }),
      } as any);

      // Act
      const result = await repository.countPublic();

      // Assert
      expect(result).toBe(100);
    });
  });

  describe('getUserStats', () => {
    it('should return comprehensive user statistics', async () => {
      // Arrange
      const userSnippets = [
        createMockSnippet({ isPublic: true, viewCount: 10 }),
        createMockSnippet({ isPublic: true, viewCount: 20 }),
        createMockSnippet({ isPublic: false, viewCount: 5 }),
      ];
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue(userSnippets);

      // Act
      const result = await repository.getUserStats('user-123');

      // Assert
      expect(result).toEqual({
        total: 3,
        public: 2,
        private: 1,
        totalViews: 35,
        mostViewed: expect.objectContaining({ viewCount: 20 }),
        latestSnippet: expect.any(Object),
      });
    });

    it('should handle user with no snippets', async () => {
      // Arrange
      mockDb.drizzle.query.snippets.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.getUserStats('user-123');

      // Assert
      expect(result).toEqual({
        total: 0,
        public: 0,
        private: 0,
        totalViews: 0,
        mostViewed: undefined,
        latestSnippet: undefined,
      });
    });
  });

  describe('getLanguageStats', () => {
    it('should return language statistics', async () => {
      // Arrange
      const languageStats = [
        { language: 'typescript', count: 10 },
        { language: 'javascript', count: 5 },
        { language: 'python', count: 3 },
      ];
      mockDb.drizzle.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(languageStats),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await repository.getLanguageStats();

      // Assert
      expect(result).toEqual(languageStats);
    });
  });
});
