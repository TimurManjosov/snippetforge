'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import PaginationControls from '@/components/pagination-controls';
import SnippetList from '@/components/snippet-list';
import { ApiClientError, createApiClient } from '@/lib/api-client';
import type { PaginatedResponse, SnippetPreview } from '@/types/snippet';
import { parseLimit, parsePage } from '@/utils/url';

const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', () => null);

export default function SnippetsPageClient() {
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const limit = parseLimit(searchParams.get('limit'));
  const tags = searchParams.get('tags')?.trim() ?? '';

  const [data, setData] = useState<SnippetPreview[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<SnippetPreview>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSnippets = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<PaginatedResponse<SnippetPreview>>(
        `/snippets?page=${page}&limit=${limit}${tags ? `&tags=${encodeURIComponent(tags)}` : ''}`,
        { signal: controller.signal },
      );
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
  }, [page, limit, tags]);

  useEffect(() => {
    fetchSnippets();
    return () => abortRef.current?.abort();
  }, [fetchSnippets]);

  return (
    <div className="snippet-page">
      <div className="snippet-page-header">
        <h1 className="snippet-page-title">Explore Snippets</h1>
        <p className="snippet-page-subtitle">Discover code snippets shared by the community</p>
      </div>

      <SnippetList items={data} loading={loading} error={error} onRetry={fetchSnippets} />

      {meta && !loading && !error && <PaginationControls meta={meta} />}
    </div>
  );
}
