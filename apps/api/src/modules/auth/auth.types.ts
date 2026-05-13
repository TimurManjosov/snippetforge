// src/modules/auth/auth.types.ts

import { type SafeUser } from '../users';

/**
 * Auth Types - Alle Authentication-bezogenen Interfaces
 *
 * WARUM separate Types?
 * - Klare Trennung zwischen Auth und User Concerns
 * - JWT Payload ist nicht gleich User
 * - Token Response ist nicht gleich User Response
 */

/**
 * JWT Payload - Was im Token gespeichert wird
 *
 * WICHTIG: Nur minimale Daten im Token!
 * - sub (subject): Standard JWT Claim für User ID
 * - email:  Für schnellen Lookup
 * - role: Für Authorization ohne DB-Query
 *
 * NICHT im Token:
 * - username (kann sich ändern)
 * - bio, avatarUrl (unnötig, zu groß)
 * - passwordHash (NIEMALS!)
 */
export interface JwtPayload {
  sub: string; // User ID (UUID)
  email: string; // User Email
  role: string; // User Role (USER, ADMIN, MODERATOR)
  iat?: number; // Issued At (automatisch von JWT)
  exp?: number; // Expiration (automatisch von JWT)
}

/**
 * Token Response - Was bei Login/Register zurückgegeben wird.
 *
 * `refreshToken` is the raw opaque refresh-token string. The API does not
 * set cookies — the BFF (Next.js route handler) reads this field and
 * persists it as an HttpOnly cookie on the web origin.
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string; // ISO 8601
  tokenType: 'Bearer';
  expiresIn: number; // access-token lifetime in seconds
}

/**
 * Auth Response - Vollständige Response bei Login/Register
 * Enthält Token UND User-Daten
 */
export interface AuthResponse {
  user: SafeUser;
  tokens: TokenResponse;
}

/**
 * Request mit authentifiziertem User
 * Erweitert Express Request nach JWT-Validierung
 *
 * VERWENDUNG:
 * Nach JwtAuthGuard enthält request.user den SafeUser
 */
export interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

/**
 * Decoded JWT Token (nach Validierung)
 * Passport gibt dies an Strategy. validate()
 */
export interface DecodedJwtToken extends JwtPayload {
  iat: number;
  exp: number;
}
