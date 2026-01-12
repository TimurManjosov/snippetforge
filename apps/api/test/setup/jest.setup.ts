// test/setup/jest.setup.ts

/**
 * Jest Global Setup
 *
 * Wird VOR jedem Test-File ausgeführt.
 * Hier konfigurieren wir globale Test-Einstellungen.
 */

// ========================================
// ENVIRONMENT VARIABLES
// ========================================

// Test-spezifische Environment Variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  'test-secret-key-for-testing-only-min-32-characters-long';
process.env.JWT_EXPIRES_IN = '15m';
process.env.DATABASE_URL =
  'postgresql://snippetforge:dev_password@localhost:5432/snippetforge';

// ========================================
// GLOBAL MOCKS
// ========================================

// Console Mocks (optional - reduziert Noise in Test Output)
// Auskommentieren wenn Debug-Output benötigt wird
// global.console = {
//   ... console,
//   log: jest. fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// }

// ========================================
// CUSTOM MATCHERS
// ========================================

// Erweiterte Expect-Matcher (optional)
expect.extend({
  /**
   * Prüft ob ein Objekt eine UUID enthält
   */
  toBeUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
    };
  },

  /**
   * Prüft ob ein String ein JWT Token ist
   */
  toBeJWT(received: string) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = jwtRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a JWT token`
          : `Expected ${received} to be a JWT token`,
    };
  },
});

// TypeScript Deklaration für Custom Matchers
declare module 'expect' {
  interface Matchers<R> {
    toBeUUID(): R;
    toBeJWT(): R;
  }
}

// ========================================
// GLOBAL TEST UTILITIES
// ========================================

// Erhöhe Timeout für langsame Tests
jest.setTimeout(10000);
