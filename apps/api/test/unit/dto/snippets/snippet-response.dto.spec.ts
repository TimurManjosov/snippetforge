// test/unit/dto/snippets/snippet-response.dto.spec.ts

import {
  SnippetAuthorSchema,
  SnippetResponseSchema,
  SnippetWithUserResponseSchema,
  SnippetPreviewResponseSchema,
  PaginationMetaSchema,
  PaginatedSnippetsResponseSchema,
  PaginatedSnippetPreviewsResponseSchema,
  SnippetStatsResponseSchema,
} from '../../../../src/modules/snippets/dto/snippet-response.dto';

/**
 * Snippet Response DTOs Unit Tests
 *
 * Testet:
 * - Response Schemas validieren korrekte Datenstruktur
 * - Type inference funktioniert
 * - Nested schemas funktionieren
 */
describe('Snippet Response DTOs', () => {
  describe('SnippetAuthorSchema', () => {
    it('should validate valid author data', () => {
      // Arrange
      const input = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      // Act
      const result = SnippetAuthorSchema.parse(input);

      // Assert
      expect(result.id).toBe(input.id);
      expect(result.username).toBe(input.username);
      expect(result.avatarUrl).toBe(input.avatarUrl);
    });

    it('should validate author with null avatarUrl', () => {
      // Arrange
      const input = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        avatarUrl: null,
      };

      // Act
      const result = SnippetAuthorSchema.parse(input);

      // Assert
      expect(result.avatarUrl).toBeNull();
    });

    it('should reject invalid UUID', () => {
      // Arrange
      const input = {
        id: 'not-a-uuid',
        username: 'testuser',
        avatarUrl: null,
      };

      // Act & Assert
      expect(() => SnippetAuthorSchema.parse(input)).toThrow();
    });
  });

  describe('SnippetResponseSchema', () => {
    it('should validate complete snippet response', () => {
      // Arrange
      const input = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Snippet',
        description: 'A test snippet',
        code: 'console.log("test");',
        language: 'javascript',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        isPublic: true,
        viewCount: 42,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      // Act
      const result = SnippetResponseSchema.parse(input);

      // Assert
      expect(result.id).toBe(input.id);
      expect(result.title).toBe(input.title);
      expect(result.description).toBe(input.description);
      expect(result.code).toBe(input.code);
      expect(result.language).toBe(input.language);
      expect(result.userId).toBe(input.userId);
      expect(result.isPublic).toBe(input.isPublic);
      expect(result.viewCount).toBe(input.viewCount);
    });

    it('should validate snippet with null description', () => {
      // Arrange
      const input = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Snippet',
        description: null,
        code: 'code',
        language: 'python',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        isPublic: false,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = SnippetResponseSchema.parse(input);

      // Assert
      expect(result.description).toBeNull();
    });
  });

  describe('SnippetWithUserResponseSchema', () => {
    it('should validate snippet with user info', () => {
      // Arrange
      const input = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Snippet',
        description: 'Test',
        code: 'code',
        language: 'typescript',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        isPublic: true,
        viewCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          username: 'author',
          avatarUrl: null,
        },
      };

      // Act
      const result = SnippetWithUserResponseSchema.parse(input);

      // Assert
      expect(result.user.username).toBe('author');
      expect(result.user.id).toBe(input.userId);
    });
  });

  describe('SnippetPreviewResponseSchema', () => {
    it('should validate snippet preview without code', () => {
      // Arrange
      const input = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Snippet',
        description: 'Test',
        language: 'rust',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        isPublic: true,
        viewCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = SnippetPreviewResponseSchema.parse(input);

      // Assert
      expect(result.title).toBe(input.title);
      expect(result).not.toHaveProperty('code');
    });
  });

  describe('PaginationMetaSchema', () => {
    it('should validate pagination metadata', () => {
      // Arrange
      const input = {
        page: 1,
        limit: 10,
        total: 42,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      };

      // Act
      const result = PaginationMetaSchema.parse(input);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(42);
      expect(result.totalPages).toBe(5);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
    });
  });

  describe('PaginatedSnippetsResponseSchema', () => {
    it('should validate paginated snippets response', () => {
      // Arrange
      const input = {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Snippet 1',
            description: null,
            code: 'code1',
            language: 'javascript',
            userId: '123e4567-e89b-12d3-a456-426614174001',
            isPublic: true,
            viewCount: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      // Act
      const result = PaginatedSnippetsResponseSchema.parse(input);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should validate empty paginated response', () => {
      // Arrange
      const input = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      // Act
      const result = PaginatedSnippetsResponseSchema.parse(input);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('PaginatedSnippetPreviewsResponseSchema', () => {
    it('should validate paginated previews response', () => {
      // Arrange
      const input = {
        items: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Preview 1',
            description: 'desc',
            language: 'python',
            userId: '123e4567-e89b-12d3-a456-426614174001',
            isPublic: true,
            viewCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      // Act
      const result = PaginatedSnippetPreviewsResponseSchema.parse(input);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).not.toHaveProperty('code');
    });
  });

  describe('SnippetStatsResponseSchema', () => {
    it('should validate stats with all fields', () => {
      // Arrange
      const input = {
        total: 10,
        public: 7,
        private: 3,
        totalViews: 100,
        mostViewed: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Popular Snippet',
          description: null,
          code: 'code',
          language: 'javascript',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          isPublic: true,
          viewCount: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        latestSnippet: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'Latest Snippet',
          description: null,
          code: 'code',
          language: 'typescript',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          isPublic: true,
          viewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      // Act
      const result = SnippetStatsResponseSchema.parse(input);

      // Assert
      expect(result.total).toBe(10);
      expect(result.public).toBe(7);
      expect(result.private).toBe(3);
      expect(result.totalViews).toBe(100);
      expect(result.mostViewed?.title).toBe('Popular Snippet');
      expect(result.latestSnippet?.title).toBe('Latest Snippet');
    });

    it('should validate stats without optional snippets', () => {
      // Arrange
      const input = {
        total: 0,
        public: 0,
        private: 0,
        totalViews: 0,
      };

      // Act
      const result = SnippetStatsResponseSchema.parse(input);

      // Assert
      expect(result.total).toBe(0);
      expect(result.mostViewed).toBeUndefined();
      expect(result.latestSnippet).toBeUndefined();
    });
  });
});
