// test/factories/user. factory.ts

import { randomEmail, randomUsername } from '../setup/test-utils';

/**
 * User Test Data Factory
 *
 * Erstellt valide Test-Daten für User-bezogene Tests.
 * Jeder Aufruf generiert eindeutige Daten (für Parallelisierung).
 */

/**
 * Erstellt valide User-Erstellungsdaten
 */
export function createUserDto(
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
 * Erstellt invalide User-Daten für Validation Tests
 */
export const invalidUserData = {
  emptyEmail: {
    email: '',
    username: 'validuser',
    password: 'SecurePass123',
  },
  invalidEmail: {
    email: 'not-an-email',
    username: 'validuser',
    password: 'SecurePass123',
  },
  shortUsername: {
    email: 'valid@email.com',
    username: 'ab', // zu kurz (min 3)
    password: 'SecurePass123',
  },
  longUsername: {
    email: 'valid@email.com',
    username: 'a'.repeat(31), // zu lang (max 30)
    password: 'SecurePass123',
  },
  invalidUsernameChars: {
    email: 'valid@email.com',
    username: 'invalid user! ', // Leerzeichen und Sonderzeichen
    password: 'SecurePass123',
  },
  shortPassword: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'Short1', // zu kurz (min 8)
  },
  noUppercase: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'lowercase123', // kein Großbuchstabe
  },
  noLowercase: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'UPPERCASE123', // kein Kleinbuchstabe
  },
  noNumber: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'NoNumbersHere', // keine Zahl
  },
};

/**
 * Erstellt Update-Daten für User
 */
export function createUpdateUserDto(
  overrides: {
    username?: string;
    bio?: string;
    avatarUrl?: string;
  } = {},
) {
  return {
    username: overrides.username,
    bio: overrides.bio ?? 'Updated bio for testing',
    avatarUrl: overrides.avatarUrl ?? 'https://example.com/new-avatar.jpg',
  };
}
