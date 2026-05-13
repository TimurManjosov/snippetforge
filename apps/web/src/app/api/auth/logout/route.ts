import { NextResponse, type NextRequest } from 'next/server';

import { proxyToApi } from '@/lib/server/api-proxy';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
} from '@/lib/server/auth-cookie';

export const runtime = 'nodejs';

/**
 * POST /api/auth/logout (BFF)
 *
 * Revokes the presented refresh token upstream and clears the cookie.
 * Idempotent: even an unknown cookie value succeeds, so a client without
 * an active session can still call logout safely.
 */
export async function POST(request: NextRequest) {
  const presented = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (presented) {
    // Best-effort: if upstream is unreachable, still clear the cookie so
    // the user is not stuck in a phantom "logged in" state on the client.
    await proxyToApi<void>({
      method: 'POST',
      path: '/api/auth/logout',
      body: { refreshToken: presented },
      requestId: request.headers.get('x-request-id'),
    }).catch(() => undefined);
  }

  const response = new NextResponse(null, { status: 204 });
  clearRefreshCookie(response.cookies);
  return response;
}
