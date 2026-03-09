import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UsersDirectoryPage from '../page';
import * as usersDirectoryApi from '@/lib/users-directory-api';

jest.mock('@/lib/users-directory-api');
const mockedApi = usersDirectoryApi as jest.Mocked<typeof usersDirectoryApi>;

const mockPush = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => currentSearchParams,
}));

const makeResponse = (
  count: number,
): usersDirectoryApi.UserDirectoryResponse => ({
  items: Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    username: `user${i}`,
    displayName: `User ${i}`,
    avatarUrl: null,
    createdAt: '2025-01-01T00:00:00Z',
    publicSnippetCount: i * 2,
  })),
  meta: {
    page: 1,
    limit: 20,
    total: count,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});

describe('UsersDirectoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentSearchParams = new URLSearchParams();
    mockedApi.listUsers.mockResolvedValue(makeResponse(0));
  });

  it('renders user list', async () => {
    mockedApi.listUsers.mockResolvedValue(makeResponse(3));
    render(<UsersDirectoryPage />);

    expect(await screen.findByText('User 0')).toBeInTheDocument();
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
  });

  it('shows empty state when no users found', async () => {
    render(<UsersDirectoryPage />);

    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
  });

  it('renders correct links to user profiles', async () => {
    mockedApi.listUsers.mockResolvedValue(makeResponse(2));
    render(<UsersDirectoryPage />);

    const link = await screen.findByRole('link', { name: /User 0/i });
    expect(link).toHaveAttribute('href', '/users/user-0');
  });

  it('updates URL when search input changes', async () => {
    mockedApi.listUsers.mockResolvedValue(makeResponse(1));
    const user = userEvent.setup();

    render(<UsersDirectoryPage />);
    await screen.findByText('User 0');

    const input = screen.getByLabelText('Search users');
    await user.type(input, 'alice');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
      const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(lastCall).toContain('q=');
    });
  });

  it('shows snippet count for each user', async () => {
    mockedApi.listUsers.mockResolvedValue(makeResponse(2));
    render(<UsersDirectoryPage />);

    expect(await screen.findByText('0 snippets')).toBeInTheDocument();
    expect(screen.getByText('2 snippets')).toBeInTheDocument();
  });
});
