'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { createApiClient } from '@/lib/api-client';
import { addFavorite, removeFavorite, listFavorites } from '@/lib/favorites-api';
import { useAuth } from '@/hooks/useAuth';
import { readToken } from '@/utils/storage';

interface FavoriteButtonProps {
  snippetId: string;
}

export default function FavoriteButton({ snippetId }: FavoriteButtonProps) {
  const { user } = useAuth();
  const isLoggedIn = user != null;

  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );

  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const result = await listFavorites(apiClient, 1, 100);
        if (!cancelled) {
          setIsFavorited(result.data.some((f) => f.snippetId === snippetId));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [apiClient, snippetId, isLoggedIn]);

  const handleToggle = useCallback(async () => {
    if (!isLoggedIn) {
      setError('Please log in to save snippets');
      return;
    }

    if (toggling) return;
    setToggling(true);
    setError(null);

    const wasFavorited = isFavorited;
    setIsFavorited(!wasFavorited);

    try {
      if (wasFavorited) {
        await removeFavorite(apiClient, snippetId);
      } else {
        await addFavorite(apiClient, snippetId);
      }
    } catch {
      setIsFavorited(wasFavorited);
      setError('Something went wrong. Please try again.');
    } finally {
      setToggling(false);
    }
  }, [apiClient, snippetId, isLoggedIn, isFavorited, toggling]);

  return (
    <div className="favorite-wrapper">
      <button
        type="button"
        className={`favorite-btn${isFavorited ? ' favorite-btn--active' : ''}`}
        aria-pressed={isFavorited}
        aria-label={isFavorited ? 'Saved' : 'Save'}
        disabled={loading}
        onClick={handleToggle}
      >
        <span className="favorite-btn-icon">{isFavorited ? '♥' : '♡'}</span>
        <span className="favorite-btn-text">{isFavorited ? 'Saved' : 'Save'}</span>
      </button>
      {error && (
        <span className="favorite-error" role="alert">{error}</span>
      )}
    </div>
  );
}
