// E2E SMOKE (manual / integration test):
// - GET /health → Response must contain header 'x-request-id'
// - GET /health with header 'X-Request-Id: test-123' → Response echoes 'test-123'
// - Trigger 404 → Response body must contain { requestId: '...' }

import { HttpException, HttpStatus } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './global-http-exception.filter';
import { AppLogger } from '../logging/app-logger';

// Spy on AppLogger.error before each test
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  errorSpy = jest.spyOn(AppLogger.prototype, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

function createMockHost(requestId?: string) {
  const req = {
    method: 'GET',
    originalUrl: '/api/test',
    url: '/api/test',
    requestId,
    user: { id: 'user-1' },
  };
  const jsonFn = jest.fn();
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn });
  const res = { status: statusFn };

  const host = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as any;

  return { host, req, res, statusFn, jsonFn };
}

describe('GlobalHttpExceptionFilter', () => {
  let filter: GlobalHttpExceptionFilter;

  beforeEach(() => {
    filter = new GlobalHttpExceptionFilter();
  });

  it('includes requestId in response body for HttpException', () => {
    const { host, jsonFn, statusFn } = createMockHost('req-abc');
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'req-abc' }),
    );
  });

  it('includes requestId in response body for unknown errors (500)', () => {
    const { host, jsonFn, statusFn } = createMockHost('req-xyz');
    const exception = new TypeError('Something broke');

    filter.catch(exception, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-xyz',
        message: 'Internal server error',
      }),
    );
  });

  it('calls AppLogger.error exactly once per catch invocation', () => {
    const { host } = createMockHost('req-log');
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'req-log' }),
      'request.error',
    );
  });
});
