import { NextResponse, type NextRequest } from 'next/server';

import { REFRESH_COOKIE_NAME } from '@/lib/server/auth-cookie';

/**
 * Server-side route guard.
 *
 * For any request to a protected path, the middleware checks for the
 * presence of the HttpOnly refresh cookie set by the BFF login/register/
 * refresh handlers. If the cookie is missing the request is redirected to
 * `/login?next=<original-pathname-with-query>` so the login form can hop
 * the user back to where they were.
 *
 * What the middleware does NOT do:
 *   - It does not validate the cookie cryptographically; that would
 *     require a network call to the API on every request. The cookie's
 *     mere presence is a cheap "this user looks logged in" signal. The
 *     real validation happens on the next API request — if the token is
 *     invalid the API returns 401 and the page-level auth context handles
 *     it.
 *   - It does not gate API routes — those carry their own JWT and are
 *     enforced server-side by NestJS.
 *
 * Why this is sufficient: an attacker without the cookie cannot reach the
 * protected page at all. A user with a revoked but un-cleared cookie will
 * be sent to the protected page, but every API call will 401 and the
 * client will redirect to /login. The trade-off favours UX (no
 * server-side network call on every navigation) over a one-tick UI flash
 * for the rare revoked-but-not-cleared case.
 */

const PROTECTED_PATTERNS: ReadonlyArray<RegExp> = [
  /^\/snippets\/new\/?$/,
  /^\/snippets\/me(\/.*)?$/,
  /^\/snippets\/[^/]+\/edit\/?$/,
  /^\/collections(\/.*)?$/,
  /^\/favorites(\/.*)?$/,
  /^\/settings(\/.*)?$/,
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(
    request.cookies.get(REFRESH_COOKIE_NAME)?.value,
  );
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

/**
 * Skip the middleware for everything we explicitly do not care about:
 *   - `_next/...` build assets
 *   - the BFF auth routes themselves (they handle their own logic)
 *   - static files (favicon, robots, images served from /public)
 *
 * Anything else is fast-pathed through `isProtected` above.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|css|js)$).*)',
  ],
};
