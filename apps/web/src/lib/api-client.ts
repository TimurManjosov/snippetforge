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

export class ApiClientError extends Error implements ApiError {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

const normalizeBaseUrl = (baseUrl: string, path: string): string => {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
};

const parseJsonSafely = async (response: Response): Promise<unknown | null> => {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const normalizeError = async (response: Response): Promise<ApiClientError> => {
  const fallback = new ApiClientError(
    response.status,
    response.statusText || "Request failed",
  );

  const body = await parseJsonSafely(response);
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const errorBody = body as { message?: string; error?: { message?: string; details?: unknown } };
  const message = errorBody.error?.message ?? errorBody.message ?? fallback.message;
  const details = errorBody.error?.details;

  return new ApiClientError(response.status, message, details);
};

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
    options: RequestOptions = {},
  ): Promise<T | undefined> {
    if (!this.baseUrl) {
      throw new ApiClientError(0, "Missing API base URL");
    }

    const headers: HeadersInit = {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(normalizeBaseUrl(this.baseUrl, path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: options.signal,
    });

    if (!response.ok) {
      throw await normalizeError(response);
    }

    if (response.status === 204) {
      return undefined;
    }

    const data = await parseJsonSafely(response);
    return data as T;
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>("GET", path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("POST", path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("PUT", path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>("DELETE", path, undefined, options);
  }
}

let inMemoryToken: string | null = null;

export const setApiToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getApiToken = () => inMemoryToken;

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL ?? "",
  () => inMemoryToken,
);
