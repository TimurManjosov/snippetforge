"use client";

import type { SnippetPreview } from "@/types/snippet";
import SnippetCard from "@/components/snippet-card";

interface SnippetListProps {
  items: SnippetPreview[];
  loading?: boolean;
  error?: string | null;
  ownerView?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
}

function SkeletonCard() {
  return (
    <div className="snippet-card snippet-skeleton" aria-hidden="true">
      <div className="snippet-card-header">
        <span className="skeleton-block" style={{ width: "72px", height: "22px" }} />
      </div>
      <div className="skeleton-block" style={{ width: "75%", height: "20px", marginTop: "12px" }} />
      <div className="skeleton-block" style={{ width: "100%", height: "14px", marginTop: "10px" }} />
      <div className="skeleton-block" style={{ width: "60%", height: "14px", marginTop: "6px" }} />
      <div className="snippet-card-footer" style={{ marginTop: "auto" }}>
        <span className="skeleton-block" style={{ width: "80px", height: "13px" }} />
      </div>
    </div>
  );
}

export default function SnippetList({
  items,
  loading,
  error,
  ownerView,
  onRetry,
  emptyMessage = "No snippets found.",
}: SnippetListProps) {
  if (error) {
    return (
      <div className="snippet-state-box snippet-error-box" role="alert">
        <p className="snippet-state-title">Something went wrong</p>
        <p className="snippet-state-desc">{error}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="snippet-retry-btn">
            Try again
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="snippet-grid" aria-label="Loading snippets">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="snippet-state-box snippet-empty-box">
        <p className="snippet-state-title">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="snippet-grid">
      {items.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} ownerView={ownerView} />
      ))}
    </div>
  );
}
