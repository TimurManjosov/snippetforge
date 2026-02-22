import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CommentsPanel from '../comments-panel';
import type { Comment, PaginatedResponse } from '@/types/comments';
import * as commentsApi from '@/lib/comments-api';
import { ApiClientError } from '@/lib/api-client';

// Mock comments API
jest.mock('@/lib/comments-api');
const mockedApi = commentsApi as jest.Mocked<typeof commentsApi>;

// Mock useAuth hook
const mockUser = { id: 'u1', email: 'test@test.com', username: 'testuser', bio: null, avatarUrl: null, role: 'USER' as const, createdAt: '', updatedAt: '' };
let currentUser: typeof mockUser | null = mockUser;

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: currentUser,
    token: currentUser ? 'mock-token' : null,
    isLoading: false,
    error: null,
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  }),
}));

// Mock storage
jest.mock('@/utils/storage', () => ({
  readToken: () => (currentUser ? 'mock-token' : null),
  writeToken: jest.fn(),
  clearToken: jest.fn(),
}));

// Mock snippet-format
jest.mock('@/utils/snippet-format', () => ({
  formatSnippetDate: (iso: string) => iso,
}));

const makeComment = (id: string, body: string, overrides: Partial<Comment> = {}): Comment => ({
  id,
  snippetId: 's1',
  userId: 'u1',
  parentId: null,
  body,
  status: 'visible',
  deletedAt: null,
  editedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  replyCount: 0,
  ...overrides,
});

const makePaginatedResponse = (
  items: Comment[],
  total?: number,
): PaginatedResponse<Comment> => ({
  items,
  meta: {
    page: 1,
    limit: 20,
    total: total ?? items.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});

describe('CommentsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = mockUser;
    mockedApi.listComments.mockResolvedValue(makePaginatedResponse([]));
    mockedApi.createComment.mockResolvedValue(makeComment('new-1', 'New comment'));
    mockedApi.updateComment.mockResolvedValue(makeComment('c1', 'Updated body', { editedAt: '2025-01-02T00:00:00Z' }));
    mockedApi.deleteComment.mockResolvedValue(undefined);
    mockedApi.flagComment.mockResolvedValue(undefined);
  });

  it('shows loading state initially', () => {
    // Don't resolve the promise yet
    mockedApi.listComments.mockReturnValue(new Promise(() => {}));
    render(<CommentsPanel snippetId="s1" />);
    expect(screen.getByText('Loading comments…')).toBeInTheDocument();
  });

  it('calls listComments on initial load', async () => {
    render(<CommentsPanel snippetId="s1" />);

    await waitFor(() =>
      expect(mockedApi.listComments).toHaveBeenCalledWith(
        expect.anything(),
        's1',
        expect.objectContaining({ page: 1, order: 'desc' }),
      ),
    );
  });

  it('shows empty state when no comments', async () => {
    render(<CommentsPanel snippetId="s1" />);
    expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('renders comments list', async () => {
    mockedApi.listComments.mockResolvedValue(
      makePaginatedResponse([
        makeComment('c1', 'First comment'),
        makeComment('c2', 'Second comment'),
      ]),
    );

    render(<CommentsPanel snippetId="s1" />);

    expect(await screen.findByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Second comment')).toBeInTheDocument();
  });

  it('creates a new comment', async () => {
    const user = userEvent.setup();
    render(<CommentsPanel snippetId="s1" />);

    await screen.findByText(/no comments yet/i);

    const textarea = screen.getByLabelText('Comment');
    await user.type(textarea, 'New comment');
    await user.click(screen.getByRole('button', { name: /comment/i }));

    await waitFor(() =>
      expect(mockedApi.createComment).toHaveBeenCalledWith(
        expect.anything(),
        's1',
        'New comment',
      ),
    );

    expect(await screen.findByText('New comment')).toBeInTheDocument();
  });

  it('shows "Comments unavailable." on 404', async () => {
    mockedApi.listComments.mockRejectedValue(new ApiClientError(404, 'Not Found'));

    render(<CommentsPanel snippetId="s1" />);

    expect(await screen.findByText('Comments unavailable.')).toBeInTheDocument();
  });

  it('shows generic error on 5xx', async () => {
    mockedApi.listComments.mockRejectedValue(new ApiClientError(500, 'Internal Server Error'));

    render(<CommentsPanel snippetId="s1" />);

    expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
  });

  it('handles delete with placeholder', async () => {
    const user = userEvent.setup();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    mockedApi.listComments.mockResolvedValue(
      makePaginatedResponse([makeComment('c1', 'Comment to delete')]),
    );

    render(<CommentsPanel snippetId="s1" />);

    await screen.findByText('Comment to delete');
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(mockedApi.deleteComment).toHaveBeenCalledWith(expect.anything(), 'c1'),
    );

    expect(await screen.findByText('This comment was deleted.')).toBeInTheDocument();

    (window.confirm as jest.Mock).mockRestore();
  });

  it('opens flag dialog and submits', async () => {
    const user = userEvent.setup();
    currentUser = { ...mockUser, id: 'u2' }; // Non-owner

    mockedApi.listComments.mockResolvedValue(
      makePaginatedResponse([makeComment('c1', 'Comment to flag')]),
    );

    render(<CommentsPanel snippetId="s1" />);

    await screen.findByText('Comment to flag');
    await user.click(screen.getByRole('button', { name: /flag/i }));

    // Flag dialog should appear
    expect(await screen.findByRole('dialog', { name: /flag comment/i })).toBeInTheDocument();

    // Submit with default reason (spam) - use within dialog to avoid ambiguity
    const dialog = screen.getByRole('dialog', { name: /flag comment/i });
    await user.click(within(dialog).getByRole('button', { name: /^flag$/i }));

    await waitFor(() =>
      expect(mockedApi.flagComment).toHaveBeenCalledWith(
        expect.anything(),
        'c1',
        'spam',
        undefined,
      ),
    );
  });
});
