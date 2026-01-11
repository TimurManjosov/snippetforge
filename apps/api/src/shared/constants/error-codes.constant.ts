// src/shared/constants/error-codes.constant.ts

/**
 * Error Codes - Machine-readable Error Identifiers
 *
 * WARUM Error Codes?
 * 1. Frontend kann auf spezifische Errors reagieren (z.B. Redirect bei AUTH_TOKEN_EXPIRED)
 * 2. Logging/Monitoring kann Errors kategorisieren
 * 3. I18n: Frontend kann Error Code zu lokalisierter Message mappen
 * 4. API Consumers können programmatisch auf Errors reagieren
 *
 * NAMENSKONVENTION:
 * - SCREAMING_SNAKE_CASE
 * - Präfix nach Kategorie (AUTH_, VALIDATION_, USER_, etc.)
 * - Beschreibend aber kurz
 *
 * KATEGORIEN:
 * - AUTH_*: Authentication/Authorization Errors
 * - VALIDATION_*: Input Validation Errors
 * - USER_*: User-bezogene Errors
 * - RESOURCE_*: Allgemeine Resource Errors
 * - SERVER_*: Server-seitige Errors
 */

export const ErrorCodes = {
  // ============================================================
  // AUTHENTICATION ERRORS (401)
  // ============================================================

  /** Token fehlt im Request */
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',

  /** Token ist ungültig (falsches Format, falsche Signatur) */
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',

  /** Token ist abgelaufen */
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',

  /** Credentials (Email/Password) sind falsch */
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',

  // ============================================================
  // AUTHORIZATION ERRORS (403)
  // ============================================================

  /** User hat nicht die erforderliche Rolle */
  AUTH_INSUFFICIENT_ROLE: 'AUTH_INSUFFICIENT_ROLE',

  /** User hat keinen Zugriff auf diese Resource */
  AUTH_ACCESS_DENIED: 'AUTH_ACCESS_DENIED',

  // ============================================================
  // VALIDATION ERRORS (400)
  // ============================================================

  /** Allgemeiner Validation Error */
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  /** Pflichtfeld fehlt */
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',

  /** Ungültiges Format (Email, UUID, etc.) */
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',

  // ============================================================
  // USER ERRORS (400/404/409)
  // ============================================================

  /** User nicht gefunden */
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  /** Email bereits registriert */
  USER_EMAIL_EXISTS: 'USER_EMAIL_EXISTS',

  /** Username bereits vergeben */
  USER_USERNAME_EXISTS: 'USER_USERNAME_EXISTS',

  // ============================================================
  // RESOURCE ERRORS (404/409)
  // ============================================================

  /** Allgemein: Resource nicht gefunden */
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  /** Allgemein: Resource existiert bereits */
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // ============================================================
  // SERVER ERRORS (500)
  // ============================================================

  /** Allgemeiner Server Error */
  SERVER_ERROR: 'SERVER_ERROR',

  /** Datenbank nicht erreichbar */
  SERVER_DATABASE_ERROR: 'SERVER_DATABASE_ERROR',

  /** Externer Service nicht erreichbar */
  SERVER_EXTERNAL_SERVICE_ERROR: 'SERVER_EXTERNAL_SERVICE_ERROR',
} as const;

/**
 * Type für Error Codes
 * Ermöglicht Type-Safe Verwendung
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * HTTP Status zu Default Error Code Mapping
 * Wird verwendet wenn kein spezifischer Code gesetzt wurde
 */
export const HttpStatusToErrorCode: Record<number, ErrorCode> = {
  400: ErrorCodes.VALIDATION_ERROR,
  401: ErrorCodes.AUTH_TOKEN_INVALID,
  403: ErrorCodes.AUTH_ACCESS_DENIED,
  404: ErrorCodes.RESOURCE_NOT_FOUND,
  409: ErrorCodes.RESOURCE_ALREADY_EXISTS,
  500: ErrorCodes.SERVER_ERROR,
};
