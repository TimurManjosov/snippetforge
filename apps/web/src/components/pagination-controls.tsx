"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { PaginationMeta } from "@/types/snippet";

interface PaginationControlsProps {
  meta: PaginationMeta;
  /**
   * Optional override. When provided, the component delegates navigation to
   * this callback instead of mutating the URL. Useful for pages that hold
   * pagination in component state rather than the query string.
   */
  onPageChange?: (page: number) => void;
}

/**
 * Generic pagination control.
 *
 * Default behaviour: preserve every current search-param and override only
 * `page`. This works uniformly for any list page that drives pagination via
 * the URL (`/snippets`, `/favorites`, `/users`, `/collections`, …), so we
 * don't need per-page bespoke prev/next buttons.
 */
export default function PaginationControls({
  meta,
  onPageChange,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (newPage: number) => {
      if (onPageChange) {
        onPageChange(newPage);
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, onPageChange],
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
