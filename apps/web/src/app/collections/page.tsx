'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createApiClient } from '@/lib/api-client';
import { listMyCollections, deleteCollection } from '@/lib/collections-api';
import { useAuth } from '@/hooks/useAuth';
import { readToken } from '@/utils/storage';
import type { Collection } from '@/types/collections';
import CollectionCard from '@/components/collections/collection-card';
import CreateCollectionForm from '@/components/collections/create-collection-form';

export default function CollectionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listMyCollections(apiClient);
        if (!cancelled) {
          setCollections(result);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load collections.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [apiClient, user, authLoading, router]);

  const handleCreateSuccess = useCallback((collection: Collection) => {
    setCollections((prev) => [collection, ...prev]);
    setShowCreate(false);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const prev = [...collections];
      setCollections((c) => c.filter((col) => col.id !== id));

      try {
        await deleteCollection(apiClient, id);
      } catch {
        setCollections(prev);
      }
    },
    [apiClient, collections],
  );

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="collections-page">
        <p className="collections-loading">Loading…</p>
      </div>
    );
  }

  return (
    <div className="collections-page">
      <div className="collections-page-header">
        <h1 className="collections-title">My Collections</h1>
        <button
          type="button"
          className="collections-create-toggle"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? 'Cancel' : '+ New Collection'}
        </button>
      </div>

      {showCreate && (
        <div className="collections-create-section">
          <CreateCollectionForm
            apiClient={apiClient}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {loading && <p className="collections-loading">Loading collections…</p>}

      {error && (
        <p className="collections-error" role="alert">{error}</p>
      )}

      {!loading && !error && collections.length === 0 && (
        <div className="collections-empty">
          <p>You don&apos;t have any collections yet. Create one!</p>
        </div>
      )}

      {!loading && collections.length > 0 && (
        <div className="collections-grid">
          {collections.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
