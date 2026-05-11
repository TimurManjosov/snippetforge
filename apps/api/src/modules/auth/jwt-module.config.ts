// src/modules/auth/jwt-module.config.ts

import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';

/**
 * Placeholder value shipped in `apps/api/.env.example`.
 * The API refuses to start in production when JWT_SECRET still equals this.
 */
export const PLACEHOLDER_JWT_SECRET = 'change_me_in_production';

/**
 * Builds JwtModule options and fail-fast validates JWT_SECRET.
 *
 * Rules:
 * - Missing or empty JWT_SECRET -> throw in every environment.
 * - JWT_SECRET equal to the .env.example placeholder -> throw when
 *   NODE_ENV === 'production'. Allowed in development and test so that
 *   first-time setups and the existing jest.setup.ts continue to work.
 *
 * Mirrors the validation style of
 * apps/api/src/shared/database/database.service.ts (logger.error + throw).
 */
export const buildJwtModuleOptions = (
  configService: ConfigService,
): JwtModuleOptions => {
  const logger = new Logger('JwtModuleOptions');
  const secret = configService.get<string>('JWT_SECRET');
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

  if (!secret || secret.trim().length === 0) {
    logger.error('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT_SECRET is required');
  }

  if (secret === PLACEHOLDER_JWT_SECRET && nodeEnv === 'production') {
    logger.error(
      'JWT_SECRET is still set to the .env.example placeholder. Refusing to start in production.',
    );
    throw new Error(
      'JWT_SECRET must be changed from the default placeholder in production',
    );
  }

  const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') ||
    '900s') as StringValue;

  return {
    secret,
    signOptions: {
      expiresIn,
      algorithm: 'HS256' as const,
    },
  };
};
