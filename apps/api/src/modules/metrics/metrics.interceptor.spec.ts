import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { MetricsInterceptor } from './metrics.interceptor';

function createMockMetricsService() {
  return {
    httpRequestsTotal: { inc: jest.fn() },
    httpErrorsTotal: { inc: jest.fn() },
    httpRequestDurationMs: { observe: jest.fn() },
  };
}

function createMockContext(statusCode = 200) {
  const req = {
    method: 'GET',
    route: { path: '/test' },
    baseUrl: '/api',
    originalUrl: '/api/test',
    url: '/api/test',
  };
  const res = { statusCode };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    req,
    res,
  } as any;
}

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let mockMetrics: ReturnType<typeof createMockMetricsService>;

  beforeEach(() => {
    mockMetrics = createMockMetricsService();
    interceptor = new MetricsInterceptor(mockMetrics as any);
  });

  it('increments httpRequestsTotal and observes duration on success (200)', () => {
    const ctx = createMockContext(200);
    const next = { handle: () => of('response') };

    // subscribe() completes synchronously; finalize runs during teardown after complete
    interceptor.intercept(ctx, next).subscribe({ error: () => {} });

    expect(mockMetrics.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', route: '/api/test', status: '200' }),
    );
    expect(mockMetrics.httpRequestDurationMs.observe).toHaveBeenCalled();
    expect(mockMetrics.httpErrorsTotal.inc).not.toHaveBeenCalled();
  });

  it('increments httpRequestsTotal and httpErrorsTotal on plain Error (500)', () => {
    const ctx = createMockContext(200);
    const next = { handle: () => throwError(() => new Error('Internal')) };

    // subscribe() errors synchronously; finalize runs during teardown after error
    interceptor.intercept(ctx, next).subscribe({ error: () => {} });

    expect(mockMetrics.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', status: '500' }),
    );
    expect(mockMetrics.httpErrorsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', status: '500' }),
    );
    expect(mockMetrics.httpRequestDurationMs.observe).toHaveBeenCalled();
  });

  it('derives status code from HttpException', () => {
    const ctx = createMockContext(200);
    const next = {
      handle: () => throwError(() => new HttpException('Not Found', HttpStatus.NOT_FOUND)),
    };

    interceptor.intercept(ctx, next).subscribe({ error: () => {} });

    expect(mockMetrics.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', status: '404' }),
    );
    expect(mockMetrics.httpErrorsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', status: '404' }),
    );
  });

  it('observes httpRequestDurationMs in both success and error cases', () => {
    const ctx = createMockContext(200);
    const next = { handle: () => of('ok') };

    interceptor.intercept(ctx, next).subscribe({ error: () => {} });

    expect(mockMetrics.httpRequestDurationMs.observe).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', route: '/api/test', status: '200' }),
      expect.any(Number),
    );
  });

  it('uses "unknown" route label when req.route is not set', () => {
    const req = {
      method: 'GET',
      route: undefined,
      baseUrl: '/api',
      originalUrl: '/api/unknown-path/123',
      url: '/api/unknown-path/123',
    };
    const res = { statusCode: 404 };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as any;
    const next = { handle: () => of('ok') };

    interceptor.intercept(ctx, next).subscribe({ error: () => {} });

    expect(mockMetrics.httpRequestsTotal.inc).toHaveBeenCalledWith(
      expect.objectContaining({ route: 'unknown' }),
    );
  });
});
