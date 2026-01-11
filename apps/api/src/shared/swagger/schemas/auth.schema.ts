// src/shared/swagger/schemas/auth.schema.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Swagger Schemas für Authentication
 *
 * STRUKTUR:
 * - Request DTOs:  Was der Client sendet
 * - Response DTOs: Was die API zurückgibt
 * - Nested Schemas: Wiederverwendbare Teile
 */

// ============================================================
// REQUEST SCHEMAS
// ============================================================

/**
 * Register Request Schema
 */
export class RegisterRequestSchema {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
    maxLength: 255,
  })
  email: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe',
    minLength: 3,
    maxLength: 30,
    pattern: '^[a-zA-Z0-9_]+$',
  })
  username: string;

  @ApiProperty({
    description:
      'User password (min 8 chars, must contain uppercase, lowercase, and number)',
    example: 'SecurePass123',
    minLength: 8,
    maxLength: 100,
    format: 'password',
  })
  password: string;
}

/**
 * Login Request Schema
 */
export class LoginRequestSchema {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123',
    format: 'password',
  })
  password: string;
}

// ============================================================
// RESPONSE SCHEMAS
// ============================================================

/**
 * Token Response Schema
 * JWT Token Information
 */
export class TokenResponseSchema {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.. .',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    enum: ['Bearer'],
  })
  tokenType: 'Bearer';

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;
}

/**
 * User Response Schema
 * User profile without sensitive data
 */
export class UserResponseSchema {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example. com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'johndoe',
  })
  username: string;

  @ApiPropertyOptional({
    description: 'User biography',
    example: 'Full-stack developer passionate about clean code',
    nullable: true,
  })
  bio: string | null;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: ['USER', 'ADMIN', 'MODERATOR'],
  })
  role: 'USER' | 'ADMIN' | 'MODERATOR';

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-01-10T12:00:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-10T12:00:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}

/**
 * Auth Response Schema
 * Complete response for register/login
 */
export class AuthResponseSchema {
  @ApiProperty({
    description: 'User profile',
    type: UserResponseSchema,
  })
  user: UserResponseSchema;

  @ApiProperty({
    description: 'Authentication tokens',
    type: TokenResponseSchema,
  })
  tokens: TokenResponseSchema;
}
