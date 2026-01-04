// src/shared/types/api-response.type.ts

/**
 * Standardisiertes API Response Format
 *
 * WARUM ein einheitliches Format?
 * 1. Frontend kann ALLE Responses gleich parsen
 * 2. Error Handling ist konsistent
 * 3. Pagination/Meta-Daten haben festen Platz
 *
 * STRUKTUR:
 * - success: boolean → Schneller Check ob Request erfolgreich
 * - data: T → Die eigentlichen Daten (generisch typisiert)
 * - error: object → Fehlerdetails (nur bei Fehlern)
 * - meta: object → Pagination, Timestamps, etc.
 */

/**
 * Standard Success Response
 * Verwendet für alle erfolgreichen API-Antworten
 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

/**
 * Standard Error Response
 * Verwendet für alle Fehler-Antworten
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string; // Machine-readable:  'USER_NOT_FOUND', 'VALIDATION_ERROR'
    message: string; // Human-readable: 'User with this email not found'
    details?: unknown; // Zusätzliche Infos (z.B. Validation Errors)
  };
  meta?: ApiResponseMeta;
}

/**
 * Meta-Informationen für Responses
 * Pagination, Timestamps, Request-IDs
 */
export interface ApiResponseMeta {
  timestamp?: string; // ISO 8601 Timestamp
  requestId?: string; // Für Debugging/Tracing
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Union Type für alle möglichen Responses
 * Nützlich für Type Guards
 */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiErrorResponse;

/**
 * Type Guard:  Prüft ob Response erfolgreich ist
 *
 * Verwendung:
 * ```typescript
 * const result = await api.getUser(id)
 * if (isSuccessResponse(result)) {
 *   console.log(result.data. email) // TypeScript weiß:  data existiert
 * } else {
 *   console. log(result.error.message) // TypeScript weiß: error existiert
 * }
 * ```
 */
export function isSuccessResponse<T>(
  response: ApiResult<T>,
): response is ApiResponse<T> {
  return response.success === true;
}

/**
 * Type Guard: Prüft ob Response ein Fehler ist
 */
export function isErrorResponse(
  response: ApiResult<unknown>,
): response is ApiErrorResponse {
  return response.success === false;
}
