'use client';

import { useState } from 'react';
import Link from 'next/link';

import { CommentBodySchema } from '@/types/comments.schemas';

interface CommentComposerProps {
  onSubmit: (body: string) => Promise<void>;
  isLoggedIn: boolean;
  placeholder?: string;
  submitLabel?: string;
  initialBody?: string;
  onCancel?: () => void;
}

export default function CommentComposer({
  onSubmit,
  isLoggedIn,
  placeholder = 'Write a comment…',
  submitLabel = 'Comment',
  initialBody = '',
  onCancel,
}: CommentComposerProps) {
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const result = CommentBodySchema.safeParse(body);
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Invalid comment');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(result.data);
      setBody('');
    } catch {
      setError('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="comment-composer comment-composer--disabled">
        <textarea
          className="comment-composer-textarea"
          placeholder={placeholder}
          disabled
          aria-label="Comment"
        />
        <div className="comment-composer-actions">
          <Link href="/login" className="comment-login-cta">
            Log in to comment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-composer">
      <textarea
        className="comment-composer-textarea"
        placeholder={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitting}
        aria-label="Comment"
        rows={3}
      />
      {error && <p className="comment-composer-error" role="alert">{error}</p>}
      <div className="comment-composer-actions">
        {onCancel && (
          <button
            type="button"
            className="comment-btn comment-btn--secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="comment-btn comment-btn--primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
