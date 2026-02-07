"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { ApiClientError, createApiClient } from "@/lib/api-client";
import { readToken } from "@/utils/storage";
import type { SnippetPreview } from "@/types/snippet";
import SnippetList from "@/components/snippet-list";

export default function MySnippetsPage() {
  const { token, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<SnippetPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const didRedirect = useRef(false);

  // Auth guard – redirect when hydrated and no token
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
      const result = await apiClient.get<SnippetPreview[]>("/snippets/me", {
        signal: controller.signal,
      });
      setData(result ?? []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof ApiClientError && err.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load your snippets. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    if (!authLoading && token) {
      fetchMySnippets();
    }
    return () => abortRef.current?.abort();
  }, [authLoading, token, fetchMySnippets]);

  // Show nothing while auth is still hydrating
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

  // After hydration, if no token, render nothing (redirect is triggered)
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
        items={data}
        loading={loading}
        error={error}
        ownerView
        onRetry={fetchMySnippets}
        emptyMessage="You haven't created any snippets yet."
      />
    </div>
  );
}
