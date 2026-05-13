/**
 * In-memory access-token cache.
 *
 * The access token is **never** persisted to `localStorage` or any other
 * browser-readable storage — that role is filled by the HttpOnly refresh
 * cookie set by the BFF. The cache here exists so that non-React modules
 * (e.g. the `ApiClient` instance handed out by `useApiClient`) can read
 * the current token via a stable callback without dragging a React
 * context through every layer.
 *
 * The auth context is the single writer; it calls `writeToken` after a
 * successful login / register / refresh, and `clearToken` on logout.
 */

let cachedAccessToken: string | null = null;

export const readToken = (): string | null => cachedAccessToken;

export const writeToken = (token: string): void => {
  cachedAccessToken = token;
};

export const clearToken = (): void => {
  cachedAccessToken = null;
};
