import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CollectionPickerDialog from '../collection-picker-dialog';
import * as collectionsApi from '@/lib/collections-api';
import type { Collection } from '@/types/collections';

jest.mock('@/lib/collections-api');
const mockedApi = collectionsApi as jest.Mocked<typeof collectionsApi>;

jest.mock('@/utils/storage', () => ({
  readToken: () => 'mock-token',
  writeToken: jest.fn(),
  clearToken: jest.fn(),
}));

// Mock HTMLDialogElement methods for jsdom
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = jest.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = jest.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

const makeCollection = (id: string, name: string): Collection => ({
  id,
  name,
  isPublic: false,
  userId: 'u1',
  itemCount: 3,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
});

describe('CollectionPickerDialog', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.listMyCollections.mockResolvedValue([
      makeCollection('c1', 'My Collection'),
      makeCollection('c2', 'Another Collection'),
    ]);
    mockedApi.addItem.mockResolvedValue(undefined);
    mockedApi.createCollection.mockResolvedValue(makeCollection('c3', 'New Collection'));
  });

  it('loads collections when opened', async () => {
    render(
      <CollectionPickerDialog snippetId="s1" open={true} onClose={onClose} />,
    );

    expect(await screen.findByText('My Collection')).toBeInTheDocument();
    expect(screen.getByText('Another Collection')).toBeInTheDocument();
    expect(mockedApi.listMyCollections).toHaveBeenCalled();
  });

  it('calls addItem when clicking Add', async () => {
    const user = userEvent.setup();
    render(
      <CollectionPickerDialog snippetId="s1" open={true} onClose={onClose} />,
    );

    await screen.findByText('My Collection');
    const addButtons = screen.getAllByRole('button', { name: 'Add' });
    await user.click(addButtons[0]);

    await waitFor(() =>
      expect(mockedApi.addItem).toHaveBeenCalledWith(expect.anything(), 'c1', 's1'),
    );

    // Should show "Added" after success
    expect(await screen.findByText('✓ Added')).toBeInTheDocument();
  });

  it('validates empty name on create collection', async () => {
    const user = userEvent.setup();
    render(
      <CollectionPickerDialog snippetId="s1" open={true} onClose={onClose} />,
    );

    await screen.findByText('My Collection');
    await user.click(screen.getByText('+ Create new collection'));

    // Submit without filling name
    await user.click(screen.getByText('Create Collection'));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });

  it('creates a new collection', async () => {
    const user = userEvent.setup();
    render(
      <CollectionPickerDialog snippetId="s1" open={true} onClose={onClose} />,
    );

    await screen.findByText('My Collection');
    await user.click(screen.getByText('+ Create new collection'));

    await user.type(screen.getByLabelText('Name'), 'New Collection');
    await user.click(screen.getByText('Create Collection'));

    await waitFor(() =>
      expect(mockedApi.createCollection).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: 'New Collection' }),
      ),
    );

    // New collection should appear in list
    expect(await screen.findByText('New Collection')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(
      <CollectionPickerDialog snippetId="s1" open={true} onClose={onClose} />,
    );

    await screen.findByText('My Collection');
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });
});
