import { type Tag } from '../../src/lib/db/schema';
import { type TagWithSnippetCount } from '../../src/modules/tags';

export const createMockTagsRepository = () => ({
  create: jest.fn(),
  findBySlug: jest.fn(),
  findBySlugs: jest.fn(),
  findAllWithSnippetCount: jest.fn(),
  attachTagsToSnippet: jest.fn(),
  removeTagFromSnippet: jest.fn(),
});

export type MockTagsRepository = ReturnType<typeof createMockTagsRepository>;

export function createMockTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: '0c31fd42-d7db-40f4-8c9c-2dcf2268cbf0',
    name: 'TypeScript',
    slug: 'typescript',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockTagWithSnippetCount(
  overrides: Partial<TagWithSnippetCount> = {},
): TagWithSnippetCount {
  return {
    ...createMockTag(),
    snippetCount: 0,
    ...overrides,
  };
}
