"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/api-client";
import { getSnippetById } from "@/lib/snippets-api";
import { readToken } from "@/utils/storage";
import type { SnippetDetail } from "@/types/snippets";
import EditSnippetForm from "@/components/edit-snippet-form";
import DeleteSnippetButton from "@/components/delete-snippet-button";

export default function EditSnippetPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isLoading: authLoading, logout } = useAuth();

  const snippetId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  }, [params]);

  const [snippet, setSnippet] = useState<SnippetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const didRedirect = useRef(false);
  const didFetch = useRef(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !token && !didRedirect.current) {
      didRedirect.current = true;
      router.replace("/login");
    }
  }, [authLoading, token, router]);

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  const handleNotFound = useCallback(() => {
    setNotFound(true);
  }, []);

  const fetchSnippet = useCallback(async () => {
    const currentToken = readToken();
    if (!currentToken || !snippetId) {
      setNotFound(!snippetId);
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
      const result = await getSnippetById(currentToken, snippetId, controller.signal);
      setSnippet(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          handleUnauthorized();
          return;
        }
        if (err.status === 404 || err.status === 403) {
          setNotFound(true);
          return;
        }
        setError(err.message || "Failed to load snippet.");
      } else {
        setError("Failed to load snippet. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [snippetId, handleUnauthorized]);

  // Single initial fetch
  useEffect(() => {
    if (!authLoading && token && !didFetch.current) {
      didFetch.current = true;
      fetchSnippet();
    }
    return () => abortRef.current?.abort();
  }, [authLoading, token, fetchSnippet]);

  // While auth is hydrating
  if (authLoading) {
    return (
      <div className="snippet-page">
        <div className="snippet-state-box snippet-empty-box">
          <p className="snippet-state-title">Loading…</p>
        </div>
      </div>
    );
  }

  // No token after hydration
  if (!token) return null;

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
            This snippet may be private, removed, or you don&#39;t have permission to edit it.
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
          <button
            type="button"
            onClick={() => {
              didFetch.current = false;
              fetchSnippet();
            }}
            className="snippet-retry-btn"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!snippet) return null;

  return (
    <div className="snippet-page">
      <div className="snippet-page-header">
        <h1 className="snippet-page-title">Edit Snippet</h1>
        <p className="snippet-page-subtitle">
          Update your snippet details and code
        </p>
      </div>

      <EditSnippetForm
        initialSnippet={snippet}
        token={token}
        onUnauthorized={handleUnauthorized}
        onNotFound={handleNotFound}
      />

      <div className="snippet-edit-danger-zone">
        <h2 className="snippet-danger-title">Danger Zone</h2>
        <p className="snippet-danger-desc">
          Permanently delete this snippet. This action cannot be undone.
        </p>
        <DeleteSnippetButton
          id={snippet.id}
          token={token}
          onUnauthorized={handleUnauthorized}
        />
      </div>
    </div>
  );
}
