'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Comment, FlagReason, PaginatedMeta } from '@/types/comments';
import { ApiClientError, createApiClient } from '@/lib/api-client';
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  flagComment,
} from '@/lib/comments-api';
import { useAuth } from '@/hooks/useAuth';
import { readToken } from '@/utils/storage';
import CommentComposer from './comment-composer';
import CommentItem from './comment-item';
import RepliesArea from './replies-area';
import FlagDialog from './flag-dialog';

interface CommentsPanelProps {
  snippetId: string;
}

interface RepliesState {
  items: Comment[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export default function CommentsPanel({ snippetId }: CommentsPanelProps) {
  const { user } = useAuth();
  const isLoggedIn = user != null;

  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );

  // Top-level comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Replies map: commentId -> RepliesState
  const [repliesMap, setRepliesMap] = useState<Record<string, RepliesState>>({});
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());

  // Flag dialog
  const [flagTarget, setFlagTarget] = useState<string | null>(null);

  const loadingRef = useRef(false);

  const loadComments = useCallback(
    async (p: number) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const result = await listComments(apiClient, snippetId, {
          page: p,
          order: 'desc',
        });
        setComments(result.items);
        setMeta(result.meta);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 404) {
          setError('Comments unavailable.');
        } else {
          setError('Something went wrong.');
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [apiClient, snippetId],
  );

  useEffect(() => {
    loadComments(page);
  }, [loadComments, page]);

  const handleCreate = useCallback(
    async (body: string) => {
      const newComment = await createComment(apiClient, snippetId, body);
      setComments((prev) => [newComment, ...prev]);
      setMeta((prev) =>
        prev ? { ...prev, total: prev.total + 1 } : prev,
      );
    },
    [apiClient, snippetId],
  );

  const handleEdit = useCallback(
    async (commentId: string, body: string) => {
      const updated = await updateComment(apiClient, commentId, body);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c)),
      );
      // Also update in replies map
      setRepliesMap((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          const state = next[key];
          if (state) {
            next[key] = {
              ...state,
              items: state.items.map((c) =>
                c.id === commentId ? updated : c,
              ),
            };
          }
        }
        return next;
      });
    },
    [apiClient],
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      await deleteComment(apiClient, commentId);
      const now = new Date().toISOString();
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, deletedAt: now } : c,
        ),
      );
      setRepliesMap((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          const state = next[key];
          if (state) {
            next[key] = {
              ...state,
              items: state.items.map((c) =>
                c.id === commentId ? { ...c, deletedAt: now } : c,
              ),
            };
          }
        }
        return next;
      });
    },
    [apiClient],
  );

  const handleFlag = useCallback(
    async (reason: FlagReason, message?: string) => {
      if (!flagTarget) return;
      await flagComment(apiClient, flagTarget, reason, message);
    },
    [apiClient, flagTarget],
  );

  const loadReplies = useCallback(
    async (parentId: string) => {
      setRepliesMap((prev) => ({
        ...prev,
        [parentId]: { items: prev[parentId]?.items ?? [], loading: true, loaded: false, error: null },
      }));
      try {
        const result = await listComments(apiClient, snippetId, {
          parentId,
          order: 'asc',
          limit: 50,
        });
        setRepliesMap((prev) => ({
          ...prev,
          [parentId]: { items: result.items, loading: false, loaded: true, error: null },
        }));
      } catch {
        setRepliesMap((prev) => ({
          ...prev,
          [parentId]: {
            items: prev[parentId]?.items ?? [],
            loading: false,
            loaded: false,
            error: 'Failed to load replies.',
          },
        }));
      }
    },
    [apiClient, snippetId],
  );

  const toggleReplies = useCallback((commentId: string) => {
    setOpenReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  const handleReply = useCallback(
    async (parentId: string, body: string) => {
      const newReply = await createComment(apiClient, snippetId, body, parentId);
      setRepliesMap((prev) => ({
        ...prev,
        [parentId]: {
          items: [...(prev[parentId]?.items ?? []), newReply],
          loading: false,
          loaded: true,
          error: null,
        },
      }));
      // Update replyCount on parent
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replyCount: c.replyCount + 1 } : c,
        ),
      );
    },
    [apiClient, snippetId],
  );

  if (loading) {
    return (
      <section className="comments-panel" aria-label="Comments">
        <h2 className="comments-panel-title">Comments</h2>
        <p className="comments-loading-text">Loading comments…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="comments-panel" aria-label="Comments">
        <h2 className="comments-panel-title">Comments</h2>
        <p className="comments-error-text" role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section className="comments-panel" aria-label="Comments">
      <h2 className="comments-panel-title">
        Comments {meta ? `(${meta.total})` : ''}
      </h2>

      <CommentComposer onSubmit={handleCreate} isLoggedIn={isLoggedIn} />

      {comments.length === 0 ? (
        <p className="comments-empty-text">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => {
            const repliesState = repliesMap[comment.id];
            const isOpen = openReplies.has(comment.id);
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user?.id ?? null}
                currentUserRole={user?.role ?? null}
                isLoggedIn={isLoggedIn}
                replyCount={comment.replyCount}
                repliesOpen={isOpen}
                onToggleReplies={() => toggleReplies(comment.id)}
                onReply={(body) => handleReply(comment.id, body)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onFlag={(id) => setFlagTarget(id)}
              >
                <RepliesArea
                  replies={repliesState?.items ?? []}
                  loading={repliesState?.loading ?? false}
                  loaded={repliesState?.loaded ?? false}
                  error={repliesState?.error ?? null}
                  open={isOpen}
                  currentUserId={user?.id ?? null}
                  currentUserRole={user?.role ?? null}
                  isLoggedIn={isLoggedIn}
                  onLoad={() => loadReplies(comment.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onFlag={(id) => setFlagTarget(id)}
                />
              </CommentItem>
            );
          })}
        </div>
      )}

      {meta && meta.hasNextPage && (
        <button
          type="button"
          className="comment-btn comment-btn--secondary comments-load-more"
          onClick={() => setPage((p) => p + 1)}
        >
          Load more
        </button>
      )}

      {flagTarget && (
        <FlagDialog
          onSubmit={handleFlag}
          onClose={() => setFlagTarget(null)}
        />
      )}
    </section>
  );
}
