"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ApiClientError, createApiClient } from "@/lib/api-client";
import type { SnippetDetail as SnippetDetailType } from "@/types/snippets";
import SnippetDetail from "@/components/snippet-detail";
import { readToken } from "@/utils/storage";

export default function SnippetDetailPage() {
  const params = useParams();
  const snippetId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  }, [params]);

  const [snippet, setSnippet] = useState<SnippetDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastFetchedIdRef = useRef<string | null>(null);

  const apiClient = useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? "", readToken),
    [],
  );

  const fetchSnippet = useCallback(async () => {
    if (!snippetId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const result = await apiClient.get<SnippetDetailType>(
        `/api/snippets/${snippetId}`,
        { signal: controller.signal },
      );
      if (result) {
        setSnippet(result);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof ApiClientError && [401, 403, 404].includes(err.status)) {
        setSnippet(null);
        setNotFound(true);
        return;
      }
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load snippet. Please try again.";
      setSnippet(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [apiClient, snippetId]);

  useEffect(() => {
    if (lastFetchedIdRef.current === snippetId) return;
    lastFetchedIdRef.current = snippetId;
    fetchSnippet();
    return () => abortRef.current?.abort();
  }, [fetchSnippet, snippetId]);

  if (loading) {
    return (
      <div className="snippet-page">
        <div className="snippet-state-box snippet-empty-box">
          <p className="snippet-state-title">Loading snippet…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="snippet-page">
        <div className="snippet-state-box snippet-empty-box">
          <p className="snippet-state-title">Snippet not found</p>
          <p className="snippet-state-desc">
            This snippet may be private, removed, or unavailable.
          </p>
          <Link href="/snippets" className="snippet-retry-btn">
            Back to snippets
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="snippet-page">
        <div className="snippet-state-box snippet-error-box" role="alert">
          <p className="snippet-state-title">Unable to load snippet</p>
          <p className="snippet-state-desc">{error}</p>
          <button type="button" onClick={fetchSnippet} className="snippet-retry-btn">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!snippet) {
    return null;
  }

  return (
    <div className="snippet-page">
      <SnippetDetail snippet={snippet} />
    </div>
  );
}
