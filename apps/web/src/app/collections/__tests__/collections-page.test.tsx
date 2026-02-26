import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CollectionsPage from '../page';
import * as collectionsApi from '@/lib/collections-api';
import type { Collection } from '@/types/collections';

jest.mock('@/lib/collections-api');
const mockedApi = collectionsApi as jest.Mocked<typeof collectionsApi>;

jest.mock('@/utils/snippet-format', () => ({
  formatSnippetDate: (iso: string) => iso,
}));

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

const makeCollection = (id: string, name: string): Collection => ({
  id,
  name,
  isPublic: false,
  userId: 'u1',
  itemCount: 3,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
});

describe('CollectionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = mockUser;
    mockedApi.listMyCollections.mockResolvedValue([]);
    mockedApi.createCollection.mockResolvedValue(makeCollection('c1', 'New Collection'));
    mockedApi.deleteCollection.mockResolvedValue(undefined);
  });

  it('redirects to login when not logged in', async () => {
    currentUser = null;
    render(<CollectionsPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/login'),
    );
  });

  it('renders collection cards', async () => {
    mockedApi.listMyCollections.mockResolvedValue([
      makeCollection('c1', 'My Collection'),
      makeCollection('c2', 'Another Collection'),
    ]);
    render(<CollectionsPage />);

    expect(await screen.findByText('My Collection')).toBeInTheDocument();
    expect(screen.getByText('Another Collection')).toBeInTheDocument();
  });

  it('shows create collection form', async () => {
    const user = userEvent.setup();
    render(<CollectionsPage />);

    await screen.findByText('+ New Collection');
    await user.click(screen.getByText('+ New Collection'));

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('creates a collection and adds to list', async () => {
    const user = userEvent.setup();
    render(<CollectionsPage />);

    // Wait for empty state
    await screen.findByText(/don't have any collections/i);

    await user.click(screen.getByText('+ New Collection'));
    await user.type(screen.getByLabelText('Name'), 'New Collection');
    await user.click(screen.getByText('Create Collection'));

    await waitFor(() =>
      expect(mockedApi.createCollection).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: 'New Collection' }),
      ),
    );

    expect(await screen.findByText('New Collection')).toBeInTheDocument();
  });

  it('deletes a collection', async () => {
    mockedApi.listMyCollections.mockResolvedValue([
      makeCollection('c1', 'My Collection'),
    ]);
    const user = userEvent.setup();
    render(<CollectionsPage />);

    await screen.findByText('My Collection');
    await user.click(screen.getByLabelText('Delete My Collection'));
    // First click shows confirmation
    await user.click(screen.getByText('Yes'));

    await waitFor(() =>
      expect(mockedApi.deleteCollection).toHaveBeenCalledWith(expect.anything(), 'c1'),
    );
  });
});
