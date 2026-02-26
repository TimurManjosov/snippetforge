import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FavoritesPage from '../page';
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

const mockReplace = jest.fn();

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

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/utils/storage', () => ({
  readToken: () => (currentUser ? 'mock-token' : null),
  writeToken: jest.fn(),
  clearToken: jest.fn(),
}));

const makeFavoritesResponse = (count: number): FavoritesListResponse => ({
  data: Array.from({ length: count }, (_, i) => ({
    id: `fav-${i}`,
    snippetId: `s${i}`,
    snippetTitle: `Snippet ${i}`,
    snippetLanguage: 'typescript',
    createdAt: '2025-01-01T00:00:00Z',
  })),
  total: count,
  page: 1,
  limit: 20,
});

describe('FavoritesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = mockUser;
    mockedApi.listFavorites.mockResolvedValue(makeFavoritesResponse(0));
    mockedApi.removeFavorite.mockResolvedValue(undefined);
  });

  it('redirects to login when not logged in', async () => {
    currentUser = null;
    render(<FavoritesPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/login'),
    );
  });

  it('renders favorites list', async () => {
    mockedApi.listFavorites.mockResolvedValue(makeFavoritesResponse(3));
    render(<FavoritesPage />);

    expect(await screen.findByText('Snippet 0')).toBeInTheDocument();
    expect(screen.getByText('Snippet 1')).toBeInTheDocument();
    expect(screen.getByText('Snippet 2')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    render(<FavoritesPage />);

    expect(
      await screen.findByText(/haven't saved any snippets/i),
    ).toBeInTheDocument();
  });
});
