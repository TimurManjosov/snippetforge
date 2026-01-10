// src/shared/filters/http-exception.filter.spec.ts

import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpExceptionFilter } from './http-exception.filter';
import { ErrorCodes } from '../constants';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    // Mock Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock Request
    mockRequest = {
      url: '/api/test',
      method: 'GET',
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
  });

  describe('catch', () => {
    it('should handle string exception response', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.RESOURCE_NOT_FOUND,
          message: 'Not found',
          statusCode: 404,
        },
        meta: {
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
        },
      });
    });

    it('should handle object exception response', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          statusCode: 400,
        },
        meta: {
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
        },
      });
    });

    it('should handle exception with array of messages', () => {
      const exception = new HttpException(
        {
          message: ['Error 1', 'Error 2'],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Error 1',
          statusCode: 400,
          details: {
            context: {
              messages: ['Error 1', 'Error 2'],
            },
          },
        },
        meta: {
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
        },
      });
    });

    it('should handle exception with custom error code', () => {
      const exception = new HttpException(
        {
          message: 'User not found',
          code: ErrorCodes.USER_NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.USER_NOT_FOUND,
          message: 'User not found',
          statusCode: 404,
        },
        meta: {
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
        },
      });
    });

    it('should handle exception with Zod validation errors', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          code: ErrorCodes.VALIDATION_ERROR,
          errors: {
            email: ['Invalid email format'],
            password: ['Too short', 'Must contain number'],
          },
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          statusCode: 400,
          details: {
            fields: {
              email: ['Invalid email format'],
              password: ['Too short', 'Must contain number'],
            },
          },
        },
        meta: {
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
        },
      });
    });

    it('should extract request ID from headers', () => {
      mockRequest.headers['x-request-id'] = 'test-request-id-123';

      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Object),
        meta: {
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
          requestId: 'test-request-id-123',
        },
      });
    });

    it('should extract correlation ID if request ID is not present', () => {
      mockRequest.headers['x-correlation-id'] = 'correlation-456';

      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Object),
        meta: {
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
          requestId: 'correlation-456',
        },
      });
    });
  });

  describe('error code inference', () => {
    it('should infer AUTH_TOKEN_EXPIRED for 401 with expired message', () => {
      const exception = new HttpException(
        { message: 'Token expired' },
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.AUTH_TOKEN_EXPIRED);
    });

    it('should infer AUTH_TOKEN_MISSING for 401 with missing token message', () => {
      const exception = new HttpException(
        { message: 'No token provided' },
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.AUTH_TOKEN_MISSING);
    });

    it('should infer AUTH_INVALID_CREDENTIALS for 401 with invalid credentials', () => {
      const exception = new HttpException(
        { message: 'Invalid credentials' },
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.AUTH_INVALID_CREDENTIALS);
    });

    it('should infer AUTH_TOKEN_INVALID for generic 401', () => {
      const exception = new HttpException(
        { message: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
    });

    it('should infer AUTH_INSUFFICIENT_ROLE for 403 with role message', () => {
      const exception = new HttpException(
        { message: 'Insufficient role' },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.AUTH_INSUFFICIENT_ROLE);
    });

    it('should infer AUTH_ACCESS_DENIED for generic 403', () => {
      const exception = new HttpException(
        { message: 'Forbidden' },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.AUTH_ACCESS_DENIED);
    });

    it('should infer USER_EMAIL_EXISTS for 409 with email message', () => {
      const exception = new HttpException(
        { message: 'Email already exists' },
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.USER_EMAIL_EXISTS);
    });

    it('should infer USER_USERNAME_EXISTS for 409 with username message', () => {
      const exception = new HttpException(
        { message: 'Username already taken' },
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.USER_USERNAME_EXISTS);
    });

    it('should infer USER_NOT_FOUND for 404 with user message', () => {
      const exception = new HttpException(
        { message: 'User not found' },
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.USER_NOT_FOUND);
    });

    it('should use default code for unknown status', () => {
      const exception = new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.code).toBe(ErrorCodes.SERVER_ERROR);
    });
  });

  describe('logging behavior', () => {
    it('should log error level for 5xx errors', () => {
      const loggerErrorSpy = jest.spyOn(filter['logger'], 'error');

      const exception = new HttpException(
        'Internal Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should log warn level for 401 errors', () => {
      const loggerWarnSpy = jest.spyOn(filter['logger'], 'warn');

      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(loggerWarnSpy).toHaveBeenCalled();
    });

    it('should log warn level for 403 errors', () => {
      const loggerWarnSpy = jest.spyOn(filter['logger'], 'warn');

      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(loggerWarnSpy).toHaveBeenCalled();
    });

    it('should log debug level for 4xx errors (except 401/403)', () => {
      const loggerDebugSpy = jest.spyOn(filter['logger'], 'debug');

      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(loggerDebugSpy).toHaveBeenCalled();
    });
  });
});
