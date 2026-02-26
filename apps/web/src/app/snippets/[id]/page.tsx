'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SnippetDetail from '@/components/snippet-detail';
import CommentsPanel from '@/components/comments/comments-panel';
import ReactionBar from '@/components/reactions/reaction-bar';
import FavoriteButton from '@/components/favorites/favorite-button';
import AddToCollectionButton from '@/components/collections/add-to-collection-button';
import { ApiClientError, createApiClient } from '@/lib/api-client';
import type { SnippetDetail as SnippetDetailType } from '@/types/snippets';
import { readToken } from '@/utils/storage';

export default function SnippetDetailPage() {
  const params = useParams();
  const snippetId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  }, [params]);

  const [snippet, setSnippet] = useState<SnippetDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );

  useEffect(() => {
    if (!snippetId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Cancel any ongoing request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    // Reset state for new snippet
    setLoading(true);
    setError(null);
    setNotFound(false);
    setSnippet(null);

    console.log('[SnippetDetail] Fetching snippet:', snippetId);

    const fetchSnippet = async () => {
      try {
        const result = await apiClient.get<SnippetDetailType>(`/snippets/${snippetId}`, {
          signal,
        });

        // Check if this request was cancelled
        if (signal.aborted) {
          console.log('[SnippetDetail] Request was cancelled');
          return;
        }

        console.log('[SnippetDetail] API Response:', result);
        if (result) {
          setSnippet(result);
          setLoading(false);
        } else {
          // Handle undefined/null response
          console.warn('[SnippetDetail] Empty response received');
          setSnippet(null);
          setError('Failed to load snippet. Please try again.');
          setLoading(false);
        }
      } catch (err) {
        // Ignore errors from cancelled requests
        if (signal.aborted) {
          console.log('[SnippetDetail] Request aborted, ignoring error');
          return;
        }

        console.error('[SnippetDetail] Error:', err);

        if (err instanceof ApiClientError && [401, 403, 404].includes(err.status)) {
          setSnippet(null);
          setNotFound(true);
          setLoading(false);
        } else {
          const message =
            err instanceof ApiClientError
              ? err.message
              : 'Failed to load snippet. Please try again.';
          setSnippet(null);
          setError(message);
          setLoading(false);
        }
      }
    };

    fetchSnippet();

    // Cleanup: cancel request when component unmounts or snippetId changes
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [snippetId, apiClient, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  if (loading) {
    return (
      <div className="snippet-page">
        <div className="snippet-state-box snippet-empty-box">
          <p className="snippet-state-title">Loading snippet…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="snippet-page">
        <div className="snippet-state-box snippet-empty-box">
          <p className="snippet-state-title">Snippet not found</p>
          <p className="snippet-state-desc">
            This snippet may be private, removed, or unavailable.
          </p>
          <Link href="/snippets" className="snippet-retry-btn">
            Back to snippets
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="snippet-page">
        <div className="snippet-state-box snippet-error-box" role="alert">
          <p className="snippet-state-title">Unable to load snippet</p>
          <p className="snippet-state-desc">{error}</p>
          <button type="button" onClick={handleRetry} className="snippet-retry-btn">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!snippet) {
    return null;
  }

  return (
    <div className="snippet-page">
      <SnippetDetail snippet={snippet} />
      <div className="snippet-actions-bar">
        <ReactionBar snippetId={snippetId} />
        <FavoriteButton snippetId={snippetId} />
        <AddToCollectionButton snippetId={snippetId} />
      </div>
      <CommentsPanel snippetId={snippetId} />
    </div>
  );
}
