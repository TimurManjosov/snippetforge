// test/unit/guards/roles.guard.spec.ts

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../src/modules/auth/guards/roles.guard';
import { createMockReflector, createMockSafeUser } from '../../mocks';
import { createMockExecutionContext } from '../../setup/test-utils';

/**
 * RolesGuard Unit Tests
 *
 * Testet:
 * - Routes ohne @Roles() sind für alle erlaubt
 * - Routes mit @Roles() erfordern passende Rolle
 * - Fehlende Rolle führt zu ForbiddenException
 */
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: ReturnType<typeof createMockReflector>;

  beforeEach(() => {
    reflector = createMockReflector();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    describe('when no roles are required', () => {
      it('should return true for any user', () => {
        // Arrange
        reflector.getAllAndOverride.mockReturnValue(undefined);
        const user = createMockSafeUser({ role: 'USER' });
        const context = createMockExecutionContext({
          request: { user },
        }) as unknown as ExecutionContext;

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('should return true when roles array is empty', () => {
        // Arrange
        reflector.getAllAndOverride.mockReturnValue([]);
        const user = createMockSafeUser({ role: 'USER' });
        const context = createMockExecutionContext({
          request: { user },
        }) as unknown as ExecutionContext;

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('when roles are required', () => {
      it('should return true when user has required role', () => {
        // Arrange
        reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
        const user = createMockSafeUser({ role: 'ADMIN' });
        const context = createMockExecutionContext({
          request: { user },
        }) as unknown as ExecutionContext;

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('should return true when user has one of multiple allowed roles', () => {
        // Arrange
        reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'MODERATOR']);
        const user = createMockSafeUser({ role: 'MODERATOR' });
        const context = createMockExecutionContext({
          request: { user },
        }) as unknown as ExecutionContext;

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('should throw ForbiddenException when user lacks required role', () => {
        // Arrange
        reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
        const user = createMockSafeUser({ role: 'USER' });
        const context = createMockExecutionContext({
          request: { user },
        }) as unknown as ExecutionContext;

        // Act & Assert
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });

      it('should throw ForbiddenException when no user in request', () => {
        // Arrange
        reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
        const context = createMockExecutionContext({
          request: { user: undefined },
        }) as unknown as ExecutionContext;

        // Act & Assert
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });
    });
  });
});
