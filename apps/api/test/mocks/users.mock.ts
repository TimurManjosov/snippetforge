// test/mocks/users.mock.ts

import { type FullUser, type SafeUser } from '../../src/modules/users';

/**
 * Users Mocks
 *
 * Mock-Implementierungen für UsersRepository und UsersService.
 */

// ========================================
// REPOSITORY MOCK
// ========================================

export const createMockUsersRepository = () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByEmailOrUsername: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updatePassword: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
});

export type MockUsersRepository = ReturnType<typeof createMockUsersRepository>;

// ========================================
// SERVICE MOCK
// ========================================

export const createMockUsersService = () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  update: jest.fn(),
  changePassword: jest.fn(),
  delete: jest.fn(),
  validateCredentials: jest.fn(),
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
});

export type MockUsersService = ReturnType<typeof createMockUsersService>;

// ========================================
// TEST DATA
// ========================================

/**
 * Erstellt einen Mock SafeUser
 */
export function createMockSafeUser(
  overrides: Partial<SafeUser> = {},
): SafeUser {
  const now = new Date();
  return {
    id: 'test-user-id-123',
    email: 'test@example.com',
    username: 'testuser',
    bio: null,
    avatarUrl: null,
    role: 'USER',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Erstellt einen Mock FullUser (mit passwordHash)
 */
export function createMockFullUser(
  overrides: Partial<FullUser> = {},
): FullUser {
  return {
    ...createMockSafeUser(overrides),
    passwordHash: '$2a$10$mockHashedPasswordForTesting123456789012',
    ...overrides,
  };
}
