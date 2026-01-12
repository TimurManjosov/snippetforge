// test/factories/auth.factory.ts

import { randomEmail, randomUsername } from '../setup/test-utils';

/**
 * Auth Test Data Factory
 *
 * Erstellt valide Test-Daten für Auth-bezogene Tests.
 */

/**
 * Erstellt valide Registration-Daten
 */
export function createRegisterDto(
  overrides: {
    email?: string;
    username?: string;
    password?: string;
  } = {},
) {
  return {
    email: overrides.email ?? randomEmail(),
    username: overrides.username ?? randomUsername(),
    password: overrides.password ?? 'SecurePass123',
  };
}

/**
 * Erstellt valide Login-Daten
 */
export function createLoginDto(
  overrides: {
    email?: string;
    password?: string;
  } = {},
) {
  return {
    email: overrides.email ?? 'test@example.com',
    password: overrides.password ?? 'SecurePass123',
  };
}

/**
 * Invalide Auth-Daten für Validation Tests
 */
export const invalidAuthData = {
  register: {
    emptyBody: {},
    missingEmail: { username: 'test', password: 'SecurePass123' },
    missingUsername: { email: 'test@test.com', password: 'SecurePass123' },
    missingPassword: { email: 'test@test.com', username: 'test' },
    invalidEmail: {
      email: 'invalid',
      username: 'test',
      password: 'SecurePass123',
    },
    weakPassword: {
      email: 'test@test.com',
      username: 'test',
      password: 'weak',
    },
  },
  login: {
    emptyBody: {},
    missingEmail: { password: 'SecurePass123' },
    missingPassword: { email: 'test@test. com' },
    invalidEmail: { email: 'invalid', password: 'SecurePass123' },
  },
};
