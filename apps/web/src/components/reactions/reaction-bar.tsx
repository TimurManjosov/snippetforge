'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createApiClient } from '@/lib/api-client';
import { getSnippetReactions, setReaction, removeReaction } from '@/lib/reactions-api';
import { useAuth } from '@/hooks/useAuth';
import { readToken } from '@/utils/storage';
import type { ReactionCount, ReactionType } from '@/types/reactions';

interface ReactionBarProps {
  snippetId: string;
}

const REACTION_CONFIG: { type: ReactionType; label: string; icon: string; activeIcon: string }[] = [
  { type: 'like', label: 'Like', icon: '👍', activeIcon: '👍' },
  { type: 'star', label: 'Star', icon: '☆', activeIcon: '★' },
];

export default function ReactionBar({ snippetId }: ReactionBarProps) {
  const { user } = useAuth();
  const isLoggedIn = user != null;

  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );

  const [counts, setCounts] = useState<ReactionCount[]>([]);
  const [viewerReactions, setViewerReactions] = useState<ReactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const togglingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getSnippetReactions(apiClient, snippetId);
        if (!cancelled) {
          setCounts(data.counts);
          setViewerReactions(data.viewer ?? []);
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
  }, [apiClient, snippetId]);

  const getCount = useCallback(
    (type: ReactionType) => counts.find((c) => c.type === type)?.count ?? 0,
    [counts],
  );

  const isActive = useCallback(
    (type: ReactionType) => viewerReactions.includes(type),
    [viewerReactions],
  );

  const handleToggle = useCallback(
    async (type: ReactionType) => {
      if (!isLoggedIn) {
        setError('Please log in to react');
        return;
      }

      if (togglingRef.current) return;
      togglingRef.current = true;
      setError(null);

      const wasActive = viewerReactions.includes(type);
      const prevCounts = [...counts];
      const prevViewer = [...viewerReactions];

      // Optimistic update
      setCounts((prev) =>
        prev.some((c) => c.type === type)
          ? prev.map((c) => c.type === type ? { ...c, count: c.count + (wasActive ? -1 : 1) } : c)
          : [...prev, { type, count: 1 }],
      );
      setViewerReactions((prev) =>
        wasActive ? prev.filter((r) => r !== type) : [...prev, type],
      );

      try {
        if (wasActive) {
          await removeReaction(apiClient, snippetId, type);
        } else {
          await setReaction(apiClient, snippetId, type);
        }
      } catch {
        // Rollback
        setCounts(prevCounts);
        setViewerReactions(prevViewer);
        setError('Something went wrong. Please try again.');
      } finally {
        togglingRef.current = false;
      }
    },
    [apiClient, snippetId, isLoggedIn, viewerReactions, counts],
  );

  if (loading) {
    return (
      <div className="reaction-bar">
        <span className="reaction-bar-loading">Loading…</span>
      </div>
    );
  }

  return (
    <div className="reaction-bar">
      {REACTION_CONFIG.map(({ type, label, icon, activeIcon }) => {
        const active = isActive(type);
        const count = getCount(type);
        return (
          <button
            key={type}
            type="button"
            className={`reaction-btn${active ? ' reaction-btn--active' : ''}`}
            aria-pressed={active}
            aria-label={`${label} (${count})`}
            onClick={() => handleToggle(type)}
          >
            <span className="reaction-btn-icon">{active ? activeIcon : icon}</span>
            <span className="reaction-btn-count">{count}</span>
          </button>
        );
      })}
      {error && (
        <span className="reaction-bar-error" role="alert">{error}</span>
      )}
    </div>
  );
}
