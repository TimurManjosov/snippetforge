"use client";

import { type ChangeEvent, type FormEvent, useCallback, useMemo, useState } from "react";
import { z } from "zod";

import type { FieldErrors } from "@/utils/validation";
import { ApiClientError } from "@/lib/api-client";
import { attachTagsToSnippet, createSnippet } from "@/lib/snippets-api";
import type { CreateSnippetDto, SnippetResponse } from "@/types/snippets";
import { parseTagSlugs } from "@/utils/tags";
import CodeEditor from "@/components/code-editor";

const CreateSnippetSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .transform((value) => value.trim()),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .transform((value) => (value ? value.trim() : value)),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50000, "Code must be at most 50000 characters"),
  language: z
    .string()
    .min(1, "Language is required")
    .max(50, "Language must be at most 50 characters")
    .transform((value) => value.toLowerCase().trim())
    .refine(
      (value) => /^[a-z0-9-]+$/.test(value),
      "Language must be lowercase alphanumeric with hyphens",
    ),
  isPublic: z.boolean().default(true).optional(),
});

type SnippetFormValues = {
  title: string;
  description: string;
  tagsInput: string;
  code: string;
  language: string;
  isPublic: boolean;
};

interface SnippetFormProps {
  token: string;
  onSuccess: (snippet: SnippetResponse | null) => void;
  onUnauthorized: () => void;
}

const initialValues: SnippetFormValues = {
  title: "",
  description: "",
  tagsInput: "",
  code: "",
  language: "",
  isPublic: true,
};

const mapZodErrors = (error: z.ZodError): FieldErrors<SnippetFormValues> => {
  const fieldErrors: FieldErrors<SnippetFormValues> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof SnippetFormValues;
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
};

const mapServerFieldErrors = (
  error: ApiClientError,
): FieldErrors<SnippetFormValues> | null => {
  if (!error.details || typeof error.details !== "object") {
    return null;
  }
  const details = error.details as { fields?: Record<string, string[]> };
  if (!details.fields) return null;

  const fieldErrors: FieldErrors<SnippetFormValues> = {};
  for (const [field, messages] of Object.entries(details.fields)) {
    const key = field as keyof SnippetFormValues;
    if (!messages?.length || fieldErrors[key]) continue;
    if (key in initialValues) {
      fieldErrors[key] = messages[0];
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
};

export default function SnippetForm({ token, onSuccess, onUnauthorized }: SnippetFormProps) {
  const [values, setValues] = useState<SnippetFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SnippetFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const codeDescribedBy = useMemo(() => {
    const ids = ["snippet-code-help"];
    if (fieldErrors.code) ids.push("snippet-code-error");
    return ids.join(" ");
  }, [fieldErrors.code]);

  const clearFieldError = useCallback((field: keyof SnippetFormValues) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleChange = useCallback(
    (field: keyof SnippetFormValues) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value =
          event.target instanceof HTMLInputElement &&
          event.target.type === "checkbox"
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

      if (!token) {
        setFormError("Please sign in to create a snippet.");
        return;
      }

      const validation = CreateSnippetSchema.safeParse(values);
      if (!validation.success) {
        setFieldErrors(mapZodErrors(validation.error));
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = validation.data as CreateSnippetDto;
        const response = await createSnippet(token, payload);
        const tags = parseTagSlugs(values.tagsInput);
        if (response.id && tags.length > 0) {
          await attachTagsToSnippet(token, response.id, tags);
        }
        onSuccess(response);
      } catch (err) {
        if (err instanceof ApiClientError) {
          if (err.status === 401) {
            onUnauthorized();
            return;
          }
          let handledFieldErrors = false;
          if (err.status === 400) {
            const serverErrors = mapServerFieldErrors(err);
            if (serverErrors) {
              setFieldErrors(serverErrors);
              handledFieldErrors = true;
            }
          }
          if (!handledFieldErrors) {
            setFormError(err.message || "Unable to create snippet.");
          }
        } else {
          setFormError("Unable to create snippet. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [token, values, onSuccess, onUnauthorized],
  );

  return (
    <div className="snippet-form-card">
      <form onSubmit={handleSubmit} noValidate className="snippet-form">
        {formError && (
          <div role="alert" className="snippet-form-error">
            {formError}
          </div>
        )}

        <div className="snippet-form-field">
          <label htmlFor="snippet-title" className="snippet-form-label">
            Title <span className="snippet-form-required">*</span>
          </label>
          <input
            id="snippet-title"
            type="text"
            value={values.title}
            onChange={handleChange("title")}
            aria-invalid={!!fieldErrors.title}
            aria-describedby={fieldErrors.title ? "snippet-title-error" : undefined}
            className="snippet-form-input"
            placeholder="A concise title for your snippet"
            disabled={isSubmitting}
          />
          {fieldErrors.title && (
            <p id="snippet-title-error" className="snippet-field-error" role="alert">
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div className="snippet-form-field">
          <label htmlFor="snippet-description" className="snippet-form-label">
            Description
          </label>
          <textarea
            id="snippet-description"
            value={values.description}
            onChange={handleChange("description")}
            aria-invalid={!!fieldErrors.description}
            aria-describedby={
              fieldErrors.description ? "snippet-description-error" : "snippet-description-help"
            }
            className="snippet-form-textarea"
            placeholder="Optional context or usage notes"
            disabled={isSubmitting}
          />
          <p id="snippet-description-help" className="snippet-form-helper">
            Add context to help others understand when to use the snippet.
          </p>
          {fieldErrors.description && (
            <p
              id="snippet-description-error"
              className="snippet-field-error"
              role="alert"
            >
              {fieldErrors.description}
            </p>
          )}
        </div>

        <div className="snippet-form-field">
          <label htmlFor="snippet-language" className="snippet-form-label">
            Language <span className="snippet-form-required">*</span>
          </label>
          <input
            id="snippet-language"
            type="text"
            value={values.language}
            onChange={handleChange("language")}
            aria-invalid={!!fieldErrors.language}
            aria-describedby={
              fieldErrors.language ? "snippet-language-error" : "snippet-language-help"
            }
            className="snippet-form-input"
            placeholder="e.g. typescript, python, css"
            autoCapitalize="none"
            autoCorrect="off"
            disabled={isSubmitting}
          />
          <p id="snippet-language-help" className="snippet-form-helper">
            Use lowercase and hyphens only (e.g. &quot;node-js&quot;).
          </p>
          {fieldErrors.language && (
            <p id="snippet-language-error" className="snippet-field-error" role="alert">
              {fieldErrors.language}
            </p>
          )}
        </div>

        <div className="snippet-form-field">
          <label htmlFor="snippet-tags" className="snippet-form-label">
            Tags
          </label>
          <input
            id="snippet-tags"
            type="text"
            value={values.tagsInput}
            onChange={handleChange("tagsInput")}
            className="snippet-form-input"
            placeholder="e.g. typescript, api, backend"
            disabled={isSubmitting}
          />
          <p className="snippet-form-helper">
            Optional. Comma-separated tag slugs.
          </p>
        </div>

        <div className="snippet-form-field">
          <label htmlFor="snippet-code" className="snippet-form-label">
            Code <span className="snippet-form-required">*</span>
          </label>
          <CodeEditor
            id="snippet-code"
            value={values.code}
            onChange={handleCodeChange}
            maxLength={50000}
            disabled={isSubmitting}
            describedBy={codeDescribedBy}
            hasError={!!fieldErrors.code}
          />
          <p id="snippet-code-help" className="snippet-form-helper">
            Max 50,000 characters. Tabs and spacing are preserved.
          </p>
          {fieldErrors.code && (
            <p id="snippet-code-error" className="snippet-field-error" role="alert">
              {fieldErrors.code}
            </p>
          )}
        </div>

        <div className="snippet-form-field">
          <label htmlFor="snippet-public" className="snippet-form-label">
            Visibility
          </label>
          <div className="snippet-form-toggle">
            <input
              id="snippet-public"
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

        <div className="snippet-form-actions">
          <button type="submit" className="snippet-submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create snippet"}
          </button>
        </div>
      </form>
    </div>
  );
}
