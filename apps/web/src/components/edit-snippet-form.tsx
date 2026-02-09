"use client";

import { type ChangeEvent, type FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { ApiClientError } from "@/lib/api-client";
import { updateSnippet } from "@/lib/snippets-api";
import type { SnippetDetail, UpdateSnippetDto } from "@/types/snippets";
import type { FieldErrors } from "@/utils/validation";
import CodeEditor from "@/components/code-editor";

const UpdateSnippetSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .transform((v) => v.trim()),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .transform((v) => v.trim()),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50000, "Code must be at most 50,000 characters"),
  language: z
    .string()
    .min(1, "Language is required")
    .max(50, "Language must be at most 50 characters")
    .transform((v) => v.toLowerCase().trim()),
  isPublic: z.boolean(),
});

type EditFormValues = {
  title: string;
  description: string;
  code: string;
  language: string;
  isPublic: boolean;
};

interface EditSnippetFormProps {
  initialSnippet: SnippetDetail;
  token: string;
  onUnauthorized: () => void;
  onNotFound: () => void;
}

function toFormValues(snippet: SnippetDetail): EditFormValues {
  return {
    title: snippet.title,
    description: snippet.description ?? "",
    code: snippet.code,
    language: snippet.language,
    isPublic: snippet.isPublic,
  };
}

function computeChangedFields(
  initial: EditFormValues,
  current: EditFormValues,
): UpdateSnippetDto | null {
  const diff: UpdateSnippetDto = {};
  let hasChange = false;

  if (current.title !== initial.title) {
    diff.title = current.title;
    hasChange = true;
  }
  if (current.description !== initial.description) {
    diff.description = current.description;
    hasChange = true;
  }
  if (current.code !== initial.code) {
    diff.code = current.code;
    hasChange = true;
  }
  if (current.language !== initial.language) {
    diff.language = current.language;
    hasChange = true;
  }
  if (current.isPublic !== initial.isPublic) {
    diff.isPublic = current.isPublic;
    hasChange = true;
  }

  return hasChange ? diff : null;
}

const mapZodErrors = (error: z.ZodError): FieldErrors<EditFormValues> => {
  const fieldErrors: FieldErrors<EditFormValues> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof EditFormValues;
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
};

const FIELD_KEYS: (keyof EditFormValues)[] = ["title", "description", "code", "language", "isPublic"];

const mapServerFieldErrors = (
  error: ApiClientError,
): FieldErrors<EditFormValues> | null => {
  if (!error.details || typeof error.details !== "object") return null;
  const details = error.details as { fields?: Record<string, string[]> };
  if (!details.fields) return null;

  const fieldErrors: FieldErrors<EditFormValues> = {};
  for (const [field, messages] of Object.entries(details.fields)) {
    const key = field as keyof EditFormValues;
    if (!messages?.length || fieldErrors[key]) continue;
    if (FIELD_KEYS.includes(key)) {
      fieldErrors[key] = messages[0];
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
};

export default function EditSnippetForm({
  initialSnippet,
  token,
  onUnauthorized,
  onNotFound,
}: EditSnippetFormProps) {
  const router = useRouter();
  const initialValues = useRef(toFormValues(initialSnippet));
  const [values, setValues] = useState<EditFormValues>(initialValues.current);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<EditFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges = useMemo(
    () => computeChangedFields(initialValues.current, values) !== null,
    [values],
  );

  const codeDescribedBy = useMemo(() => {
    const ids = ["edit-code-help"];
    if (fieldErrors.code) ids.push("edit-code-error");
    return ids.join(" ");
  }, [fieldErrors.code]);

  const clearFieldError = useCallback((field: keyof EditFormValues) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleChange = useCallback(
    (field: keyof EditFormValues) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value =
          event.target instanceof HTMLInputElement && event.target.type === "checkbox"
            ? event.target.checked
            : event.target.value;
        setValues((prev) => ({ ...prev, [field]: value }));
        clearFieldError(field);
      },
    [clearFieldError],
  );

  const handleCodeChange = useCallback(
    (value: string) => {
      setValues((prev) => ({ ...prev, code: value }));
      clearFieldError("code");
    },
    [clearFieldError],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setFormError(null);
      setFieldErrors({});

      // Validate full form state
      const validation = UpdateSnippetSchema.safeParse(values);
      if (!validation.success) {
        setFieldErrors(mapZodErrors(validation.error));
        return;
      }

      // Compute diff – only send changed fields
      const diff = computeChangedFields(initialValues.current, validation.data);
      if (!diff) {
        setFormError("No changes to save.");
        return;
      }

      setIsSubmitting(true);
      try {
        await updateSnippet(token, initialSnippet.id, diff);
        router.push(`/snippets/${initialSnippet.id}`);
      } catch (err) {
        if (err instanceof ApiClientError) {
          if (err.status === 401) {
            onUnauthorized();
            return;
          }
          if (err.status === 404) {
            onNotFound();
            return;
          }
          if (err.status === 400) {
            const serverErrors = mapServerFieldErrors(err);
            if (serverErrors) {
              setFieldErrors(serverErrors);
            } else {
              setFormError(err.message || "Validation failed.");
            }
          } else {
            setFormError(err.message || "Unable to update snippet.");
          }
        } else {
          setFormError("Unable to update snippet. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, token, initialSnippet.id, router, onUnauthorized, onNotFound],
  );

  return (
    <div className="snippet-form-card">
      <form onSubmit={handleSubmit} noValidate className="snippet-form">
        {formError && (
          <div role="alert" className="snippet-form-error">
            {formError}
          </div>
        )}

        {/* Title */}
        <div className="snippet-form-field">
          <label htmlFor="edit-title" className="snippet-form-label">
            Title <span className="snippet-form-required">*</span>
          </label>
          <input
            id="edit-title"
            type="text"
            value={values.title}
            onChange={handleChange("title")}
            aria-invalid={!!fieldErrors.title}
            aria-describedby={fieldErrors.title ? "edit-title-error" : undefined}
            className="snippet-form-input"
            placeholder="A concise title for your snippet"
            disabled={isSubmitting}
          />
          {fieldErrors.title && (
            <p id="edit-title-error" className="snippet-field-error" role="alert">
              {fieldErrors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="snippet-form-field">
          <label htmlFor="edit-description" className="snippet-form-label">
            Description
          </label>
          <textarea
            id="edit-description"
            value={values.description}
            onChange={handleChange("description")}
            aria-invalid={!!fieldErrors.description}
            aria-describedby={
              fieldErrors.description ? "edit-description-error" : "edit-description-help"
            }
            className="snippet-form-textarea"
            placeholder="Optional context or usage notes"
            disabled={isSubmitting}
          />
          <p id="edit-description-help" className="snippet-form-helper">
            Add context to help others understand when to use the snippet.
          </p>
          {fieldErrors.description && (
            <p id="edit-description-error" className="snippet-field-error" role="alert">
              {fieldErrors.description}
            </p>
          )}
        </div>

        {/* Language */}
        <div className="snippet-form-field">
          <label htmlFor="edit-language" className="snippet-form-label">
            Language <span className="snippet-form-required">*</span>
          </label>
          <input
            id="edit-language"
            type="text"
            value={values.language}
            onChange={handleChange("language")}
            aria-invalid={!!fieldErrors.language}
            aria-describedby={
              fieldErrors.language ? "edit-language-error" : "edit-language-help"
            }
            className="snippet-form-input"
            placeholder="e.g. typescript, python, css"
            autoCapitalize="none"
            autoCorrect="off"
            disabled={isSubmitting}
          />
          <p id="edit-language-help" className="snippet-form-helper">
            Use lowercase (e.g. &quot;typescript&quot;, &quot;node-js&quot;).
          </p>
          {fieldErrors.language && (
            <p id="edit-language-error" className="snippet-field-error" role="alert">
              {fieldErrors.language}
            </p>
          )}
        </div>

        {/* Code */}
        <div className="snippet-form-field">
          <label htmlFor="edit-code" className="snippet-form-label">
            Code <span className="snippet-form-required">*</span>
          </label>
          <CodeEditor
            id="edit-code"
            value={values.code}
            onChange={handleCodeChange}
            maxLength={50000}
            disabled={isSubmitting}
            describedBy={codeDescribedBy}
            hasError={!!fieldErrors.code}
          />
          <p id="edit-code-help" className="snippet-form-helper">
            Max 50,000 characters. Tabs and spacing are preserved.
          </p>
          {fieldErrors.code && (
            <p id="edit-code-error" className="snippet-field-error" role="alert">
              {fieldErrors.code}
            </p>
          )}
        </div>

        {/* Visibility */}
        <div className="snippet-form-field">
          <label htmlFor="edit-public" className="snippet-form-label">
            Visibility
          </label>
          <div className="snippet-form-toggle">
            <input
              id="edit-public"
              type="checkbox"
              checked={values.isPublic}
              onChange={handleChange("isPublic")}
              className="snippet-toggle-input"
              disabled={isSubmitting}
            />
            <span className="snippet-toggle-text">
              {values.isPublic ? "Public snippet" : "Private snippet"}
            </span>
          </div>
          <p className="snippet-form-helper">
            Public snippets appear in the community feed.
          </p>
        </div>

        {/* Actions */}
        <div className="snippet-form-actions">
          <button
            type="button"
            className="snippet-cancel-btn"
            onClick={() => router.push(`/snippets/${initialSnippet.id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="snippet-submit"
            disabled={isSubmitting || !hasChanges}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
