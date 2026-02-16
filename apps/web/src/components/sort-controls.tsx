"use client";

import type { SnippetOrder, SnippetSort } from "@/utils/url-state";

interface SortControlsProps {
  sort: SnippetSort;
  order: SnippetOrder;
  onSortChange: (sort: SnippetSort) => void;
  onOrderChange: (order: SnippetOrder) => void;
}

export default function SortControls({
  sort,
  order,
  onSortChange,
  onOrderChange,
}: SortControlsProps) {
  return (
    <div className="snippet-filter-inline">
      <div className="snippet-filter-control">
        <label htmlFor="snippet-sort-select" className="snippet-filter-label">
          Sort by
        </label>
        <select
          id="snippet-sort-select"
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value === "views" ? "views" : "createdAt")
          }
          className="snippet-filter-select"
          aria-label="Sort snippets"
        >
          <option value="createdAt">Created date</option>
          <option value="views">Views</option>
        </select>
      </div>

      <div className="snippet-filter-control">
        <label htmlFor="snippet-order-select" className="snippet-filter-label">
          Order
        </label>
        <select
          id="snippet-order-select"
          value={order}
          onChange={(event) => onOrderChange(event.target.value === "asc" ? "asc" : "desc")}
          className="snippet-filter-select"
          aria-label="Sort order"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>
  );
}
