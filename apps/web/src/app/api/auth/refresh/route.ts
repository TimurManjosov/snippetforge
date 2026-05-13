import { NextResponse, type NextRequest } from 'next/server';

import { proxyToApi } from '@/lib/server/api-proxy';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from '@/lib/server/auth-cookie';
import type { AuthResponse } from '@/types/auth';

export const runtime = 'nodejs';

/**
 * POST /api/auth/refresh (BFF)
 *
 * Reads the HttpOnly refresh cookie set on the web origin, forwards its
 * value to NestJS, and on success swaps the cookie for the rotated token.
 * Any failure (missing / expired / revoked) clears the cookie so the
 * browser state stays consistent.
 *
 * Returns the new access token and the user. The refresh token never
 * leaves the server.
 */
export async function POST(request: NextRequest) {
  const presented = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!presented) {
    const response = NextResponse.json(
      { message: 'No active session' },
      { status: 401 },
    );
    clearRefreshCookie(response.cookies);
    return response;
  }

  const result = await proxyToApi<AuthResponse>({
    method: 'POST',
    path: '/api/auth/refresh',
    body: { refreshToken: presented },
    requestId: request.headers.get('x-request-id'),
  });

  if (!result.ok || !result.data) {
    const response = NextResponse.json(
      result.data ?? { message: 'Refresh failed' },
      { status: result.status === 0 ? 502 : result.status },
    );
    clearRefreshCookie(response.cookies);
    return response;
  }

  const { tokens, user } = result.data;
  const response = NextResponse.json(
    {
      user,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
    { status: 200 },
  );
  setRefreshCookie(
    response.cookies,
    tokens.refreshToken,
    new Date(tokens.refreshTokenExpiresAt),
  );
  return response;
}
