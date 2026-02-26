'use client';

import { useCallback, useState } from 'react';

import { createCollectionSchema } from '@/lib/validations/collection-schema';
import type { Collection } from '@/types/collections';
import type { ApiClient } from '@/lib/api-client';
import { createCollection } from '@/lib/collections-api';

interface CreateCollectionFormProps {
  apiClient: ApiClient;
  onSuccess: (collection: Collection) => void;
  onCancel?: () => void;
}

export default function CreateCollectionForm({
  apiClient,
  onSuccess,
  onCancel,
}: CreateCollectionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});
      setApiError(null);

      const result = createCollectionSchema.safeParse({ name, description, isPublic });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0];
          if (key && typeof key === 'string') {
            fieldErrors[key] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      setSubmitting(true);

      try {
        const collection = await createCollection(apiClient, result.data);
        setName('');
        setDescription('');
        setIsPublic(false);
        onSuccess(collection);
      } catch {
        setApiError('Failed to create collection. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [apiClient, name, description, isPublic, onSuccess],
  );

  return (
    <form className="create-collection-form" onSubmit={handleSubmit}>
      <div className="create-collection-field">
        <label htmlFor="collection-name" className="create-collection-label">
          Name
        </label>
        <input
          id="collection-name"
          type="text"
          className="create-collection-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Collection"
          aria-invalid={!!errors.name}
          maxLength={100}
        />
        {errors.name && (
          <span className="create-collection-field-error" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <div className="create-collection-field">
        <label htmlFor="collection-description" className="create-collection-label">
          Description <span className="create-collection-optional">(optional)</span>
        </label>
        <textarea
          id="collection-description"
          className="create-collection-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short description…"
          rows={2}
          maxLength={500}
        />
        {errors.description && (
          <span className="create-collection-field-error" role="alert">
            {errors.description}
          </span>
        )}
      </div>

      <div className="create-collection-checkbox-field">
        <label className="create-collection-checkbox-label">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Public collection</span>
        </label>
      </div>

      {apiError && (
        <p className="create-collection-api-error" role="alert">
          {apiError}
        </p>
      )}

      <div className="create-collection-actions">
        <button
          type="submit"
          className="create-collection-submit"
          disabled={submitting}
        >
          {submitting ? 'Creating…' : 'Create Collection'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="create-collection-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
