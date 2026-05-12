import { NextResponse } from 'next/server';

/**
 * Server-side proxy to the NestJS API.
 *
 * Used by the BFF route handlers under `/api/auth/*`. The upstream URL
 * comes from `API_INTERNAL_URL` (server-only) and falls back to
 * `NEXT_PUBLIC_API_URL` for local dev. Keeping the upstream URL out of the
 * browser bundle is intentional: production deployments typically route
 * inter-container traffic through a private hostname.
 */
function getUpstreamBase(): string {
  const url =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';
  if (!url) {
    throw new Error(
      'No upstream API URL configured (set API_INTERNAL_URL or NEXT_PUBLIC_API_URL).',
    );
  }
  return url.replace(/\/+$/, '');
}

interface ProxyOptions {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: unknown;
  /** Forward the caller's X-Request-ID so traces stay correlated. */
  requestId?: string | null;
}

export interface ProxyResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Raw text on parse failure or non-JSON responses; useful for debugging. */
  rawBody?: string;
}

export async function proxyToApi<T>({
  method,
  path,
  body,
  requestId,
}: ProxyOptions): Promise<ProxyResult<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }

  const response = await fetch(`${getUpstreamBase()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    // The BFF runs on the server; cookies on the browser are irrelevant
    // here and `credentials` has no effect on `fetch` from the server side.
    cache: 'no-store',
  });

  if (response.status === 204) {
    return { ok: true, status: 204, data: null };
  }

  const text = await response.text();
  if (!text) {
    return { ok: response.ok, status: response.status, data: null };
  }

  try {
    return {
      ok: response.ok,
      status: response.status,
      data: JSON.parse(text) as T,
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
      rawBody: text,
    };
  }
}

/**
 * Build a NextResponse that mirrors an upstream error verbatim. Keeps
 * status codes and error envelopes aligned between API and BFF so the
 * client sees one consistent error shape.
 */
export function passthroughError(result: ProxyResult<unknown>): NextResponse {
  const fallback = {
    message: result.rawBody ?? 'Upstream error',
    error: { message: 'Upstream error' },
  };
  return NextResponse.json(result.data ?? fallback, { status: result.status });
}
