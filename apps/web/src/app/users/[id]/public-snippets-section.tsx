'use client';

import { useEffect, useState } from 'react';
import SnippetCard from '@/components/snippet-card';
import { createApiClient } from '@/lib/api-client';
import type { SnippetPreview, PaginatedResponse } from '@/types/snippet';

const apiClient = createApiClient(
  process.env.NEXT_PUBLIC_API_URL ?? '',
  () => null,
);

interface PublicSnippetsSectionProps {
  userId: string;
}

export default function PublicSnippetsSection({ userId }: PublicSnippetsSectionProps) {
  const [snippets, setSnippets] = useState<SnippetPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSnippets() {
      try {
        const result = await apiClient.get<PaginatedResponse<SnippetPreview>>(
          `/snippets?authorId=${encodeURIComponent(userId)}&sort=createdAt&order=desc&page=1&limit=20`,
        );
        if (!cancelled && result) {
          setSnippets(result.items);
        }
      } catch {
        // Silently handle - section is supplementary
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSnippets();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ marginBottom: 12 }}>Public Snippets</h2>

      {loading && <p>Loading snippets...</p>}

      {!loading && snippets.length === 0 && (
        <p style={{ opacity: 0.7 }}>No public snippets yet.</p>
      )}

      {!loading && snippets.length > 0 && (
        <div className="snippet-grid" style={{ display: 'grid', gap: 12 }}>
          {snippets.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}
    </section>
  );
}
