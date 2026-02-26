import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FavoriteButton from '../favorite-button';
import * as favoritesApi from '@/lib/favorites-api';
import type { FavoritesListResponse } from '@/types/favorites';

jest.mock('@/lib/favorites-api');
const mockedApi = favoritesApi as jest.Mocked<typeof favoritesApi>;

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

const makeFavoritesResponse = (snippetIds: string[]): FavoritesListResponse => ({
  data: snippetIds.map((id, i) => ({
    id: `fav-${i}`,
    snippetId: id,
    snippetTitle: `Snippet ${id}`,
    snippetLanguage: 'typescript',
    createdAt: '2025-01-01T00:00:00Z',
  })),
  total: snippetIds.length,
  page: 1,
  limit: 100,
});

describe('FavoriteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = mockUser;
    mockedApi.listFavorites.mockResolvedValue(makeFavoritesResponse([]));
    mockedApi.addFavorite.mockResolvedValue(undefined);
    mockedApi.removeFavorite.mockResolvedValue(undefined);
  });

  it('shows "Save" when snippet is not favorited', async () => {
    render(<FavoriteButton snippetId="s1" />);

    await waitFor(() =>
      expect(screen.getByLabelText('Save')).toBeInTheDocument(),
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows "Saved" when snippet is in favorites', async () => {
    mockedApi.listFavorites.mockResolvedValue(makeFavoritesResponse(['s1']));
    render(<FavoriteButton snippetId="s1" />);

    await waitFor(() =>
      expect(screen.getByLabelText('Saved')).toBeInTheDocument(),
    );
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('calls addFavorite when clicking Save', async () => {
    const user = userEvent.setup();
    render(<FavoriteButton snippetId="s1" />);

    const btn = await screen.findByLabelText('Save');
    await user.click(btn);

    await waitFor(() =>
      expect(mockedApi.addFavorite).toHaveBeenCalledWith(expect.anything(), 's1'),
    );
  });

  it('calls removeFavorite when clicking Saved', async () => {
    mockedApi.listFavorites.mockResolvedValue(makeFavoritesResponse(['s1']));
    const user = userEvent.setup();
    render(<FavoriteButton snippetId="s1" />);

    const btn = await screen.findByLabelText('Saved');
    await user.click(btn);

    await waitFor(() =>
      expect(mockedApi.removeFavorite).toHaveBeenCalledWith(expect.anything(), 's1'),
    );
  });

  it('rolls back on error', async () => {
    mockedApi.addFavorite.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(<FavoriteButton snippetId="s1" />);

    const btn = await screen.findByLabelText('Save');
    await user.click(btn);

    // Should rollback to Save
    await waitFor(() =>
      expect(screen.getByLabelText('Save')).toBeInTheDocument(),
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });
});
