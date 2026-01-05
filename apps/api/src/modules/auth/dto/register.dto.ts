// src/modules/auth/dto/register.dto.ts

import { z } from 'zod';

/**
 * Register DTO - Validierung für User-Registrierung
 *
 * WARUM Zod statt class-validator?
 * 1. Type Inference:  Schema generiert automatisch TypeScript Types
 * 2. Runtime + Compile-Time Safety:  Ein Schema für beides
 * 3. Bessere Fehlermeldungen:  Detaillierte Validation Errors
 * 4. Shared:  Kann in Frontend UND Backend verwendet werden
 * 5. Functional:  Kein Decorator-Magic, pure Functions
 *
 * VALIDATION RULES:
 * - email:  Valides Email-Format, lowercase
 * - username: 3-30 Zeichen, alphanumerisch + underscore
 * - password:  Min 8 Zeichen, Komplexitätsregeln
 */

// Username Pattern:  Alphanumerisch + Underscore, keine Leerzeichen
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

// Password muss enthalten:  Großbuchstabe, Kleinbuchstabe, Zahl
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export const RegisterSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters')
    .transform((val) => val.toLowerCase().trim()), // Normalisierung

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      USERNAME_REGEX,
      'Username can only contain letters, numbers, and underscores',
    )
    .transform((val) => val.trim()),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      PASSWORD_REGEX,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
});

/**
 * TypeScript Type aus Schema generiert
 *
 * Equivalent zu:
 * interface RegisterDto {
 *   email: string
 *   username: string
 *   password: string
 * }
 *
 * ABER: Automatisch synchron mit Validation Rules!
 */
export type RegisterDto = z.infer<typeof RegisterSchema>;

/**
 * Validation Function
 * Kann auch außerhalb von NestJS verwendet werden
 */
export function validateRegisterDto(data: unknown): RegisterDto {
  return RegisterSchema.parse(data);
}

/**
 * Safe Validation (wirft keinen Error)
 * Gibt Result-Object zurück
 */
export function safeValidateRegisterDto(data: unknown) {
  return RegisterSchema.safeParse(data);
}
