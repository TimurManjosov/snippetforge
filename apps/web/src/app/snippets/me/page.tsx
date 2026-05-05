"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useAuth } from "@/hooks/useAuth";
import { ApiClientError, createApiClient } from "@/lib/api-client";
import { readToken } from "@/utils/storage";
import type { PaginatedResponse, SnippetPreview } from "@/types/snippet";
import SnippetList from "@/components/snippet-list";
import PaginationControls from "@/components/pagination-controls";

function MySnippetsContent() {
  const { token, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  const [items, setItems] = useState<SnippetPreview[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<SnippetPreview>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const didRedirect = useRef(false);

  useEffect(() => {
    if (!authLoading && !token && !didRedirect.current) {
      didRedirect.current = true;
      router.replace("/login");
    }
  }, [authLoading, token, router]);

  const fetchMySnippets = useCallback(async () => {
    const currentToken = readToken();
    if (!currentToken) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const apiClient = createApiClient(
      process.env.NEXT_PUBLIC_API_URL ?? "",
      () => currentToken,
    );

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<PaginatedResponse<SnippetPreview>>(
        `/snippets/me?page=${page}&limit=20`,
        { signal: controller.signal },
      );
      setItems(result?.items ?? []);
      setMeta(result?.meta ?? null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof ApiClientError && err.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to load your snippets. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [logout, router, page]);

  useEffect(() => {
    if (!authLoading && token) {
      fetchMySnippets();
    }
    return () => abortRef.current?.abort();
  }, [authLoading, token, fetchMySnippets]);

  if (authLoading) {
    return (
      <div className="snippet-page">
        <div className="snippet-page-header">
          <h1 className="snippet-page-title">My Snippets</h1>
        </div>
        <SnippetList items={[]} loading emptyMessage="Loading…" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="snippet-page">
      <div className="snippet-page-header">
        <h1 className="snippet-page-title">My Snippets</h1>
        <p className="snippet-page-subtitle">
          Manage your personal code snippets
        </p>
      </div>

      <SnippetList
        items={items}
        loading={loading}
        error={error}
        ownerView
        onRetry={fetchMySnippets}
        emptyMessage="You haven't created any snippets yet."
      />

      {meta && meta.totalPages > 1 && (
        <PaginationControls meta={meta} />
      )}
    </div>
  );
}

export default function MySnippetsPage() {
  return (
    <Suspense fallback={<div className="snippet-page" aria-busy="true" />}>
      <MySnippetsContent />
    </Suspense>
  );
}
