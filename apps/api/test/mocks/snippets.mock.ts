// test/mocks/snippets.mock.ts

import { type Snippet, type SnippetPreview } from '../../src/modules/snippets';

/**
 * Snippets Mocks
 *
 * Mock-Implementierungen für SnippetsRepository
 */

// ============================================================
// REPOSITORY MOCK
// ============================================================

export const createMockSnippetsRepository = () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findPublic: jest.fn(),
  findPublicPreviews: jest.fn(),
  searchPublic: jest.fn(),
  findByLanguage: jest.fn(),
  findWithFilters: jest.fn(),
  update: jest.fn(),
  incrementViewCount: jest.fn(),
  delete: jest.fn(),
  deleteByUserId: jest.fn(),
  countByUserId: jest.fn(),
  countPublic: jest.fn(),
  getUserStats: jest.fn(),
  getLanguageStats: jest.fn(),
});

export type MockSnippetsRepository = ReturnType<
  typeof createMockSnippetsRepository
>;

// ============================================================
// TEST DATA
// ============================================================

/**
 * Erstellt einen Mock Snippet
 */
export function createMockSnippet(overrides: Partial<Snippet> = {}): Snippet {
  const now = new Date();
  return {
    id: 'snippet-test-id-123',
    title: 'Test Snippet',
    description: 'A test snippet for unit tests',
    code: 'console.log("Hello World")',
    language: 'typescript',
    userId: 'user-test-id-123',
    isPublic: true,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Erstellt einen Mock Snippet Preview (ohne Code)
 */
export function createMockSnippetPreview(
  overrides: Partial<SnippetPreview> = {},
): SnippetPreview {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { code, ...preview } = createMockSnippet(overrides);
  return preview;
}

/**
 * Erstellt mehrere Mock Snippets
 */
export function createMockSnippets(
  count: number,
  baseOverrides: Partial<Snippet> = {},
): Snippet[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSnippet({
      ...baseOverrides,
      id: `snippet-${i}`,
      title: `Test Snippet ${i + 1}`,
    }),
  );
}
