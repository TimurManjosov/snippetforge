"use client";

const LANGUAGE_OPTIONS = [
  "typescript",
  "javascript",
  "python",
  "java",
  "go",
  "rust",
  "csharp",
  "php",
  "ruby",
  "swift",
  "kotlin",
];

interface LanguageSelectProps {
  value?: string;
  onChange: (value?: string) => void;
}

export default function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <div className="snippet-filter-control">
      <label htmlFor="snippet-language-select" className="snippet-filter-label">
        Language
      </label>
      <div className="snippet-select-wrap">
        <select
          id="snippet-language-select"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || undefined)}
          className="snippet-filter-select"
          aria-label="Filter snippets by language"
        >
          <option value="">All languages</option>
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="snippet-inline-clear-btn"
            aria-label="Clear language filter"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
