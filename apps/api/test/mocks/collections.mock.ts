import { type Collection } from '../../src/lib/db/schema';

export const createMockCollectionsRepository = () => ({
  create: jest.fn(),
  listByUser: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  addItem: jest.fn(),
  removeItem: jest.fn(),
  getMaxPosition: jest.fn(),
  listItemsWithSnippetPreview: jest.fn(),
});

export type MockCollectionsRepository = ReturnType<
  typeof createMockCollectionsRepository
>;

export function createMockCollection(
  overrides: Partial<Collection> = {},
): Collection {
  const now = new Date();
  return {
    id: 'collection-test-id-123',
    userId: 'user-test-id-123',
    name: 'Test Collection',
    description: 'A test collection',
    isPublic: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
