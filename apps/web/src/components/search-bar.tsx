"use client";

import { useEffect, useMemo, useState } from "react";

import { normalizeSearchQuery } from "@/utils/url-state";

interface SearchBarProps {
  value?: string;
  onChange: (value?: string) => void;
  debounceMs?: number;
}

export default function SearchBar({ value, onChange, debounceMs = 300 }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value ?? "");
  const normalizedValue = useMemo(() => normalizeSearchQuery(value), [value]);

  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const normalizedInput = normalizeSearchQuery(inputValue);
      if (normalizedInput !== normalizedValue) {
        onChange(normalizedInput);
      }
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, inputValue, normalizedValue, onChange]);

  return (
    <div className="snippet-filter-control snippet-search-control">
      <label htmlFor="snippet-search-input" className="snippet-filter-label">
        Search
      </label>
      <div className="snippet-search-input-wrap">
        <input
          id="snippet-search-input"
          type="search"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Search by title or description"
          className="snippet-filter-input"
          aria-label="Search snippets by title or description"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue("")}
            className="snippet-inline-clear-btn"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
