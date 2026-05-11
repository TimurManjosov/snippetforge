// test/unit/modules/auth/jwt-module.config.spec.ts

import { ConfigService } from '@nestjs/config';
import {
  PLACEHOLDER_JWT_SECRET,
  buildJwtModuleOptions,
} from '../../../../src/modules/auth/jwt-module.config';

/**
 * Unit tests for the JWT_SECRET fail-fast validator.
 *
 * The validator lives in apps/api/src/modules/auth/jwt-module.config.ts and is
 * invoked from AuthModule.JwtModule.registerAsync's useFactory. These tests
 * exercise the validator directly with a mocked ConfigService — they do not
 * boot the Nest application.
 */
describe('buildJwtModuleOptions', () => {
  const createConfigService = (
    values: Record<string, string | undefined>,
  ): ConfigService =>
    ({
      get: jest.fn((key: string) => values[key]),
    }) as unknown as ConfigService;

  it('throws when JWT_SECRET is missing', () => {
    const config = createConfigService({
      JWT_SECRET: undefined,
      NODE_ENV: 'production',
    });

    expect(() => buildJwtModuleOptions(config)).toThrow(
      'JWT_SECRET is required',
    );
  });

  it('throws when JWT_SECRET is whitespace-only', () => {
    const config = createConfigService({
      JWT_SECRET: '   ',
      NODE_ENV: 'production',
    });

    expect(() => buildJwtModuleOptions(config)).toThrow(
      'JWT_SECRET is required',
    );
  });

  it('throws when JWT_SECRET is the placeholder and NODE_ENV is production', () => {
    const config = createConfigService({
      JWT_SECRET: PLACEHOLDER_JWT_SECRET,
      NODE_ENV: 'production',
    });

    expect(() => buildJwtModuleOptions(config)).toThrow(
      /placeholder.*production/,
    );
  });

  it('allows the placeholder when NODE_ENV is development', () => {
    const config = createConfigService({
      JWT_SECRET: PLACEHOLDER_JWT_SECRET,
      NODE_ENV: 'development',
      JWT_EXPIRES_IN: '15m',
    });

    const options = buildJwtModuleOptions(config);

    expect(options.secret).toBe(PLACEHOLDER_JWT_SECRET);
    expect(options.signOptions).toEqual({
      expiresIn: '15m',
      algorithm: 'HS256',
    });
  });

  it('returns options for a real secret in production', () => {
    const config = createConfigService({
      JWT_SECRET: 'a-long-random-production-secret-value',
      NODE_ENV: 'production',
      JWT_EXPIRES_IN: '1h',
    });

    const options = buildJwtModuleOptions(config);

    expect(options.secret).toBe('a-long-random-production-secret-value');
    expect(options.signOptions).toEqual({
      expiresIn: '1h',
      algorithm: 'HS256',
    });
  });

  it('falls back to 900s expiry when JWT_EXPIRES_IN is unset', () => {
    const config = createConfigService({
      JWT_SECRET: 'a-long-random-secret',
      NODE_ENV: 'development',
    });

    const options = buildJwtModuleOptions(config);

    expect(options.signOptions).toEqual({
      expiresIn: '900s',
      algorithm: 'HS256',
    });
  });

  it('treats unset NODE_ENV as development (placeholder allowed)', () => {
    const config = createConfigService({
      JWT_SECRET: PLACEHOLDER_JWT_SECRET,
      NODE_ENV: undefined,
    });

    expect(() => buildJwtModuleOptions(config)).not.toThrow();
  });
});
