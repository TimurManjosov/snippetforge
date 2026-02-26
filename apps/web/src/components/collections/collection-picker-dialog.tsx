'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createApiClient, ApiClientError } from '@/lib/api-client';
import { listMyCollections, addItem } from '@/lib/collections-api';
import { readToken } from '@/utils/storage';
import type { Collection } from '@/types/collections';
import CreateCollectionForm from './create-collection-form';

interface CollectionPickerDialogProps {
  snippetId: string;
  open: boolean;
  onClose: () => void;
}

export default function CollectionPickerDialog({
  snippetId,
  open,
  onClose,
}: CollectionPickerDialogProps) {
  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listMyCollections(apiClient);
        setCollections(result);
      } catch {
        setError('Failed to load collections.');
      } finally {
        setLoading(false);
      }
    };

    load();
    setAddedIds(new Set());
    setShowCreate(false);
  }, [apiClient, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  const handleAdd = useCallback(
    async (collectionId: string) => {
      setAddingId(collectionId);
      setError(null);
      try {
        await addItem(apiClient, collectionId, snippetId);
        setAddedIds((prev) => new Set(prev).add(collectionId));
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 409) {
          setAddedIds((prev) => new Set(prev).add(collectionId));
        } else {
          setError('Failed to add snippet to collection.');
        }
      } finally {
        setAddingId(null);
      }
    },
    [apiClient, snippetId],
  );

  const handleCreateSuccess = useCallback((collection: Collection) => {
    setCollections((prev) => [collection, ...prev]);
    setShowCreate(false);
  }, []);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="collection-picker-dialog"
      aria-modal="true"
      aria-label="Add to collection"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="collection-picker-content">
        <div className="collection-picker-header">
          <h3 className="collection-picker-title">Add to Collection</h3>
          <button
            type="button"
            className="collection-picker-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {loading && <p className="collection-picker-loading">Loading collections…</p>}

        {error && (
          <p className="collection-picker-error" role="alert">{error}</p>
        )}

        {!loading && (
          <ul className="collection-picker-list">
            {collections.map((c) => {
              const isAdded = addedIds.has(c.id);
              const isAdding = addingId === c.id;
              return (
                <li key={c.id} className="collection-picker-item">
                  <div className="collection-picker-item-info">
                    <span className="collection-picker-item-name">{c.name}</span>
                    <span className="collection-picker-item-count">
                      {c.itemCount} {c.itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`collection-picker-add-btn${isAdded ? ' collection-picker-add-btn--added' : ''}`}
                    disabled={isAdded || isAdding}
                    onClick={() => handleAdd(c.id)}
                  >
                    {isAdded ? '✓ Added' : isAdding ? 'Adding…' : 'Add'}
                  </button>
                </li>
              );
            })}
            {collections.length === 0 && !loading && (
              <li className="collection-picker-empty">No collections yet.</li>
            )}
          </ul>
        )}

        <div className="collection-picker-footer">
          {showCreate ? (
            <CreateCollectionForm
              apiClient={apiClient}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreate(false)}
            />
          ) : (
            <button
              type="button"
              className="collection-picker-create-btn"
              onClick={() => setShowCreate(true)}
            >
              + Create new collection
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
