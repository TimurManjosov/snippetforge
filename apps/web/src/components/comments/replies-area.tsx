'use client';

import { useEffect, useRef } from 'react';

import type { Comment } from '@/types/comments';
import CommentItem from './comment-item';

interface RepliesAreaProps {
  replies: Comment[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  open: boolean;
  currentUserId: string | null;
  currentUserRole: string | null;
  isLoggedIn: boolean;
  onLoad: () => void;
  onEdit: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => void;
  onFlag: (commentId: string) => void;
}

export default function RepliesArea({
  replies,
  loading,
  error,
  loaded,
  open,
  currentUserId,
  currentUserRole,
  isLoggedIn,
  onLoad,
  onEdit,
  onDelete,
  onFlag,
}: RepliesAreaProps) {
  const loadTriggered = useRef(false);

  useEffect(() => {
    if (open && !loaded && !loading && !loadTriggered.current) {
      loadTriggered.current = true;
      onLoad();
    }
  }, [open, loaded, loading, onLoad]);

  // Reset trigger when the area closes
  useEffect(() => {
    if (!open) {
      loadTriggered.current = false;
    }
  }, [open]);

  if (!open) return null;

  if (loading) {
    return (
      <div className="replies-area" data-testid="replies-loading">
        <p className="comments-loading-text">Loading replies…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="replies-area" data-testid="replies-error">
        <p className="comments-error-text">{error}</p>
        <button
          type="button"
          className="comment-btn comment-btn--secondary"
          onClick={() => {
            loadTriggered.current = false;
            onLoad();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loaded && replies.length === 0) {
    return (
      <div className="replies-area" data-testid="replies-empty">
        <p className="comments-empty-text">No replies yet.</p>
      </div>
    );
  }

  return (
    <div className="replies-area">
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isLoggedIn={isLoggedIn}
          isReply
          onEdit={onEdit}
          onDelete={onDelete}
          onFlag={onFlag}
        />
      ))}
    </div>
  );
}
