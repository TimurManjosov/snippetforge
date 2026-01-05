// src/modules/auth/dto/login.dto.ts

import { z } from 'zod';

/**
 * Login DTO - Validierung für User-Login
 *
 * VALIDATION RULES:
 * - email: Valides Email-Format
 * - password:  Nicht leer (keine Komplexitätsprüfung - das war bei Registrierung)
 *
 * WARUM keine Password-Komplexität bei Login?
 * - User hat bereits registriert → Password war valide
 * - Bei Login prüfen wir nur ob Credentials stimmen
 * - Wenn wir Komplexität ändern, können bestehende User sich nicht mehr einloggen
 */

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),

  password: z.string().min(1, 'Password is required'), // Nur "nicht leer" prüfen
});

export type LoginDto = z.infer<typeof LoginSchema>;

export function validateLoginDto(data: unknown): LoginDto {
  return LoginSchema.parse(data);
}

export function safeValidateLoginDto(data: unknown) {
  return LoginSchema.safeParse(data);
}
