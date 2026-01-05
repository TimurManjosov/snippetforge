// src/modules/auth/dto/auth-response.dto.ts

import { z } from 'zod';

/**
 * Auth Response Schemas - Für API Response Dokumentation
 *
 * WARUM Response DTOs?
 * - Dokumentation:  Swagger kann Schema nutzen
 * - Typsicherheit: Frontend weiß was es bekommt
 * - Konsistenz: Alle Auth-Responses haben gleiches Format
 */

// Token Response Schema
export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number(),
});

// User Response Schema (SafeUser)
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Full Auth Response Schema
export const AuthResponseSchema = z.object({
  user: UserResponseSchema,
  tokens: TokenResponseSchema,
});

// Types
export type TokenResponseDto = z.infer<typeof TokenResponseSchema>;
export type UserResponseDto = z.infer<typeof UserResponseSchema>;
export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;
