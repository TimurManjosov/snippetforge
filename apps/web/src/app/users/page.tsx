'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { UserAvatar } from '@/components/users/user-avatar';
import {
  listUsers,
  type UserDirectoryItem,
  type UserDirectoryMeta,
} from '@/lib/users-directory-api';

function setParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | undefined,
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  if (value) {
    next.set(key, value);
  } else {
    next.delete(key);
  }
  if (key !== 'page') {
    next.delete('page');
  }
  return next;
}

export default function UsersDirectoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const limit = Number(searchParams.get('limit') ?? '20') || 20;

  const [items, setItems] = useState<UserDirectoryItem[]>([]);
  const [meta, setMeta] = useState<UserDirectoryMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchUsers = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await listUsers(
        {
          q: q || undefined,
          page,
          limit,
        },
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setItems(data.items);
        setMeta(data.meta);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Failed to load users. Please try again.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [q, page, limit]);

  useEffect(() => {
    fetchUsers();
    return () => abortRef.current?.abort();
  }, [fetchUsers]);

  const updateParam = (key: string, value: string | undefined) => {
    const next = setParam(searchParams, key, value);
    router.push(`/users?${next.toString()}`);
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h1>User Directory</h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>
        Discover community members and their public snippets
      </p>

      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search users by name..."
          aria-label="Search users"
          value={q}
          onChange={(e) => updateParam('q', e.target.value || undefined)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #444',
            background: '#1a1a1a',
            color: 'white',
            fontSize: 14,
          }}
        />
      </div>

      {loading && <p>Loading users...</p>}

      {error && (
        <div role="alert" style={{ color: '#f87171' }}>
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p>No users found{q ? ` for "${q}"` : ''}.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((user) => (
            <li
              key={user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: '1px solid #333',
              }}
            >
              <UserAvatar
                username={user.username}
                displayName={user.displayName}
                avatarUrl={user.avatarUrl}
                size={40}
              />
              <div style={{ flex: 1 }}>
                <Link
                  href={`/users/${user.id}`}
                  style={{ fontWeight: 600, color: '#60a5fa' }}
                >
                  {user.displayName || user.username}
                </Link>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  @{user.username}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.8,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.publicSnippetCount}{' '}
                {user.publicSnippetCount === 1 ? 'snippet' : 'snippets'}
              </div>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 && (
        <nav
          aria-label="Users pagination"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            disabled={!meta.hasPreviousPage}
            onClick={() => updateParam('page', String(page - 1))}
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={!meta.hasNextPage}
            onClick={() => updateParam('page', String(page + 1))}
            aria-label="Next page"
          >
            Next →
          </button>
        </nav>
      )}
    </main>
  );
}
