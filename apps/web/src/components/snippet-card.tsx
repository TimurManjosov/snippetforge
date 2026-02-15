"use client";

import Link from "next/link";

import type { SnippetPreview } from "@/types/snippet";

interface SnippetCardProps {
  snippet: SnippetPreview;
  ownerView?: boolean;
}

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

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

export default function SnippetCard({ snippet, ownerView }: SnippetCardProps) {
  const langColor = LANGUAGE_COLORS[snippet.language.toLowerCase()] ?? "#6b7280";

  return (
    <Link
      href={`/snippets/${snippet.id}`}
      className="snippet-card"
      aria-label={`View snippet: ${snippet.title}`}
    >
      <div className="snippet-card-header">
        <span
          className="snippet-lang-badge"
          style={{ "--lang-color": langColor } as React.CSSProperties}
        >
          {snippet.language}
        </span>
        {ownerView && (
          <span
            className={
              snippet.isPublic
                ? "snippet-visibility-badge snippet-visibility-public"
                : "snippet-visibility-badge snippet-visibility-private"
            }
          >
            {snippet.isPublic ? "Public" : "Private"}
          </span>
        )}
      </div>

      <h3 className="snippet-card-title">{snippet.title}</h3>

      <p className="snippet-card-desc">
        {snippet.description || "No description provided"}
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

      <div className="snippet-card-footer">
        <time dateTime={snippet.createdAt} className="snippet-card-date">
          {formatDate(snippet.createdAt)}
        </time>
        {snippet.viewCount > 0 && (
          <span className="snippet-card-views">
            {snippet.viewCount} {snippet.viewCount === 1 ? "view" : "views"}
          </span>
        )}
      </div>
    </Link>
  );
}
