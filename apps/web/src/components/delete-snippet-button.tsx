"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError } from "@/lib/api-client";
import { deleteSnippet } from "@/lib/snippets-api";

interface DeleteSnippetButtonProps {
  id: string;
  token: string;
  onUnauthorized: () => void;
}

export default function DeleteSnippetButton({
  id,
  token,
  onUnauthorized,
}: DeleteSnippetButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap: focus the dialog when it opens
  useEffect(() => {
    if (showConfirm) {
      dialogRef.current?.focus();
    }
  }, [showConfirm]);

  // Close on Escape key
  useEffect(() => {
    if (!showConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        setShowConfirm(false);
        setError(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showConfirm, isDeleting]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteSnippet(token, id);
      router.push("/snippets/me");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          onUnauthorized();
          return;
        }
        if (err.status === 404) {
          setError("Snippet not found. It may have already been deleted.");
          return;
        }
        setError(err.message || "Failed to delete snippet.");
      } else {
        setError("Failed to delete snippet. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  }, [token, id, router, onUnauthorized]);

  return (
    <>
      <button
        type="button"
        className="snippet-delete-btn"
        onClick={() => {
          setShowConfirm(true);
          setError(null);
        }}
      >
        Delete snippet
      </button>

      {showConfirm && (
        <div className="snippet-confirm-overlay" onClick={() => !isDeleting && setShowConfirm(false)}>
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            className="snippet-confirm-dialog"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-dialog-title" className="snippet-confirm-title">
              Delete this snippet?
            </h2>
            <p id="delete-dialog-desc" className="snippet-confirm-desc">
              This action is permanent and cannot be undone. The snippet and all its data will be removed.
            </p>

            {error && (
              <div role="alert" className="snippet-confirm-error">
                {error}
              </div>
            )}

            <div className="snippet-confirm-actions">
              <button
                type="button"
                className="snippet-cancel-btn"
                onClick={() => {
                  setShowConfirm(false);
                  setError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="snippet-confirm-delete-btn"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
