"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiClientError, createApiClient } from "@/lib/api-client";
import type { TagWithSnippetCount } from "@/types/snippets";
import { slugifyTag } from "@/utils/url-state";

interface TagFilterProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function TagFilter({ selected, onChange }: TagFilterProps) {
  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? "", () => null),
    [],
  );
  const [tagInput, setTagInput] = useState("");
  const [suggestions, setSuggestions] = useState<TagWithSnippetCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<TagWithSnippetCount[]>("/tags", {
          signal: controller.signal,
        });
        setSuggestions(result ?? []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message =
          err instanceof ApiClientError ? err.message : "Unable to load tag suggestions.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
    return () => abortRef.current?.abort();
  }, [apiClient]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleTag = useCallback(
    (tagSlug: string) => {
      const normalized = slugifyTag(tagSlug);
      if (!normalized) return;
      if (selectedSet.has(normalized)) {
        onChange(selected.filter((tag) => tag !== normalized));
        return;
      }
      onChange([...selected, normalized]);
    },
    [onChange, selected, selectedSet],
  );

  const handleAddTag = useCallback(() => {
    const normalized = slugifyTag(tagInput);
    if (!normalized) return;
    if (!selectedSet.has(normalized)) {
      onChange([...selected, normalized]);
    }
    setTagInput("");
  }, [onChange, selected, selectedSet, tagInput]);

  return (
    <div className="snippet-filter-control snippet-tag-filter">
      <label htmlFor="snippet-tag-input" className="snippet-filter-label">
        Tags
      </label>
      <div className="snippet-tag-input-wrap">
        <input
          id="snippet-tag-input"
          type="text"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAddTag();
            }
          }}
          placeholder="Add tag and press Enter"
          className="snippet-filter-input"
          aria-label="Add a tag filter"
        />
      </div>

      {selected.length > 0 && (
        <div className="snippet-filter-chip-group" aria-label="Selected tags">
          {selected.map((tag) => (
            <button
              key={tag}
              type="button"
              className="snippet-tag-chip snippet-filter-chip-btn snippet-tag-chip-active"
              onClick={() => toggleTag(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              #{tag} ×
            </button>
          ))}
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="snippet-filter-chip-group" aria-label="Tag suggestions">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`snippet-tag-chip snippet-filter-chip-btn ${selectedSet.has(tag.slug) ? "snippet-tag-chip-active" : ""}`}
              onClick={() => toggleTag(tag.slug)}
              aria-pressed={selectedSet.has(tag.slug)}
            >
              #{tag.slug}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="snippet-filter-hint">Loading tag suggestions…</p>}
      {!loading && error && <p className="snippet-filter-error">{error}</p>}
    </div>
  );
}
