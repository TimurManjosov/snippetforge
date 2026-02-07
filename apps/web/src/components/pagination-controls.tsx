"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { PaginationMeta } from "@/types/snippet";

interface PaginationControlsProps {
  meta: PaginationMeta;
}

export default function PaginationControls({ meta }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) {
        params.set("page", String(newPage));
      } else {
        params.delete("page");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
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
