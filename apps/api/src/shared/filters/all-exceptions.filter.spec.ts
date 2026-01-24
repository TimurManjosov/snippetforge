// src/shared/filters/all-exceptions.filter.spec.ts

import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ErrorCodes } from '../constants';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: any;
  let originalNodeEnv: string | undefined;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);

    // Mock Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock Request
    mockRequest = {
      url: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };

    // Save original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original NODE_ENV
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('catch - production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      // Recreate filter to pick up new NODE_ENV
      filter = new AllExceptionsFilter();
    });

    it('should return generic message in production for TypeError', () => {
      const exception = new TypeError('Cannot read property of undefined');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.SERVER_ERROR,
          message: 'An unexpected error occurred. Please try again later.',
          statusCode: 500,
        },
        meta: {
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'POST',
        },
      });
    });

    it('should not leak error details in production', () => {
      const exception = new Error(
        'Database connection failed at /home/user/app/db.js:123',
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.message).toBe(
        'An unexpected error occurred. Please try again later.',
      );
      expect(response.error.message).not.toContain('/home/user/app');
      expect(response.error.message).not.toContain('db.js');
    });

    it('should log error with full details in production', () => {
      const loggerErrorSpy = jest.spyOn(filter['logger'], 'error');
      const exception = new Error('Sensitive internal error');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalled();
      const logCall = loggerErrorSpy.mock.calls[0];
      expect(logCall[0]).toContain('Sensitive internal error');
    });
  });

  describe('catch - development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      // Recreate filter to pick up new NODE_ENV
      filter = new AllExceptionsFilter();
    });

    it('should return sanitized error message in development', () => {
      const exception = new Error('Database query failed');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.message).toBe('Database query failed');
    });

    it('should sanitize file paths in development', () => {
      const exception = new Error(
        'Failed at /home/user/project/src/file.ts:123',
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.message).toContain('[REDACTED]');
      expect(response.error.message).not.toContain('/home/user/project');
    });

    it('should sanitize Windows file paths in development', () => {
      const exception = new Error('Error in C:\\Users\\Project\\app.js');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.message).toContain('[REDACTED]');
      expect(response.error.message).not.toContain('C:\\Users\\Project');
    });

    it('should sanitize connection strings in development', () => {
      const exception = new Error(
        'Failed to connect to postgresql://user:pass@localhost:5432/db',
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.message).toContain('[REDACTED]');
      expect(response.error.message).not.toContain('user:pass@localhost');
    });

    it('should truncate very long error messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(600);
      const exception = new Error(longMessage);

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.message.length).toBeLessThanOrEqual(500);
    });
  });

  describe('error type identification', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      filter = new AllExceptionsFilter();
    });

    it('should identify JWT token invalid error', () => {
      const exception = new Error('Invalid token');
      exception.name = 'JsonWebTokenError';

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
    });

    it('should identify JWT token expired error', () => {
      const exception = new Error('Token expired');
      exception.name = 'TokenExpiredError';

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.AUTH_TOKEN_EXPIRED);
    });

    it('should identify JWT NotBeforeError', () => {
      const exception = new Error('Token not active');
      exception.name = 'NotBeforeError';

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
    });

    it('should identify database connection error', () => {
      const exception = new Error('ECONNREFUSED to database');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.SERVER_DATABASE_ERROR);
    });

    it('should identify postgres error', () => {
      const exception = new Error('postgres connection failed');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.SERVER_DATABASE_ERROR);
    });

    it('should identify unique constraint violation', () => {
      const exception = new Error(
        'duplicate key value violates unique constraint',
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.RESOURCE_ALREADY_EXISTS);
    });

    it('should identify JSON parse error', () => {
      const exception = new SyntaxError('Unexpected token in JSON');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should use default code for unknown error', () => {
      const exception = new Error('Unknown error');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.SERVER_ERROR);
    });
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with warning', () => {
      const loggerWarnSpy = jest.spyOn(filter['logger'], 'warn');
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'HttpException caught by AllExceptionsFilter - this should not happen',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('request ID extraction', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      filter = new AllExceptionsFilter();
    });

    it('should extract x-request-id from headers', () => {
      mockRequest.headers['x-request-id'] = 'req-123';
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.meta.requestId).toBe('req-123');
    });

    it('should extract x-correlation-id if x-request-id is not present', () => {
      mockRequest.headers['x-correlation-id'] = 'corr-456';
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.meta.requestId).toBe('corr-456');
    });

    it('should not include requestId if neither header is present', () => {
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.meta.requestId).toBeUndefined();
    });
  });

  describe('non-Error exception handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      filter = new AllExceptionsFilter();
    });

    it('should handle string throws', () => {
      const exception = 'string error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should log string throws appropriately', () => {
      const loggerErrorSpy = jest.spyOn(filter['logger'], 'error');
      const exception = 'string error';

      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalled();
      const logCall = loggerErrorSpy.mock.calls[0];
      expect(logCall[0]).toContain('Unknown exception type');
      expect(logCall[1]).toBe('string error');
    });
  });

  describe('logging', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      filter = new AllExceptionsFilter();
    });

    it('should always log with stack trace for Error instances', () => {
      const loggerErrorSpy = jest.spyOn(filter['logger'], 'error');
      const exception = new Error('Test error with stack');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalled();
      const logCall = loggerErrorSpy.mock.calls[0];
      expect(logCall[1]).toBeTruthy(); // Stack trace
      expect(logCall[2]).toContain('method'); // Log context
    });

    it('should include request metadata in log context', () => {
      const loggerErrorSpy = jest.spyOn(filter['logger'], 'error');
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const logContextStr = loggerErrorSpy.mock.calls[0][2];
      const logContext = JSON.parse(logContextStr);

      expect(logContext).toMatchObject({
        method: 'POST',
        url: '/api/test',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: expect.any(String),
      });
    });

    it('should truncate long user agents', () => {
      const loggerErrorSpy = jest.spyOn(filter['logger'], 'error');
      const longUserAgent = 'x'.repeat(200);
      mockRequest.headers['user-agent'] = longUserAgent;

      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const logContextStr = loggerErrorSpy.mock.calls[0][2];
      const logContext = JSON.parse(logContextStr);

      expect(logContext.userAgent.length).toBe(100);
    });
  });

  describe('response format', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      filter = new AllExceptionsFilter();
    });

    it('should never include stack trace in response', () => {
      const exception = new Error('Test error');
      exception.stack = 'Error: Test error\n    at something...';

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(JSON.stringify(response)).not.toContain(exception.stack);
    });

    it('should always set success to false', () => {
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.success).toBe(false);
    });

    it('should include proper metadata', () => {
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.meta).toMatchObject({
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'POST',
      });
    });
  });
});
