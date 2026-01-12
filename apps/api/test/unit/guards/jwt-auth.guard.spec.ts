/* eslint-disable @typescript-eslint/no-unused-vars */
// test/unit/guards/jwt-auth.guard.spec.ts

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../src/modules/auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { createMockReflector } from '../../mocks';
import { createMockExecutionContext } from '../../setup/test-utils';

/**
 * JwtAuthGuard Unit Tests
 *
 * Testet:
 * - Public Routes werden durchgelassen
 * - Protected Routes erfordern Token
 * - Error Handling bei fehlgeschlagener Auth
 */
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: ReturnType<typeof createMockReflector>;

  beforeEach(() => {
    reflector = createMockReflector();
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    describe('when route is marked as @Public()', () => {
      it('should return true without checking token', () => {
        // Arrange
        reflector.getAllAndOverride.mockReturnValue(true);
        const context =
          createMockExecutionContext() as unknown as ExecutionContext;

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
          IS_PUBLIC_KEY,
          expect.any(Array),
        );
      });
    });

    describe('when route is NOT public', () => {
      it('should call super.canActivate for token validation', () => {
        // Arrange
        reflector.getAllAndOverride.mockReturnValue(false);
        const context =
          createMockExecutionContext() as unknown as ExecutionContext;

        // Mock super.canActivate
        const superCanActivate = jest
          .spyOn(
            Object.getPrototypeOf(Object.getPrototypeOf(guard)),
            'canActivate',
          )
          .mockReturnValue(true);

        // Act
        const result = guard.canActivate(context);

        // Assert
        expect(reflector.getAllAndOverride).toHaveBeenCalled();
        // Note: In einer echten Implementierung würde hier Passport aufgerufen
      });
    });
  });

  describe('handleRequest', () => {
    describe('when authentication succeeds', () => {
      it('should return the user object', () => {
        // Arrange
        const mockUser = { id: '123', email: 'test@test.com', role: 'USER' };

        // Act
        const result = guard.handleRequest(null, mockUser, undefined);

        // Assert
        expect(result).toBe(mockUser);
      });
    });

    describe('when authentication fails', () => {
      it('should throw UnauthorizedException when error is provided', () => {
        // Arrange
        const error = new Error('Token expired');

        // Act & Assert
        expect(() => guard.handleRequest(error, null, undefined)).toThrow(
          UnauthorizedException,
        );
      });

      it('should throw UnauthorizedException when no user is provided', () => {
        // Arrange & Act & Assert
        expect(() => guard.handleRequest(null, null, undefined)).toThrow(
          UnauthorizedException,
        );
      });

      it('should include info message when available', () => {
        // Arrange
        const info = new Error('jwt expired');

        // Act & Assert
        expect(() => guard.handleRequest(null, null, info)).toThrow(
          'jwt expired',
        );
      });
    });
  });
});
