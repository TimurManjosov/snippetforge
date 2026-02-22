import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CommentItem from '../comment-item';
import type { Comment } from '@/types/comments';

// Mock the date formatting to avoid locale issues in tests
jest.mock('@/utils/snippet-format', () => ({
  formatSnippetDate: (iso: string) => iso,
}));

const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 'c1',
  snippetId: 's1',
  userId: 'u1',
  parentId: null,
  body: 'Test comment body',
  status: 'visible',
  deletedAt: null,
  editedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  replyCount: 0,
  ...overrides,
});

const defaultProps = {
  onEdit: jest.fn().mockResolvedValue(undefined),
  onDelete: jest.fn(),
  onFlag: jest.fn(),
  onToggleReplies: jest.fn(),
};

describe('CommentItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('owner sees Edit and Delete buttons', () => {
    render(
      <CommentItem
        comment={makeComment()}
        currentUserId="u1"
        currentUserRole="USER"
        isLoggedIn={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('non-owner does not see Edit and Delete buttons', () => {
    render(
      <CommentItem
        comment={makeComment()}
        currentUserId="u2"
        currentUserRole="USER"
        isLoggedIn={true}
        {...defaultProps}
      />,
    );

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('admin sees Edit and Delete buttons', () => {
    render(
      <CommentItem
        comment={makeComment()}
        currentUserId="u-admin"
        currentUserRole="ADMIN"
        isLoggedIn={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('reply toggle button calls onToggleReplies', async () => {
    const user = userEvent.setup();
    render(
      <CommentItem
        comment={makeComment({ replyCount: 3 })}
        currentUserId="u2"
        currentUserRole="USER"
        isLoggedIn={true}
        repliesOpen={false}
        {...defaultProps}
      />,
    );

    const toggleBtn = screen.getByRole('button', { name: /show replies \(3\)/i });
    await user.click(toggleBtn);
    expect(defaultProps.onToggleReplies).toHaveBeenCalled();
  });

  it('shows "Hide replies" when repliesOpen is true', () => {
    render(
      <CommentItem
        comment={makeComment({ replyCount: 2 })}
        currentUserId="u2"
        currentUserRole="USER"
        isLoggedIn={true}
        repliesOpen={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByRole('button', { name: /hide replies/i })).toBeInTheDocument();
  });

  it('deleted comment renders placeholder and hides Edit/Delete', () => {
    render(
      <CommentItem
        comment={makeComment({ deletedAt: '2025-01-01T00:00:00Z' })}
        currentUserId="u1"
        currentUserRole="USER"
        isLoggedIn={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByText('This comment was deleted.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('shows edited indicator when editedAt is set', () => {
    render(
      <CommentItem
        comment={makeComment({ editedAt: '2025-01-02T00:00:00Z' })}
        currentUserId="u2"
        currentUserRole="USER"
        isLoggedIn={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('renders body as plain text', () => {
    render(
      <CommentItem
        comment={makeComment({ body: '<script>alert("xss")</script>' })}
        currentUserId="u2"
        currentUserRole="USER"
        isLoggedIn={true}
        {...defaultProps}
      />,
    );

    // Should render as text, not as HTML
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
  });

  it('shows Flag button for logged-in non-owner', () => {
    render(
      <CommentItem
        comment={makeComment()}
        currentUserId="u2"
        currentUserRole="USER"
        isLoggedIn={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByRole('button', { name: /flag/i })).toBeInTheDocument();
  });

  it('hides Flag button for owner', () => {
    render(
      <CommentItem
        comment={makeComment()}
        currentUserId="u1"
        currentUserRole="USER"
        isLoggedIn={true}
        {...defaultProps}
      />,
    );

    expect(screen.queryByRole('button', { name: /flag/i })).not.toBeInTheDocument();
  });

  it('does not show Reply button on reply items', () => {
    render(
      <CommentItem
        comment={makeComment()}
        currentUserId="u2"
        currentUserRole="USER"
        isLoggedIn={true}
        isReply={true}
        onReply={jest.fn()}
        {...defaultProps}
      />,
    );

    expect(screen.queryByRole('button', { name: /^reply$/i })).not.toBeInTheDocument();
  });
});
