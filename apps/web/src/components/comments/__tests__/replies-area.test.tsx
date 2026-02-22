import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RepliesArea from '../replies-area';
import type { Comment } from '@/types/comments';

// Mock CommentItem to simplify RepliesArea tests
jest.mock('../comment-item', () => {
  return function MockCommentItem({ comment }: { comment: Comment }) {
    return <div data-testid="reply-item">{comment.body}</div>;
  };
});

jest.mock('@/utils/snippet-format', () => ({
  formatSnippetDate: (iso: string) => iso,
}));

const makeReply = (id: string, body: string): Comment => ({
  id,
  snippetId: 's1',
  userId: 'u1',
  parentId: 'c1',
  body,
  status: 'visible',
  deletedAt: null,
  editedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  replyCount: 0,
});

const defaultProps = {
  currentUserId: 'u1',
  currentUserRole: 'USER' as const,
  isLoggedIn: true,
  onLoad: jest.fn(),
  onEdit: jest.fn().mockResolvedValue(undefined),
  onDelete: jest.fn(),
  onFlag: jest.fn(),
};

describe('RepliesArea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onLoad when open and not loaded', () => {
    render(
      <RepliesArea
        replies={[]}
        loading={false}
        loaded={false}
        error={null}
        open={true}
        {...defaultProps}
      />,
    );

    expect(defaultProps.onLoad).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(
      <RepliesArea
        replies={[]}
        loading={true}
        loaded={false}
        error={null}
        open={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByTestId('replies-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading replies…')).toBeInTheDocument();
  });

  it('shows empty state when loaded with no items', () => {
    render(
      <RepliesArea
        replies={[]}
        loading={false}
        loaded={true}
        error={null}
        open={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByTestId('replies-empty')).toBeInTheDocument();
    expect(screen.getByText('No replies yet.')).toBeInTheDocument();
  });

  it('shows error state with retry button', async () => {
    const user = userEvent.setup();
    render(
      <RepliesArea
        replies={[]}
        loading={false}
        loaded={false}
        error="Failed to load replies."
        open={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByTestId('replies-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load replies.')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    await user.click(retryBtn);
    expect(defaultProps.onLoad).toHaveBeenCalled();
  });

  it('renders replies when loaded', () => {
    const replies = [
      makeReply('r1', 'Reply 1'),
      makeReply('r2', 'Reply 2'),
    ];

    render(
      <RepliesArea
        replies={replies}
        loading={false}
        loaded={true}
        error={null}
        open={true}
        {...defaultProps}
      />,
    );

    expect(screen.getByText('Reply 1')).toBeInTheDocument();
    expect(screen.getByText('Reply 2')).toBeInTheDocument();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <RepliesArea
        replies={[]}
        loading={false}
        loaded={false}
        error={null}
        open={false}
        {...defaultProps}
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(defaultProps.onLoad).not.toHaveBeenCalled();
  });
});
