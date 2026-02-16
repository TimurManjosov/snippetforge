"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { PaginationMeta } from "@/types/snippet";
import { stringifySnippetsState, updateSnippetsStateFromSearchParams } from "@/utils/url-state";

interface PaginationControlsProps {
  meta: PaginationMeta;
}

export default function PaginationControls({ meta }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (newPage: number) => {
      const nextState = updateSnippetsStateFromSearchParams(searchParams, { page: newPage });
      const qs = stringifySnippetsState(nextState);
      router.push(`${pathname}?${qs}`);
    },
    [router, pathname, searchParams],
  );

  if (meta.totalPages <= 1) return null;

  return (
    <nav className="pagination-controls" aria-label="Pagination">
      <button
        type="button"
        disabled={!meta.hasPreviousPage}
        onClick={() => navigate(meta.page - 1)}
        className="pagination-btn"
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <span className="pagination-info">
        Page {meta.page} of {meta.totalPages}
      </span>

      <button
        type="button"
        disabled={!meta.hasNextPage}
        onClick={() => navigate(meta.page + 1)}
        className="pagination-btn"
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
