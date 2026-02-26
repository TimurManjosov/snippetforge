'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createApiClient } from '@/lib/api-client';
import { listFavorites, removeFavorite } from '@/lib/favorites-api';
import { useAuth } from '@/hooks/useAuth';
import { readToken } from '@/utils/storage';
import type { FavoritePreview } from '@/types/favorites';

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );

  const [favorites, setFavorites] = useState<FavoritePreview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

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
        const result = await listFavorites(apiClient, page, limit);
        if (!cancelled) {
          setFavorites(result.data);
          setTotal(result.total);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load favorites.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [apiClient, user, authLoading, router, page]);

  const handleUnsave = useCallback(
    async (snippetId: string) => {
      const prev = [...favorites];
      setFavorites((f) => f.filter((fav) => fav.snippetId !== snippetId));
      setTotal((t) => Math.max(0, t - 1));

      try {
        await removeFavorite(apiClient, snippetId);
      } catch {
        setFavorites(prev);
        setTotal((t) => t + 1);
      }
    },
    [apiClient, favorites],
  );

  const totalPages = Math.ceil(total / limit);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="favorites-page">
        <p className="favorites-loading">Loading…</p>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <h1 className="favorites-title">My Favorites</h1>

      {loading && <p className="favorites-loading">Loading favorites…</p>}

      {error && (
        <p className="favorites-error" role="alert">{error}</p>
      )}

      {!loading && !error && favorites.length === 0 && (
        <div className="favorites-empty">
          <p>You haven&apos;t saved any snippets yet.</p>
          <Link href="/snippets" className="favorites-browse-link">
            Browse snippets
          </Link>
        </div>
      )}

      {!loading && favorites.length > 0 && (
        <>
          <div className="favorites-list">
            {favorites.map((fav) => (
              <div key={fav.id} className="favorites-card">
                <Link
                  href={`/snippets/${fav.snippetId}`}
                  className="favorites-card-link"
                >
                  <span className="favorites-card-title">{fav.snippetTitle}</span>
                  <span className="favorites-card-lang">{fav.snippetLanguage}</span>
                </Link>
                <button
                  type="button"
                  className="favorites-unsave-btn"
                  aria-label={`Unsave ${fav.snippetTitle}`}
                  onClick={() => handleUnsave(fav.snippetId)}
                >
                  Unsave
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="favorites-pagination">
              <button
                type="button"
                className="favorites-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="favorites-page-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="favorites-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
