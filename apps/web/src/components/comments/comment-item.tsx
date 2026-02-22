'use client';

import { useState } from 'react';

import type { Comment } from '@/types/comments';
import { formatSnippetDate } from '@/utils/snippet-format';
import CommentComposer from './comment-composer';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  currentUserRole: string | null;
  isLoggedIn: boolean;
  isReply?: boolean;
  replyCount?: number;
  repliesOpen?: boolean;
  onToggleReplies?: () => void;
  onReply?: (body: string) => Promise<void>;
  onEdit: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => void;
  onFlag: (commentId: string) => void;
  children?: React.ReactNode;
}

export default function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
  isLoggedIn,
  isReply = false,
  replyCount,
  repliesOpen,
  onToggleReplies,
  onReply,
  onEdit,
  onDelete,
  onFlag,
  children,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);

  const isDeleted = comment.deletedAt != null;
  const isOwner = currentUserId != null && comment.userId === currentUserId;
  const isAdmin = currentUserRole === 'ADMIN';
  const canEdit = !isDeleted && (isOwner || isAdmin);
  const canDelete = !isDeleted && (isOwner || isAdmin);
  const canFlag = !isDeleted && isLoggedIn && !isOwner;
  const effectiveReplyCount = replyCount ?? comment.replyCount;

  if (isDeleted) {
    return (
      <div className="comment-item comment-item--deleted" data-testid="comment-deleted">
        <p className="comment-deleted-text">This comment was deleted.</p>
        {children}
      </div>
    );
  }

  const handleEdit = async (body: string) => {
    await onEdit(comment.id, body);
    setEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this comment?')) {
      onDelete(comment.id);
    }
  };

  const handleReply = async (body: string) => {
    if (onReply) {
      await onReply(body);
      setReplying(false);
    }
  };

  return (
    <div className={`comment-item${isReply ? ' comment-item--reply' : ''}`} data-testid="comment-item">
      <div className="comment-item-header">
        <span className="comment-item-author">{comment.userId ?? 'Anonymous'}</span>
        <span className="comment-item-date">{formatSnippetDate(comment.createdAt)}</span>
        {comment.editedAt && <span className="comment-item-edited">(edited)</span>}
      </div>

      {editing ? (
        <CommentComposer
          onSubmit={handleEdit}
          isLoggedIn={isLoggedIn}
          initialBody={comment.body}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
        />
      ) : (
        <p className="comment-item-body">{comment.body}</p>
      )}

      <div className="comment-item-actions">
        {!isReply && onToggleReplies && (
          <button
            type="button"
            className="comment-btn comment-btn--link"
            onClick={onToggleReplies}
          >
            {repliesOpen ? 'Hide replies' : `Show replies (${effectiveReplyCount})`}
          </button>
        )}
        {!isReply && isLoggedIn && onReply && !replying && (
          <button
            type="button"
            className="comment-btn comment-btn--link"
            onClick={() => setReplying(true)}
          >
            Reply
          </button>
        )}
        {canEdit && !editing && (
          <button
            type="button"
            className="comment-btn comment-btn--link"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className="comment-btn comment-btn--link comment-btn--danger-link"
            onClick={handleDelete}
          >
            Delete
          </button>
        )}
        {canFlag && (
          <button
            type="button"
            className="comment-btn comment-btn--link"
            onClick={() => onFlag(comment.id)}
          >
            Flag
          </button>
        )}
      </div>

      {replying && onReply && (
        <CommentComposer
          onSubmit={handleReply}
          isLoggedIn={isLoggedIn}
          placeholder="Write a reply…"
          submitLabel="Reply"
          onCancel={() => setReplying(false)}
        />
      )}

      {children}
    </div>
  );
}
