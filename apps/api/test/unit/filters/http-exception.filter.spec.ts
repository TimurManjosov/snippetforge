/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// test/unit/filters/http-exception.filter.spec.ts

import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorCodes } from '../../../src/shared/constants';
import { HttpExceptionFilter } from '../../../src/shared/filters/http-exception.filter';
import {
  createMockArgumentsHost,
  createMockRequest,
  createMockResponse,
} from '../../setup/test-utils';

/**
 * HttpExceptionFilter Unit Tests
 *
 * Testet:
 * - Verschiedene HTTP Status Codes
 * - Error Code Inferenz
 * - Response Format
 */
describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: ReturnType<typeof createMockResponse>;
  let mockRequest: ReturnType<typeof createMockRequest>;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = createMockResponse();
    mockRequest = createMockRequest();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    describe('response format', () => {
      it('should return standardized error response format', () => {
        // Arrange
        const exception = new BadRequestException('Test error');
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              message: 'Test error',
              statusCode: 400,
            }),
            meta: expect.objectContaining({
              path: mockRequest.url,
              method: mockRequest.method,
              timestamp: expect.any(String),
            }),
          }),
        );
      });
    });

    describe('error code inference', () => {
      it('should infer AUTH_TOKEN_MISSING for "missing token" message', () => {
        // Arrange
        const exception = new UnauthorizedException(
          'Missing authentication token',
        );
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: ErrorCodes.AUTH_TOKEN_MISSING,
            }),
          }),
        );
      });

      it('should infer AUTH_TOKEN_EXPIRED for "expired" message', () => {
        // Arrange
        const exception = new UnauthorizedException('Token has expired');
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: ErrorCodes.AUTH_TOKEN_EXPIRED,
            }),
          }),
        );
      });

      it('should infer AUTH_INVALID_CREDENTIALS for login failure', () => {
        // Arrange
        const exception = new UnauthorizedException(
          'Invalid email or password',
        );
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
            }),
          }),
        );
      });

      it('should infer USER_EMAIL_EXISTS for email conflict', () => {
        // Arrange
        const exception = new ConflictException('Email is already registered');
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: ErrorCodes.USER_EMAIL_EXISTS,
            }),
          }),
        );
      });

      it('should infer USER_NOT_FOUND for user not found', () => {
        // Arrange
        const exception = new NotFoundException('User not found');
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: ErrorCodes.USER_NOT_FOUND,
            }),
          }),
        );
      });
    });

    describe('validation error handling', () => {
      it('should include validation details in response', () => {
        // Arrange
        const exception = new BadRequestException({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: {
            email: ['Invalid email format'],
            password: ['Too short'],
          },
        });
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              details: expect.objectContaining({
                fields: expect.objectContaining({
                  email: ['Invalid email format'],
                  password: ['Too short'],
                }),
              }),
            }),
          }),
        );
      });
    });

    describe('HTTP status codes', () => {
      const statusCases = [
        { status: HttpStatus.BAD_REQUEST, name: 'Bad Request' },
        { status: HttpStatus.UNAUTHORIZED, name: 'Unauthorized' },
        { status: HttpStatus.FORBIDDEN, name: 'Forbidden' },
        { status: HttpStatus.NOT_FOUND, name: 'Not Found' },
        { status: HttpStatus.CONFLICT, name: 'Conflict' },
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          name: 'Internal Server Error',
        },
      ];

      statusCases.forEach(({ status, name }) => {
        it(`should handle ${status} (${name})`, () => {
          // Arrange
          const exception = new HttpException('Test', status);
          const host = createMockArgumentsHost(mockRequest, mockResponse);

          // Act
          filter.catch(exception, host as any);

          // Assert
          expect(mockResponse.status).toHaveBeenCalledWith(status);
          expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
              error: expect.objectContaining({
                statusCode: status,
              }),
            }),
          );
        });
      });
    });
  });
});
