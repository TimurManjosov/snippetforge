// test/setup/test-utils.ts

import { INestApplication, ModuleMetadata, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../../src/shared/filters';

/**
 * Test Utilities
 *
 * Wiederverwendbare Funktionen für Tests.
 * Reduziert Boilerplate und sorgt für Konsistenz.
 */

/**
 * Erstellt ein NestJS Testing Module mit Standard-Konfiguration
 *
 * @param metadata - Module Metadata (providers, imports, etc.)
 * @returns Kompiliertes Test-Module
 */
export async function createTestingModule(
  metadata: ModuleMetadata,
): Promise<TestingModule> {
  return Test.createTestingModule(metadata).compile();
}

/**
 * Erstellt eine vollständige NestJS Test-Application
 * Verwendet für E2E Tests
 *
 * @param moduleType - Das zu testende Module
 * @returns Initialisierte Nest Application
 */
export async function createTestingApp(
  moduleType: Type<unknown>,
): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [moduleType],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Gleiche Konfiguration wie Production
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  await app.init();
  return app;
}

/**
 * Wartet eine bestimmte Zeit (für async Tests)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generiert eine zufällige Email für Tests
 * Verhindert Konflikte bei parallelen Tests
 */
export function randomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}@test.com`;
}

/**
 * Generiert einen zufälligen Username für Tests
 */
export function randomUsername(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${random}`.substring(0, 30);
}

/**
 * Mock Request Object für Filter/Guard Tests
 */
export function createMockRequest(
  overrides: Partial<{
    url: string;
    method: string;
    headers: Record<string, string>;
    user: unknown;
  }> = {},
) {
  return {
    url: '/api/test',
    method: 'GET',
    headers: {},
    user: undefined,
    ...overrides,
  };
}

/**
 * Mock Response Object für Filter Tests
 */
export function createMockResponse() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return response;
}

/**
 * Mock Execution Context für Guards
 */
export function createMockExecutionContext(
  overrides: {
    request?: Partial<{
      user: unknown;
      headers: Record<string, string>;
      params: Record<string, string>;
    }>;
    handler?: unknown;
    class?: unknown;
  } = {},
) {
  const mockRequest = {
    user: undefined,
    headers: {},
    params: {},
    ...overrides.request,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => createMockResponse(),
    }),
    getHandler: () => overrides.handler || jest.fn(),
    getClass: () => overrides.class || class TestController {},
  };
}

/**
 * Mock ArgumentsHost für Filters
 */
export function createMockArgumentsHost(
  request = createMockRequest(),
  response = createMockResponse(),
) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({ getData: () => undefined }),
    switchToWs: () => ({ getData: () => undefined }),
    getType: () => 'http' as const,
  };
}
