"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import type { SnippetResponse } from "@/types/snippets";
import SnippetForm from "@/components/snippet-form";

export default function NewSnippetPage() {
  const { token, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (!authLoading && !token && !didRedirect.current) {
      didRedirect.current = true;
      router.replace("/login");
    }
  }, [authLoading, token, router]);

  const handleSuccess = useCallback(
    (snippet: SnippetResponse | null) => {
      if (snippet?.id) {
        router.replace(`/snippets/${snippet.id}`);
        return;
      }
      router.replace("/snippets/me");
    },
    [router],
  );

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  if (authLoading) {
    return (
      <main className="snippet-page">
        <div className="snippet-page-header">
          <h1 className="snippet-page-title">Create snippet</h1>
          <p className="snippet-page-subtitle">Preparing your editor…</p>
        </div>
        <div className="snippet-form-card" aria-busy="true">
          <p className="snippet-form-helper">Loading form…</p>
        </div>
      </main>
    );
  }

  if (!token) return null;

  return (
    <main className="snippet-page">
      <div className="snippet-page-header">
        <h1 className="snippet-page-title">Create snippet</h1>
        <p className="snippet-page-subtitle">
          Share a clean, focused snippet with the SnippetForge community.
        </p>
      </div>

      <SnippetForm
        token={token}
        onSuccess={handleSuccess}
        onUnauthorized={handleUnauthorized}
      />
    </main>
  );
}
