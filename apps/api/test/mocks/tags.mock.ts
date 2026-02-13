// test/mocks/tags.mock.ts

import { type Tag } from '../../src/lib/db/schema';

/**
 * Tags Mocks
 *
 * Mock-Implementierungen für TagsRepository
 */

// ============================================================
// REPOSITORY MOCK
// ============================================================

export const createMockTagsRepository = () => ({
  createTag: jest.fn(),
  findTagById: jest.fn(),
  findTagBySlug: jest.fn(),
  findTagsBySlugs: jest.fn(),
  findAllTagsWithCount: jest.fn(),
  attachTagsToSnippet: jest.fn(),
  detachTagFromSnippet: jest.fn(),
  findExistingTagRelations: jest.fn(),
  findTagsBySnippetId: jest.fn(),
});

export type MockTagsRepository = ReturnType<typeof createMockTagsRepository>;

// ============================================================
// TEST DATA
// ============================================================

/**
 * Erstellt einen Mock Tag
 */
export function createMockTag(overrides: Partial<Tag> = {}): Tag {
  const now = new Date();
  return {
    id: 'tag-test-id-123',
    name: 'TypeScript',
    slug: 'typescript',
    createdAt: now,
    ...overrides,
  };
}

/**
 * Erstellt mehrere Mock Tags
 */
export function createMockTags(
  count: number,
  baseOverrides: Partial<Tag> = {},
): Tag[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTag({
      ...baseOverrides,
      id: `tag-${i}`,
      name: `Tag ${i + 1}`,
      slug: `tag-${i + 1}`,
    }),
  );
}
