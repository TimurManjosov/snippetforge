import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ReactionBar from '../reaction-bar';
import * as reactionsApi from '@/lib/reactions-api';
import type { ReactionsResponse } from '@/types/reactions';

jest.mock('@/lib/reactions-api');
const mockedApi = reactionsApi as jest.Mocked<typeof reactionsApi>;

const mockUser = {
  id: 'u1',
  email: 'test@test.com',
  username: 'testuser',
  bio: null,
  avatarUrl: null,
  role: 'USER' as const,
  createdAt: '',
  updatedAt: '',
};
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

jest.mock('@/utils/storage', () => ({
  readToken: () => (currentUser ? 'mock-token' : null),
  writeToken: jest.fn(),
  clearToken: jest.fn(),
}));

const makeResponse = (overrides: Partial<ReactionsResponse> = {}): ReactionsResponse => ({
  counts: [
    { type: 'like', count: 5 },
    { type: 'star', count: 3 },
  ],
  viewer: [],
  ...overrides,
});

describe('ReactionBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = mockUser;
    mockedApi.getSnippetReactions.mockResolvedValue(makeResponse());
    mockedApi.setReaction.mockResolvedValue(undefined);
    mockedApi.removeReaction.mockResolvedValue(undefined);
  });

  it('renders counts correctly after loading', async () => {
    render(<ReactionBar snippetId="s1" />);

    expect(await screen.findByLabelText('Like (5)')).toBeInTheDocument();
    expect(screen.getByLabelText('Star (3)')).toBeInTheDocument();
  });

  it('toggles like when logged in', async () => {
    const user = userEvent.setup();
    render(<ReactionBar snippetId="s1" />);

    const likeBtn = await screen.findByLabelText('Like (5)');
    await user.click(likeBtn);

    await waitFor(() =>
      expect(mockedApi.setReaction).toHaveBeenCalledWith(expect.anything(), 's1', 'like'),
    );

    // Optimistic update: count should be 6
    expect(screen.getByLabelText('Like (6)')).toBeInTheDocument();
  });

  it('toggles remove when already liked', async () => {
    mockedApi.getSnippetReactions.mockResolvedValue(
      makeResponse({ viewer: ['like'] }),
    );
    const user = userEvent.setup();
    render(<ReactionBar snippetId="s1" />);

    const likeBtn = await screen.findByLabelText('Like (5)');
    expect(likeBtn).toHaveAttribute('aria-pressed', 'true');

    await user.click(likeBtn);

    await waitFor(() =>
      expect(mockedApi.removeReaction).toHaveBeenCalledWith(expect.anything(), 's1', 'like'),
    );

    // Optimistic update: count should be 4
    expect(screen.getByLabelText('Like (4)')).toBeInTheDocument();
  });

  it('rolls back on API error', async () => {
    mockedApi.setReaction.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(<ReactionBar snippetId="s1" />);

    const likeBtn = await screen.findByLabelText('Like (5)');
    await user.click(likeBtn);

    // Wait for rollback
    await waitFor(() =>
      expect(screen.getByLabelText('Like (5)')).toBeInTheDocument(),
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('shows login message when not logged in', async () => {
    currentUser = null;
    const user = userEvent.setup();
    render(<ReactionBar snippetId="s1" />);

    const likeBtn = await screen.findByLabelText('Like (5)');
    await user.click(likeBtn);

    expect(mockedApi.setReaction).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Please log in');
  });
});
