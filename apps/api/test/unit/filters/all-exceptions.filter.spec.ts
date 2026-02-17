// test/unit/filters/all-exceptions. filter.spec.ts

import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../../../src/shared/constants';
import { AllExceptionsFilter } from '../../../src/shared/filters/all-exceptions.filter';
import {
  createMockArgumentsHost,
  createMockRequest,
  createMockResponse,
} from '../../setup/test-utils';

/**
 * AllExceptionsFilter Unit Tests
 *
 * Testet:
 * - Unbekannte Errors werden gefangen
 * - Sensitive Daten werden gefiltert
 * - Response Format ist korrekt
 */
describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: ReturnType<typeof createMockResponse>;
  let mockRequest: ReturnType<typeof createMockRequest>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = createMockResponse();
    mockRequest = createMockRequest();
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('catch', () => {
    describe('response format', () => {
      it('should return 500 for unknown errors', () => {
        // Arrange
        const exception = new Error('Something went wrong');
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });

      it('should return standardized error response', () => {
        // Arrange
        const exception = new Error('Database connection failed');
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: expect.any(String),
              message: expect.any(String),
              statusCode: 500,
            }),
            meta: expect.objectContaining({
              path: mockRequest.url,
              method: mockRequest.method,
              timestamp: expect.any(String),
            }),
          }),
        );
      });

      it('should handle HttpExceptions with matching status', () => {
        // Arrange
        const exception = new HttpException(
          'Http path',
          HttpStatus.BAD_REQUEST,
        );
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: ErrorCodes.SERVER_ERROR,
              message: 'Http path',
              statusCode: HttpStatus.BAD_REQUEST,
            }),
          }),
        );
      });

      it('should propagate correlation ids into the meta block', () => {
        // Arrange
        const requestWithCorrelation = createMockRequest({
          headers: { 'x-correlation-id': 'corr-123' },
        });
        const exception = new Error('Correlation test');
        const host = createMockArgumentsHost(
          requestWithCorrelation,
          mockResponse,
        );

        // Act
        filter.catch(exception, host as any);

        // Assert
        const jsonCall = mockResponse.json.mock.calls[0][0];
        expect(jsonCall.meta.requestId).toBe('corr-123');
      });
    });

    describe('error type identification', () => {
      it('should identify JWT errors as AUTH_TOKEN_INVALID', () => {
        // Arrange
        const exception = new Error('invalid signature');
        exception.name = 'JsonWebTokenError';
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: ErrorCodes.AUTH_TOKEN_INVALID,
            }),
          }),
        );
      });

      it('should identify expired JWT as AUTH_TOKEN_EXPIRED', () => {
        // Arrange
        const exception = new Error('jwt expired');
        exception.name = 'TokenExpiredError';
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

      it('should identify database errors', () => {
        // Arrange
        const exception = new Error('ECONNREFUSED database connection');
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: ErrorCodes.SERVER_DATABASE_ERROR,
            }),
          }),
        );
      });
    });

    describe('message sanitization', () => {
      describe('in production', () => {
        beforeEach(() => {
          process.env.NODE_ENV = 'production';
          // Filter neu erstellen mit production env
          filter = new AllExceptionsFilter();
        });

        it('should not expose internal error messages', () => {
          // Arrange
          const exception = new Error('Database password:  secret123');
          const host = createMockArgumentsHost(mockRequest, mockResponse);

          // Act
          filter.catch(exception, host as any);

          // Assert
          expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
              error: expect.objectContaining({
                message: expect.not.stringContaining('secret123'),
              }),
            }),
          );
        });

        it('should return generic message in production', () => {
          // Arrange
          const exception = new Error('Internal implementation details');
          const host = createMockArgumentsHost(mockRequest, mockResponse);

          // Act
          filter.catch(exception, host as any);

          // Assert
          expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
              error: expect.objectContaining({
                message:
                  'An unexpected error occurred. Please try again later.',
              }),
            }),
          );
        });
      });

      describe('in development', () => {
        beforeEach(() => {
          process.env.NODE_ENV = 'development';
          filter = new AllExceptionsFilter();
        });

        it('should include sanitized error message', () => {
          // Arrange
          const exception = new Error('Something went wrong');
          const host = createMockArgumentsHost(mockRequest, mockResponse);

          // Act
          filter.catch(exception, host as any);

          // Assert
          expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
              error: expect.objectContaining({
                message: expect.any(String),
              }),
            }),
          );
        });

        it('should redact file paths from error message', () => {
          // Arrange
          const exception = new Error(
            'Error at C:\\Users\\dev\\project\\src\\file.ts: 123',
          );
          const host = createMockArgumentsHost(mockRequest, mockResponse);

          // Act
          filter.catch(exception, host as any);

          // Assert
          const jsonCall = mockResponse.json.mock.calls[0][0];
          expect(jsonCall.error.message).not.toContain('C:\\Users');
        });
      });
    });

    describe('non-Error exceptions', () => {
      it('should handle string throws', () => {
        // Arrange
        const exception = 'Something went wrong';
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalled();
      });

      it('should handle object throws', () => {
        // Arrange
        const exception = { error: 'Custom error object' };
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(exception, host as any);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(500);
      });

      it('should handle null/undefined throws', () => {
        // Arrange
        const host = createMockArgumentsHost(mockRequest, mockResponse);

        // Act
        filter.catch(null, host as any);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(500);
      });
    });
  });
});
