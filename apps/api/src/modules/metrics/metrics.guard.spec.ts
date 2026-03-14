import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MetricsGuard } from './metrics.guard';
import { METRICS_ENABLED_ENV, METRICS_TOKEN_ENV } from './metrics.constants';

function createMockContext(authHeader?: string) {
  const req = { headers: { authorization: authHeader } };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as any;
}

describe('MetricsGuard', () => {
  let guard: MetricsGuard;
  const originalEnv = process.env;

  beforeEach(() => {
    guard = new MetricsGuard();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws NotFoundException when METRICS_ENABLED is not true', () => {
    process.env[METRICS_ENABLED_ENV] = 'false';

    expect(() => guard.canActivate(createMockContext())).toThrow(
      NotFoundException,
    );
  });

  it('returns true when METRICS_ENABLED=true and no METRICS_TOKEN set', () => {
    process.env[METRICS_ENABLED_ENV] = 'true';
    delete process.env[METRICS_TOKEN_ENV];

    expect(guard.canActivate(createMockContext())).toBe(true);
  });

  it('returns true when token is set and correct Bearer header provided', () => {
    process.env[METRICS_ENABLED_ENV] = 'true';
    process.env[METRICS_TOKEN_ENV] = 'secret-token';

    const ctx = createMockContext('Bearer secret-token');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws UnauthorizedException when token is set but header is wrong', () => {
    process.env[METRICS_ENABLED_ENV] = 'true';
    process.env[METRICS_TOKEN_ENV] = 'secret-token';

    const ctx = createMockContext('Bearer wrong-token');
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
