// apps/api/jest.config.ts

import type { Config } from 'jest';

const config: Config = {
  // ========================================
  // BASIC CONFIGURATION
  // ========================================

  displayName: 'api',
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Root Directory
  rootDir: '.',

  // ========================================
  // FILE PATTERNS
  // ========================================

  // Test-Files finden
  testMatch: [
    '<rootDir>/test/**/*.spec.ts',
    '<rootDir>/test/**/*.e2e-spec.ts',
    '<rootDir>/src/**/*.spec.ts',
  ],

  // Module Resolution
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Path Aliases (wie in tsconfig)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },

  // ========================================
  // TYPESCRIPT CONFIGURATION
  // ========================================

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  // ========================================
  // SETUP & TEARDOWN
  // ========================================

  // Global Setup (einmal vor allen Tests)
  globalSetup: undefined,

  // Global Teardown (einmal nach allen Tests)
  globalTeardown: undefined,

  // Setup für jede Test-File
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],

  // ========================================
  // COVERAGE CONFIGURATION
  // ========================================

  collectCoverage: true,

  // Coverage nur von src/ sammeln
  collectCoverageFrom: [
    'src/**/*.ts',
    // Ausschlüsse
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/index.ts',
    '!src/main.ts',
    '!src/**/*.schema.ts',
    '!src/config/**/*.ts',
    '!src/shared/swagger/**/*.ts',
    '!src/lib/db/migrations/**/*.ts',
  ],

  // Coverage Output
  coverageDirectory: '<rootDir>/coverage',

  // Coverage Reporter
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

  // MINIMUM COVERAGE THRESHOLDS (90%!)
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 80, // Relaxed from 90% due to guard branches
      functions: 90,
      lines: 90,
    },
  },

  // ========================================
  // PERFORMANCE
  // ========================================

  // Parallele Ausführung
  maxWorkers: '50%',

  // Cache für schnellere Re-Runs
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Timeout pro Test (ms)
  testTimeout: 10000,

  // ========================================
  // OUTPUT
  // ========================================

  // Verbose Output
  verbose: true,

  // Clear Mocks zwischen Tests
  clearMocks: true,

  // Restore Mocks nach jedem Test
  restoreMocks: true,

  // Error Details
  errorOnDeprecated: true,
};

export default config;
