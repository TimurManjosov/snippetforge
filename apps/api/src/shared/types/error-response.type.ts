// src/shared/types/error-response.type.ts

import { type ErrorCode } from '../constants';

/**
 * Standard Error Response Format
 *
 * WARUM dieses Format?
 * 1. Konsistenz: Frontend kann ALLE Errors gleich parsen
 * 2. Debugging: Meta-Daten helfen bei Fehlersuche
 * 3. Machine-Readable: Error Code für programmatische Verarbeitung
 * 4. Human-Readable: Message für Anzeige
 *
 * STRUKTUR:
 * {
 *   success: false,              // Schneller Check
 *   error: {
 *     code: "AUTH_TOKEN_EXPIRED", // Machine-readable
 *     message: "Token expired",   // Human-readable
 *     statusCode: 401,            // HTTP Status
 *     details?: {...}           // Zusätzliche Infos (Validation Errors)
 *   },
 *   meta: {
 *     timestamp: "...",           // Wann der Error auftrat
 *     path: "/api/auth/me",       // Welcher Endpoint
 *     method: "GET",              // Welche HTTP Methode
 *     requestId?: "..."           // Für Tracing (optional)
 *   }
 * }
 */

/**
 * Error Details - Zusätzliche Informationen zum Error
 */
export interface ErrorDetails {
  /** Feld-spezifische Validation Errors */
  fields?: Record<string, string[]>;

  /** Zusätzliche Kontext-Informationen */
  context?: Record<string, unknown>;
}

/**
 * Error Object innerhalb der Response
 */
export interface ErrorObject {
  /** Machine-readable Error Code */
  code: ErrorCode;

  /** Human-readable Error Message */
  message: string;

  /** HTTP Status Code */
  statusCode: number;

  /** Optionale Details (z.B. Validation Errors) */
  details?: ErrorDetails;
}

/**
 * Meta-Informationen zur Response
 */
export interface ResponseMeta {
  /** ISO 8601 Timestamp */
  timestamp: string;

  /** Request Path */
  path: string;

  /** HTTP Method */
  method: string;

  /** Request ID für Tracing (falls vorhanden) */
  requestId?: string;
}

/**
 * Vollständige Error Response
 */
export interface ErrorResponse {
  /** Immer false bei Errors */
  success: false;

  /** Error Details */
  error: ErrorObject;

  /** Meta-Informationen */
  meta: ResponseMeta;
}

/**
 * Factory Function für Error Response
 *
 * WARUM Factory statt Constructor?
 * - Einfacher zu verwenden
 * - Keine Klassen-Instanziierung nötig
 * - Bessere Tree-Shaking Möglichkeit
 *
 * @param params - Error Parameter
 * @returns Formatierte Error Response
 */
export function createErrorResponse(params: {
  code: ErrorCode;
  message: string;
  statusCode: number;
  path: string;
  method: string;
  details?: ErrorDetails;
  requestId?: string;
}): ErrorResponse {
  return {
    success: false,
    error: {
      code: params.code,
      message: params.message,
      statusCode: params.statusCode,
      ...(params.details && { details: params.details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: params.path,
      method: params.method,
      ...(params.requestId && { requestId: params.requestId }),
    },
  };
}
