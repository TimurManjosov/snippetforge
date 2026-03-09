import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import PublicSnippetsSection from '../public-snippets-section';
import { ApiClient } from '@/lib/api-client';

const mockSnippets = [
  {
    id: 's1',
    title: 'React Hook',
    description: 'A custom hook',
    language: 'typescript',
    userId: 'user-1',
    isPublic: true,
    viewCount: 10,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 's2',
    title: 'Python Script',
    description: 'A utility',
    language: 'python',
    userId: 'user-1',
    isPublic: true,
    viewCount: 5,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
];

jest.spyOn(ApiClient.prototype, 'get').mockResolvedValue({
  items: mockSnippets,
  meta: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});

describe('PublicSnippetsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ApiClient.prototype, 'get').mockResolvedValue({
      items: mockSnippets,
      meta: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it('renders "Public Snippets" heading', async () => {
    render(<PublicSnippetsSection userId="user-1" />);
    expect(screen.getByText('Public Snippets')).toBeInTheDocument();
  });

  it('renders snippet cards with mocked data', async () => {
    render(<PublicSnippetsSection userId="user-1" />);

    expect(await screen.findByText('React Hook')).toBeInTheDocument();
    expect(screen.getByText('Python Script')).toBeInTheDocument();
  });

  it('shows empty state when no snippets', async () => {
    jest.spyOn(ApiClient.prototype, 'get').mockResolvedValue({
      items: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(<PublicSnippetsSection userId="user-1" />);

    expect(
      await screen.findByText(/no public snippets yet/i),
    ).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<PublicSnippetsSection userId="user-1" />);
    expect(screen.getByText(/loading snippets/i)).toBeInTheDocument();
  });
});
