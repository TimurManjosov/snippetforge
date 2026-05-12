import { NextResponse, type NextRequest } from 'next/server';

import { passthroughError, proxyToApi } from '@/lib/server/api-proxy';
import { setRefreshCookie } from '@/lib/server/auth-cookie';
import type { AuthResponse } from '@/types/auth';

export const runtime = 'nodejs';

/**
 * POST /api/auth/register (BFF) — see login/route.ts for the cookie story.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { message: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const result = await proxyToApi<AuthResponse>({
    method: 'POST',
    path: '/api/auth/register',
    body,
    requestId: request.headers.get('x-request-id'),
  });

  if (!result.ok || !result.data) {
    return passthroughError(result);
  }

  const { tokens, user } = result.data;
  const response = NextResponse.json(
    {
      user,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
    { status: 201 },
  );
  setRefreshCookie(
    response.cookies,
    tokens.refreshToken,
    new Date(tokens.refreshTokenExpiresAt),
  );
  return response;
}
