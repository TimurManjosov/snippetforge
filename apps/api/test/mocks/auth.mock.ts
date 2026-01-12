// test/mocks/auth.mock.ts

import { JwtService } from '@nestjs/jwt';
import { type AuthResponse, type TokenResponse } from '../../src/modules/auth';
import { createMockSafeUser } from './users.mock';

/**
 * Auth Mocks
 *
 * Mock-Implementierungen für AuthService und JwtService.
 */

// ========================================
// SERVICE MOCKS
// ========================================

export const createMockAuthService = () => ({
  register: jest.fn(),
  login: jest.fn(),
  validateUserById: jest.fn(),
  getCurrentUser: jest.fn(),
});

export type MockAuthService = ReturnType<typeof createMockAuthService>;

export const createMockJwtService = (): Partial<JwtService> => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verify: jest
    .fn()
    .mockReturnValue({ sub: 'user-id', email: 'test@test.com', role: 'USER' }),
  verifyAsync: jest.fn().mockResolvedValue({
    sub: 'user-id',
    email: 'test@test.com',
    role: 'USER',
  }),
  decode: jest
    .fn()
    .mockReturnValue({ sub: 'user-id', email: 'test@test.com', role: 'USER' }),
});

export type MockJwtService = ReturnType<typeof createMockJwtService>;

// ========================================
// REFLECTOR MOCK
// ========================================

export const createMockReflector = () => ({
  get: jest.fn(),
  getAll: jest.fn(),
  getAllAndMerge: jest.fn(),
  getAllAndOverride: jest.fn(),
});

export type MockReflector = ReturnType<typeof createMockReflector>;

// ========================================
// TEST DATA
// ========================================

/**
 * Erstellt eine Mock TokenResponse
 */
export function createMockTokenResponse(): TokenResponse {
  return {
    accessToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoiVVNFUiJ9.mock-signature',
    tokenType: 'Bearer',
    expiresIn: 900,
  };
}

/**
 * Erstellt eine Mock AuthResponse
 */
export function createMockAuthResponse(userOverrides = {}): AuthResponse {
  return {
    user: createMockSafeUser(userOverrides),
    tokens: createMockTokenResponse(),
  };
}

/**
 * Erstellt einen Mock JWT Payload
 */
export function createMockJwtPayload(overrides = {}) {
  return {
    sub: 'test-user-id-123',
    email: 'test@example.com',
    role: 'USER',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
    ...overrides,
  };
}
