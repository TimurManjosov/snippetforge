'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';

import type { Collection } from '@/types/collections';
import { formatSnippetDate } from '@/utils/snippet-format';

interface CollectionCardProps {
  collection: Collection;
  onDelete?: (id: string) => void;
}

export default function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = useCallback(() => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDelete?.(collection.id);
    setConfirming(false);
  }, [confirming, collection.id, onDelete]);

  return (
    <div className="collection-card">
      <Link href={`/collections/${collection.id}`} className="collection-card-link">
        <h3 className="collection-card-name">{collection.name}</h3>
        {collection.description && (
          <p className="collection-card-desc">
            {collection.description.length > 120
              ? `${collection.description.slice(0, 120)}…`
              : collection.description}
          </p>
        )}
        <div className="collection-card-meta">
          <span className="collection-card-count">
            {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
          </span>
          {collection.isPublic && (
            <span className="collection-card-badge">Public</span>
          )}
          <span className="collection-card-date">
            {formatSnippetDate(collection.createdAt)}
          </span>
        </div>
      </Link>
      {onDelete && (
        <div className="collection-card-actions">
          {confirming ? (
            <>
              <span className="collection-card-confirm-text">Delete?</span>
              <button
                type="button"
                className="collection-card-delete-confirm"
                onClick={handleDelete}
              >
                Yes
              </button>
              <button
                type="button"
                className="collection-card-delete-cancel"
                onClick={() => setConfirming(false)}
              >
                No
              </button>
            </>
          ) : (
            <button
              type="button"
              className="collection-card-delete"
              aria-label={`Delete ${collection.name}`}
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
