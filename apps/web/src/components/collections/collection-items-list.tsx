'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { createApiClient, ApiClientError } from '@/lib/api-client';
import { removeItem } from '@/lib/collections-api';
import { readToken } from '@/utils/storage';
import type { CollectionItem } from '@/types/collections';

interface CollectionItemsListProps {
  items: CollectionItem[];
  isOwner: boolean;
  collectionId: string;
  onItemRemoved?: (snippetId: string) => void;
}

export default function CollectionItemsList({
  items: initialItems,
  isOwner,
  collectionId,
  onItemRemoved,
}: CollectionItemsListProps) {
  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );

  const [items, setItems] = useState(initialItems);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = useCallback(
    async (snippetId: string) => {
      setRemovingId(snippetId);
      setError(null);
      const prevItems = [...items];
      setItems((prev) => prev.filter((i) => i.snippetId !== snippetId));

      try {
        await removeItem(apiClient, collectionId, snippetId);
        onItemRemoved?.(snippetId);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 404) {
          // Already removed
          onItemRemoved?.(snippetId);
        } else {
          setItems(prevItems);
          setError('Failed to remove item. Please try again.');
        }
      } finally {
        setRemovingId(null);
      }
    },
    [apiClient, collectionId, items, onItemRemoved],
  );

  if (items.length === 0) {
    return <p className="collection-items-empty">No items in this collection yet.</p>;
  }

  return (
    <div className="collection-items-list">
      {error && (
        <p className="collection-items-error" role="alert">{error}</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="collection-items-card">
          <Link
            href={`/snippets/${item.snippetId}`}
            className="collection-items-card-link"
          >
            <span className="collection-items-card-title">{item.snippetTitle}</span>
            <span className="collection-items-card-lang">{item.snippetLanguage}</span>
          </Link>
          {isOwner && (
            <button
              type="button"
              className="collection-items-remove-btn"
              aria-label={`Remove ${item.snippetTitle}`}
              disabled={removingId === item.snippetId}
              onClick={() => handleRemove(item.snippetId)}
            >
              {removingId === item.snippetId ? 'Removing…' : 'Remove'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
