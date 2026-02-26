import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CollectionDetailPage from '../page';
import * as collectionsApi from '@/lib/collections-api';
import { ApiClientError } from '@/lib/api-client';
import type { CollectionWithItems } from '@/types/collections';

jest.mock('@/lib/collections-api');
const mockedApi = collectionsApi as jest.Mocked<typeof collectionsApi>;

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

let mockParams = { id: 'c1' };

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/utils/storage', () => ({
  readToken: () => (currentUser ? 'mock-token' : null),
  writeToken: jest.fn(),
  clearToken: jest.fn(),
}));

const makeCollectionWithItems = (
  overrides: Partial<CollectionWithItems> = {},
): CollectionWithItems => ({
  id: 'c1',
  name: 'Test Collection',
  description: 'A test collection',
  isPublic: false,
  userId: 'u1',
  itemCount: 2,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  items: [
    {
      id: 'i1',
      snippetId: 's1',
      snippetTitle: 'First Snippet',
      snippetLanguage: 'typescript',
      addedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'i2',
      snippetId: 's2',
      snippetTitle: 'Second Snippet',
      snippetLanguage: 'python',
      addedAt: '2025-01-02T00:00:00Z',
    },
  ],
  ...overrides,
});

describe('CollectionDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = mockUser;
    mockParams = { id: 'c1' };
    mockedApi.getCollection.mockResolvedValue(makeCollectionWithItems());
    mockedApi.removeItem.mockResolvedValue(undefined);
    mockedApi.updateCollection.mockResolvedValue({
      id: 'c1',
      name: 'Updated',
      isPublic: false,
      userId: 'u1',
      itemCount: 2,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    });
  });

  it('renders collection items', async () => {
    render(<CollectionDetailPage />);

    expect(await screen.findByText('Test Collection')).toBeInTheDocument();
    expect(screen.getByText('First Snippet')).toBeInTheDocument();
    expect(screen.getByText('Second Snippet')).toBeInTheDocument();
  });

  it('shows not found on 404', async () => {
    mockedApi.getCollection.mockRejectedValue(new ApiClientError(404, 'Not Found'));
    render(<CollectionDetailPage />);

    expect(await screen.findByText('Collection not found')).toBeInTheDocument();
  });

  it('owner sees remove buttons', async () => {
    render(<CollectionDetailPage />);

    await screen.findByText('First Snippet');
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBe(2);
  });

  it('non-owner does not see remove buttons', async () => {
    mockedApi.getCollection.mockResolvedValue(
      makeCollectionWithItems({ userId: 'other-user' }),
    );
    render(<CollectionDetailPage />);

    await screen.findByText('First Snippet');
    const removeButtons = screen.queryAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBe(0);
  });

  it('removes an item', async () => {
    const user = userEvent.setup();
    render(<CollectionDetailPage />);

    await screen.findByText('First Snippet');
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    await waitFor(() =>
      expect(mockedApi.removeItem).toHaveBeenCalledWith(expect.anything(), 'c1', 's1'),
    );

    // Item should be gone
    await waitFor(() =>
      expect(screen.queryByText('First Snippet')).not.toBeInTheDocument(),
    );
  });
});
