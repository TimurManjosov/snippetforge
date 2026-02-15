"use client";

import type { CSSProperties } from "react";

import type { SnippetDetail } from "@/types/snippets";
import { formatLanguageLabel, formatSnippetDate } from "@/utils/snippet-format";
import CodeViewer from "@/components/code-viewer";

interface SnippetDetailProps {
  snippet: SnippetDetail;
}

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  python: "#3572a5",
  rust: "#dea584",
  go: "#00add8",
  java: "#b07219",
  ruby: "#cc342d",
  php: "#4f5d95",
  css: "#563d7c",
  html: "#e34c26",
  c: "#555555",
  "c++": "#f34b7d",
  shell: "#89e051",
  sql: "#e38c00",
};

export default function SnippetDetail({ snippet }: SnippetDetailProps) {
  const languageLabel = formatLanguageLabel(snippet.language);
  const langColor = LANGUAGE_COLORS[snippet.language.toLowerCase()] ?? "#6b7280";

  return (
    <article className="snippet-detail">
      <header className="snippet-detail-header">
        <div className="snippet-detail-heading">
          <span
            className="snippet-lang-badge"
            style={{ "--lang-color": langColor } as CSSProperties}
          >
            {languageLabel}
          </span>
          <h1 className="snippet-detail-title">{snippet.title}</h1>
          <p className="snippet-detail-desc">
            {snippet.description || "No description provided."}
          </p>
          {snippet.tags && snippet.tags.length > 0 && (
            <div className="snippet-tags">
              {snippet.tags.map((tag) => (
                <span key={tag} className="snippet-tag-chip">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <dl className="snippet-detail-meta">
          {snippet.user?.username && (
            <div className="snippet-detail-meta-item">
              <dt>Author</dt>
              <dd>{snippet.user.username}</dd>
            </div>
          )}
          <div className="snippet-detail-meta-item">
            <dt>Created</dt>
            <dd>{formatSnippetDate(snippet.createdAt)}</dd>
          </div>
          <div className="snippet-detail-meta-item">
            <dt>Updated</dt>
            <dd>{formatSnippetDate(snippet.updatedAt)}</dd>
          </div>
          <div className="snippet-detail-meta-item">
            <dt>Views</dt>
            <dd>
              {snippet.viewCount} {snippet.viewCount === 1 ? "view" : "views"}
            </dd>
          </div>
        </dl>
      </header>
      <CodeViewer code={snippet.code} language={snippet.language} />
    </article>
  );
}
