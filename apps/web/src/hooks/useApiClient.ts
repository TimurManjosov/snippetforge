'use client';

import { useMemo } from 'react';

import { createApiClient, type ApiClient } from '@/lib/api-client';
import { readToken } from '@/utils/storage';

/**
 * Returns a memoised `ApiClient` configured with the public API base URL and
 * the current access token.
 *
 * The token is read lazily through `readToken` so the client always sees the
 * up-to-date value at request time (no stale closures after login/logout),
 * while the client instance itself is stable across renders.
 *
 * Prefer this hook over inlining `createApiClient(..., readToken)` in pages
 * — it keeps `@/utils/storage` an implementation detail of the auth layer.
 */
export function useApiClient(): ApiClient {
  return useMemo(
    () => createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', readToken),
    [],
  );
}
