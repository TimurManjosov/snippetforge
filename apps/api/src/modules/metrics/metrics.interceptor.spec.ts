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

  it('increments httpRequestsTotal and observes duration on success (200)', (done) => {
    const ctx = createMockContext(200);
    const next = { handle: () => of('response') };

    interceptor.intercept(ctx, next).subscribe({
      complete: () => {
        expect(mockMetrics.httpRequestsTotal.inc).toHaveBeenCalledWith(
          expect.objectContaining({ method: 'GET', route: '/api/test', status: '200' }),
        );
        expect(mockMetrics.httpRequestDurationMs.observe).toHaveBeenCalled();
        expect(mockMetrics.httpErrorsTotal.inc).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('increments httpRequestsTotal and httpErrorsTotal on error (500)', (done) => {
    const ctx = createMockContext(500);
    const next = { handle: () => throwError(() => new Error('Internal')) };

    interceptor.intercept(ctx, next).subscribe({
      error: () => {
        expect(mockMetrics.httpRequestsTotal.inc).toHaveBeenCalledWith(
          expect.objectContaining({ method: 'GET', status: '500' }),
        );
        expect(mockMetrics.httpErrorsTotal.inc).toHaveBeenCalledWith(
          expect.objectContaining({ method: 'GET', status: '500' }),
        );
        expect(mockMetrics.httpRequestDurationMs.observe).toHaveBeenCalled();
        done();
      },
    });
  });

  it('observes httpRequestDurationMs in both success and error cases', (done) => {
    const ctx = createMockContext(200);
    const next = { handle: () => of('ok') };

    interceptor.intercept(ctx, next).subscribe({
      complete: () => {
        expect(mockMetrics.httpRequestDurationMs.observe).toHaveBeenCalledWith(
          expect.objectContaining({ method: 'GET', route: '/api/test', status: '200' }),
          expect.any(Number),
        );
        done();
      },
    });
  });
});
