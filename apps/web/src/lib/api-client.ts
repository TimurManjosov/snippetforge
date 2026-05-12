import * as Sentry from '@sentry/nextjs';

import { clearToken, writeToken } from '@/utils/storage';

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export type TokenProvider = () => string | null;

interface RequestOptions {
  signal?: AbortSignal;
  headers?: HeadersInit;
}

interface InternalRequestOptions extends RequestOptions {
  /** Prevents 401-recovery from looping when retrying the same request. */
  _retried?: boolean;
}

export class ApiClientError extends Error implements ApiError {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

const normalizeBaseUrl = (baseUrl: string, path: string): string => {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
};

const parseJsonSafely = async (response: Response): Promise<unknown | null> => {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

interface ApiErrorResponseBody {
  message?: string;
  error?: {
    message?: string;
    details?: unknown;
  };
}

const normalizeError = async (response: Response): Promise<ApiClientError> => {
  const fallback = new ApiClientError(
    response.status,
    response.statusText || 'Request failed',
  );

  const body = await parseJsonSafely(response);
  if (!body || typeof body !== 'object') {
    return fallback;
  }

  const errorBody = body as ApiErrorResponseBody;
  const message =
    errorBody.error?.message ?? errorBody.message ?? fallback.message;
  const details = errorBody.error?.details;

  return new ApiClientError(response.status, message, details);
};

// ---------------------------------------------------------------------------
// Silent refresh
//
// A 401 from any authenticated request triggers a single, deduplicated call
// to the BFF refresh endpoint. On success the new access token lands in the
// in-memory cache and the original request is retried once. On failure the
// cache is cleared and the 401 surfaces to the caller — page-level logic
// decides what to do (typically render the logout state or redirect).
// ---------------------------------------------------------------------------

let inflightRefresh: Promise<boolean> | null = null;

interface BffRefreshResponse {
  accessToken?: string;
  user?: unknown;
}

const performRefresh = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      clearToken();
      return false;
    }
    const body = (await response.json()) as BffRefreshResponse;
    if (typeof body?.accessToken !== 'string' || !body.accessToken) {
      clearToken();
      return false;
    }
    writeToken(body.accessToken);
    return true;
  } catch {
    clearToken();
    return false;
  }
};

const tryRefresh = (): Promise<boolean> => {
  if (!inflightRefresh) {
    inflightRefresh = performRefresh().finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
};

// ---------------------------------------------------------------------------

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getToken: TokenProvider;

  constructor(baseUrl: string, getToken: TokenProvider) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: InternalRequestOptions = {},
  ): Promise<T | undefined> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(typeof options.headers === 'object' &&
      !Array.isArray(options.headers) &&
      !(options.headers instanceof Headers)
        ? options.headers
        : {}),
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;

    try {
      response = await fetch(normalizeBaseUrl(this.baseUrl, path), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: options.signal,
        // Carry same-origin cookies (refresh flow); cross-origin calls
        // ignore the credentials unless CORS allows them, so this is safe.
        credentials: 'same-origin',
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw e;
      }
      Sentry.captureException(e);
      throw e;
    }

    if (!response.ok) {
      if (
        response.status === 401 &&
        !options._retried &&
        this.shouldAttemptRefresh(path)
      ) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          return this.request<T>(method, path, body, {
            ...options,
            _retried: true,
          });
        }
      }

      if (response.status >= 500) {
        const requestId = response.headers.get('x-request-id');
        const err = new Error(`API error ${response.status}`);
        Sentry.withScope((scope) => {
          scope.setTag('status', String(response.status));
          scope.setContext('request', {
            requestId: requestId ?? 'unknown',
            url: response.url,
          });
          Sentry.captureException(err);
        });
      }
      throw await normalizeError(response);
    }

    if (response.status === 204) {
      return undefined;
    }

    const data = await parseJsonSafely(response);
    return data as T;
  }

  /**
   * Don't try to refresh on auth-flow paths themselves — that would loop
   * (refresh triggers refresh) — and don't try on BFF same-origin requests
   * (no upstream JWT to recover).
   */
  private shouldAttemptRefresh(path: string): boolean {
    if (!this.baseUrl) return false;
    return !path.startsWith('/auth/refresh') && !path.startsWith('/auth/logout');
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('PUT', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

export const createApiClient = (baseUrl: string, getToken: TokenProvider) =>
  new ApiClient(baseUrl, getToken);
