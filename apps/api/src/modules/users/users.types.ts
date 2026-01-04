// src/modules/users/users.types.ts

import { type User } from '../../lib/db/schema';

/**
 * User Types - Definiert alle User-bezogenen Interfaces
 *
 * WARUM separate Types statt direkt Schema-Types?
 * 1. Entkopplung:  Service-Layer ist unabhängig von DB-Schema
 * 2. Flexibilität: Wir können Fields hinzufügen/entfernen ohne Schema zu ändern
 * 3. Security: Wir können sensitive Fields (passwordHash) explizit ausschließen
 */

/**
 * User ohne sensitive Daten
 * Wird für API Responses verwendet (NIEMALS passwordHash zurückgeben!)
 */
export interface SafeUser {
  id: string;
  email: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User mit allen Daten (inklusive passwordHash)
 * NUR für interne Verwendung (Authentication)
 */
export interface FullUser extends SafeUser {
  passwordHash: string;
}

/**
 * Daten für User-Erstellung
 * Password (nicht Hash!) kommt vom Client
 */
export interface CreateUserData {
  email: string;
  username: string;
  password: string; // Klartext - wird im Service gehasht
}

/**
 * Daten für User-Update
 * Alle Felder optional (Partial Update)
 */
export interface UpdateUserData {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

/**
 * Daten für Password-Update
 * Separates Interface für Klarheit
 */
export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Konvertiert DB User zu SafeUser (ohne passwordHash)
 *
 * WARUM als Funktion statt Spread?
 * - Explizit:  Wir sehen genau welche Felder übernommen werden
 * - Sicher: Neue DB-Felder werden nicht automatisch exponiert
 * - Typsicher: TypeScript prüft ob alle Felder da sind
 */
export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Konvertiert DB User zu FullUser (mit passwordHash)
 * NUR für interne Auth-Logik verwenden!
 */
export function toFullUser(user: User): FullUser {
  return {
    ...toSafeUser(user),
    passwordHash: user.passwordHash,
  };
}
