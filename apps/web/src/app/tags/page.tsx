"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ApiClientError } from "@/lib/api-client";
import { getAllTags } from "@/lib/snippets-api";
import type { TagWithSnippetCount } from "@/types/snippets";

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithSnippetCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTags = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await getAllTags(controller.signal);
      setTags(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load tags. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
    return () => abortRef.current?.abort();
  }, [fetchTags]);

  return (
    <main className="snippet-page">
      <div className="snippet-page-header">
        <h1 className="snippet-page-title">Tags</h1>
        <p className="snippet-page-subtitle">
          Browse topics and jump directly into filtered snippets.
        </p>
      </div>

      {error && (
        <div className="snippet-state-box snippet-error-box" role="alert">
          <p className="snippet-state-title">Unable to load tags</p>
          <p className="snippet-state-desc">{error}</p>
          <button type="button" onClick={fetchTags} className="snippet-retry-btn">
            Try again
          </button>
        </div>
      )}

      {!error && loading && (
        <div className="snippet-state-box snippet-empty-box">
          <p className="snippet-state-title">Loading tags…</p>
        </div>
      )}

      {!error && !loading && tags.length === 0 && (
        <div className="snippet-state-box snippet-empty-box">
          <p className="snippet-state-title">No tags yet.</p>
        </div>
      )}

      {!error && !loading && tags.length > 0 && (
        <div className="snippet-tags-list">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/snippets?tags=${encodeURIComponent(tag.slug)}`}
              className="snippet-tag-list-item"
            >
              <span className="snippet-tag-list-name">#{tag.slug}</span>
              <span className="snippet-tag-list-count">{tag.snippetCount}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
