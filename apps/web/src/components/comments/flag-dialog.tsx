'use client';

import { useState } from 'react';

import { FlagSchema } from '@/types/comments.schemas';
import type { FlagReason } from '@/types/comments';

interface FlagDialogProps {
  onSubmit: (reason: FlagReason, message?: string) => Promise<void>;
  onClose: () => void;
}

const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'abuse', label: 'Abuse' },
  { value: 'off-topic', label: 'Off-topic' },
  { value: 'other', label: 'Other' },
];

export default function FlagDialog({ onSubmit, onClose }: FlagDialogProps) {
  const [reason, setReason] = useState<FlagReason>('spam');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const result = FlagSchema.safeParse({ reason, message: message || undefined });
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(result.data.reason as FlagReason, result.data.message);
      onClose();
    } catch {
      setError('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flag-dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="flag-dialog"
        role="dialog"
        aria-label="Flag comment"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="flag-dialog-title">Flag Comment</h3>
        <label className="flag-dialog-label" htmlFor="flag-reason">
          Reason
        </label>
        <select
          id="flag-reason"
          className="flag-dialog-select"
          value={reason}
          onChange={(e) => setReason(e.target.value as FlagReason)}
          disabled={submitting}
        >
          {FLAG_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <label className="flag-dialog-label" htmlFor="flag-message">
          Message (optional)
        </label>
        <textarea
          id="flag-message"
          className="flag-dialog-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Provide additional details…"
          rows={3}
          disabled={submitting}
        />
        {error && <p className="flag-dialog-error" role="alert">{error}</p>}
        <div className="flag-dialog-actions">
          <button
            type="button"
            className="comment-btn comment-btn--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="comment-btn comment-btn--danger"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Flag'}
          </button>
        </div>
      </div>
    </div>
  );
}
