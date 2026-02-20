import { type Comment, type CommentFlag } from '../../src/lib/db/schema';

export const createMockCommentsRepository = () => ({
  create: jest.fn(),
  findById: jest.fn(),
  listVisibleBySnippet: jest.fn(),
  updateBody: jest.fn(),
  softDelete: jest.fn(),
  incrementReplyCount: jest.fn(),
  decrementReplyCount: jest.fn(),
  addFlag: jest.fn(),
  removeFlag: jest.fn(),
});

export type MockCommentsRepository = ReturnType<
  typeof createMockCommentsRepository
>;

export function createMockComment(
  overrides: Partial<Comment> = {},
): Comment {
  const now = new Date();
  return {
    id: 'comment-test-id-123',
    snippetId: 'snippet-test-id-123',
    userId: 'user-test-id-123',
    parentId: null,
    body: 'Test comment body',
    status: 'visible',
    deletedAt: null,
    editedAt: null,
    createdAt: now,
    updatedAt: now,
    replyCount: 0,
    ...overrides,
  };
}

export function createMockCommentFlag(
  overrides: Partial<CommentFlag> = {},
): CommentFlag {
  return {
    id: 'flag-test-id-123',
    commentId: 'comment-test-id-123',
    reporterUserId: 'user-test-id-123',
    reason: 'spam',
    message: null,
    createdAt: new Date(),
    ...overrides,
  };
}
