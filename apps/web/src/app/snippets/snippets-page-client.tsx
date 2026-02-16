'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import LanguageSelect from '@/components/language-select';
import PaginationControls from '@/components/pagination-controls';
import SearchBar from '@/components/search-bar';
import SnippetList from '@/components/snippet-list';
import SortControls from '@/components/sort-controls';
import TagFilter from '@/components/tag-filter';
import { ApiClientError, createApiClient } from '@/lib/api-client';
import type { PaginatedResponse, SnippetPreview } from '@/types/snippet';
import {
  DEFAULT_SNIPPETS_STATE,
  parseSnippetsState,
  stringifySnippetsState,
  updateSnippetsStateFromSearchParams,
} from '@/utils/url-state';

const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', () => null);

export default function SnippetsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryState = useMemo(() => parseSnippetsState(searchParams), [searchParams]);
  const normalizedQueryString = useMemo(
    () => stringifySnippetsState(queryState),
    [queryState],
  );

  const [data, setData] = useState<SnippetPreview[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<SnippetPreview>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateUrl = useCallback(
    (
      updates: Parameters<typeof updateSnippetsStateFromSearchParams>[1],
      options: { resetPage?: boolean; replace?: boolean } = {},
    ) => {
      const nextState = updateSnippetsStateFromSearchParams(searchParams, updates, {
        resetPage: options.resetPage,
      });
      const qs = stringifySnippetsState(nextState);
      if (qs === normalizedQueryString) return;
      const href = `${pathname}?${qs}`;
      if (options.replace) {
        router.replace(href);
        return;
      }
      router.push(href);
    },
    [normalizedQueryString, pathname, router, searchParams],
  );

  const fetchSnippets = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<PaginatedResponse<SnippetPreview>>(`/snippets?${normalizedQueryString}`, {
        signal: controller.signal,
      });
      if (result) {
        setData(result.items);
        setMeta(result.meta);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message =
        err instanceof ApiClientError ? err.message : 'Failed to load snippets. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [normalizedQueryString]);

  useEffect(() => {
    if (searchParams.toString() === normalizedQueryString) return;
    router.replace(`${pathname}?${normalizedQueryString}`);
  }, [normalizedQueryString, pathname, router, searchParams]);

  useEffect(() => {
    fetchSnippets();
    return () => abortRef.current?.abort();
  }, [fetchSnippets]);

  const hasActiveFilters = Boolean(
    queryState.q ||
      queryState.language ||
      queryState.tags.length ||
      queryState.sort !== DEFAULT_SNIPPETS_STATE.sort ||
      queryState.order !== DEFAULT_SNIPPETS_STATE.order ||
      queryState.page !== DEFAULT_SNIPPETS_STATE.page ||
      queryState.limit !== DEFAULT_SNIPPETS_STATE.limit,
  );

  const resetFilters = useCallback(() => {
    router.push(`${pathname}?${stringifySnippetsState(DEFAULT_SNIPPETS_STATE)}`);
  }, [pathname, router]);

  return (
    <div className="snippet-page">
      <div className="snippet-page-header">
        <h1 className="snippet-page-title">Explore Snippets</h1>
        <p className="snippet-page-subtitle">Discover code snippets shared by the community</p>
      </div>

      <section className="snippet-filters-panel" aria-label="Snippet search and filters">
        <div className="snippet-filters-grid">
          <SearchBar
            value={queryState.q}
            onChange={(value) => updateUrl({ q: value ?? null }, { resetPage: true, replace: true })}
          />
          <LanguageSelect
            value={queryState.language}
            onChange={(value) =>
              updateUrl({ language: value ?? null }, { resetPage: true })
            }
          />
        </div>

        <TagFilter
          selected={queryState.tags}
          onChange={(tags) => updateUrl({ tags }, { resetPage: true })}
        />

        <SortControls
          sort={queryState.sort}
          order={queryState.order}
          onSortChange={(sort) => updateUrl({ sort }, { resetPage: true })}
          onOrderChange={(order) => updateUrl({ order }, { resetPage: true })}
        />

        {hasActiveFilters && (
          <div className="snippet-active-filters">
            {queryState.q && (
              <button
                type="button"
                className="snippet-active-filter-chip"
                onClick={() => updateUrl({ q: null }, { resetPage: true })}
              >
                Search: {queryState.q} ×
              </button>
            )}
            {queryState.language && (
              <button
                type="button"
                className="snippet-active-filter-chip"
                onClick={() => updateUrl({ language: null }, { resetPage: true })}
              >
                Language: {queryState.language} ×
              </button>
            )}
            {queryState.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="snippet-active-filter-chip"
                onClick={() =>
                  updateUrl(
                    { tags: queryState.tags.filter((selectedTag) => selectedTag !== tag) },
                    { resetPage: true },
                  )
                }
              >
                #{tag} ×
              </button>
            ))}
            <button
              type="button"
              className="snippet-clear-all-btn"
              onClick={resetFilters}
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      {!loading && !error && data.length === 0 ? (
        <div className="snippet-state-box snippet-empty-box">
          <p className="snippet-state-title">No snippets match your current filters.</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="snippet-retry-btn"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <SnippetList items={data} loading={loading} error={error} onRetry={fetchSnippets} />
      )}

      {meta && !loading && !error && <PaginationControls meta={meta} />}
    </div>
  );
}
