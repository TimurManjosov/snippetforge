import { type SnippetReaction } from '../../src/lib/db/schema';

export const createMockReactionsRepository = () => ({
  add: jest.fn(),
  remove: jest.fn(),
  counts: jest.fn(),
  userReactions: jest.fn(),
});

export type MockReactionsRepository = ReturnType<
  typeof createMockReactionsRepository
>;

export function createMockSnippetReaction(
  overrides: Partial<SnippetReaction> = {},
): SnippetReaction {
  return {
    id: 'reaction-test-id-123',
    snippetId: 'snippet-test-id-123',
    userId: 'user-test-id-123',
    type: 'like',
    createdAt: new Date(),
    ...overrides,
  };
}
