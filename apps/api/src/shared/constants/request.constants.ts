// src/shared/constants/request.constants.ts

/** Lowercase header name used to propagate request IDs across services. */
export const REQUEST_ID_HEADER = 'x-request-id' as const;

/** Maximum allowed length for an incoming request ID value. */
export const REQUEST_ID_MAX_LEN = 64 as const;

/** Only alphanumeric characters, hyphens, and underscores are considered safe. */
export const REQUEST_ID_SAFE_PATTERN = /^[a-zA-Z0-9-_]+$/;

/** Canonical response header name used to echo the request ID back to the caller. */
export const REQUEST_ID_RESPONSE_HEADER = 'X-Request-Id' as const;
