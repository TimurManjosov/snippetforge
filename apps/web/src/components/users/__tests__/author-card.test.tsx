import { render, screen, waitFor } from '@testing-library/react';
import { AuthorCard } from '../author-card';
import * as usersApi from '@/lib/users-api';
import type { PublicUser, UserStats } from '@/types/users';

jest.mock('@/lib/users-api');

const mockProfile: PublicUser = {
  id: 'u1',
  username: 'alice',
  displayName: 'Alice',
  bio: 'A cool dev',
  avatarUrl: null,
  websiteUrl: null,
};

const mockStats: UserStats = {
  userId: 'u1',
  publicSnippetCount: 10,
  commentCount: 4,
  reactionGivenCount: 2,
};

describe('AuthorCard', () => {
  beforeEach(() => {
    (usersApi.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
    (usersApi.getUserStats as jest.Mock).mockResolvedValue(mockStats);
  });

  it('shows loading state initially', () => {
    render(<AuthorCard userId="u1" />);
    expect(screen.getByText(/loading author/i)).toBeInTheDocument();
  });

  it('renders profile link after load', async () => {
    render(<AuthorCard userId="u1" />);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /alice/i })).toHaveAttribute('href', '/users/u1')
    );
  });

  it('renders stats in non-compact mode', async () => {
    render(<AuthorCard userId="u1" compact={false} />);
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
  });

  it('does NOT render stats in compact mode', async () => {
    render(<AuthorCard userId="u1" compact />);
    await waitFor(() => screen.getByRole('link', { name: /alice/i }));
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('shows error message when API fails', async () => {
    (usersApi.getUserProfile as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<AuthorCard userId="u1" />);
    await waitFor(() =>
      expect(screen.getByText(/could not load author/i)).toBeInTheDocument()
    );
  });
});
