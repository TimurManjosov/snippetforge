'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import { ApiClientError, createApiClient } from '@/lib/api-client';
import { getCollection, updateCollection } from '@/lib/collections-api';
import { useAuth } from '@/hooks/useAuth';
import { readToken } from '@/utils/storage';
import type { CollectionWithItems } from '@/types/collections';
import CollectionItemsList from '@/components/collections/collection-items-list';

export default function CollectionDetailPage() {
  const params = useParams();
  const collectionId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  }, [params]);

  const { user } = useAuth();

  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );

  const [collection, setCollection] = useState<CollectionWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!collectionId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const result = await getCollection(apiClient, collectionId);
        if (!cancelled) {
          setCollection(result);
          setEditName(result.name);
          setEditDescription(result.description ?? '');
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiClientError && [401, 403, 404].includes(err.status)) {
            setNotFound(true);
          } else {
            setError('Failed to load collection.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [apiClient, collectionId]);

  const isOwner = !!(user && collection && collection.userId === user.id);

  const handleSaveEdit = useCallback(async () => {
    if (!collection) return;
    setSaving(true);
    try {
      const updated = await updateCollection(apiClient, collection.id, {
        name: editName,
        description: editDescription || undefined,
      });
      setCollection((prev) => prev ? { ...prev, ...updated } : prev);
      setEditing(false);
    } catch {
      setError('Failed to update collection.');
    } finally {
      setSaving(false);
    }
  }, [apiClient, collection, editName, editDescription]);

  const handleItemRemoved = useCallback((snippetId: string) => {
    setCollection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((i) => i.snippetId !== snippetId),
        itemCount: Math.max(0, prev.itemCount - 1),
      };
    });
  }, []);

  if (loading) {
    return (
      <div className="collection-detail-page">
        <p className="collection-detail-loading">Loading collection…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="collection-detail-page">
        <div className="collection-detail-not-found">
          <p className="collection-detail-not-found-title">Collection not found</p>
          <p className="collection-detail-not-found-desc">
            This collection may be private, removed, or unavailable.
          </p>
          <Link href="/collections" className="collection-detail-back-link">
            Back to collections
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collection-detail-page">
        <p className="collection-detail-error" role="alert">{error}</p>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="collection-detail-page">
      <div className="collection-detail-header">
        {editing ? (
          <div className="collection-detail-edit-form">
            <input
              type="text"
              className="collection-detail-edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              aria-label="Collection name"
            />
            <textarea
              className="collection-detail-edit-desc"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              aria-label="Collection description"
            />
            <div className="collection-detail-edit-actions">
              <button
                type="button"
                className="collection-detail-save-btn"
                disabled={saving}
                onClick={handleSaveEdit}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="collection-detail-cancel-btn"
                onClick={() => {
                  setEditing(false);
                  setEditName(collection.name);
                  setEditDescription(collection.description ?? '');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="collection-detail-name">{collection.name}</h1>
            {collection.description && (
              <p className="collection-detail-desc">{collection.description}</p>
            )}
            <div className="collection-detail-meta">
              <span className="collection-detail-count">
                {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
              </span>
              {collection.isPublic && (
                <span className="collection-detail-badge">Public</span>
              )}
            </div>
            {isOwner && (
              <button
                type="button"
                className="collection-detail-edit-btn"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            )}
          </>
        )}
      </div>

      <CollectionItemsList
        items={collection.items}
        isOwner={isOwner}
        collectionId={collectionId}
        onItemRemoved={handleItemRemoved}
      />
    </div>
  );
}
