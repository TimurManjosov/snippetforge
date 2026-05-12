/**
 * Refresh-token cookie configuration.
 *
 * Why HttpOnly + SameSite=Lax:
 *   - HttpOnly: not readable by `document.cookie`, so an XSS payload cannot
 *     exfiltrate a long-lived credential.
 *   - SameSite=Lax: cookie travels on top-level navigations (so the session
 *     survives the user clicking a link to the site) but not on cross-site
 *     POSTs, blocking CSRF for state-changing requests.
 *   - Secure: required by browsers for SameSite=None but also good hygiene
 *     in production; gated by NODE_ENV so dev (HTTP) still works.
 *   - Path=/: middleware and the BFF refresh handler need it on every
 *     request to the web origin.
 *
 * The cookie is set / cleared exclusively by the BFF route handlers; the
 * browser-side JavaScript never touches it.
 */
export const REFRESH_COOKIE_NAME = 'sf_refresh';

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

export interface CookieJar {
  set(opts: {
    name: string;
    value: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    path?: string;
    expires?: Date;
    maxAge?: number;
  }): unknown;
}

export function setRefreshCookie(
  cookies: CookieJar,
  value: string,
  expiresAt: Date,
): void {
  cookies.set({
    name: REFRESH_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearRefreshCookie(cookies: CookieJar): void {
  cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}
