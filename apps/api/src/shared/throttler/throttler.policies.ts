import { Throttle } from '@nestjs/throttler';
import { loadThrottlerEnvConfig } from './throttler.config';

/**
 * Per-route throttle overrides, expressed as decorators.
 *
 * Use them on controller methods that need tighter limits than the global
 * default — e.g. credential-bearing endpoints or write-heavy public paths.
 *
 *   @ThrottleAuth()
 *   @Post('login')
 *   ...
 *
 *   @ThrottleWrite()
 *   @Post(':id/reactions')
 *   ...
 *
 * The actual values are read from environment variables at module evaluation
 * time, in lockstep with the global throttler configuration.
 */

const envConfig = loadThrottlerEnvConfig();

/** Credential-bearing endpoints (login, register, password reset). */
export const ThrottleAuth = (): MethodDecorator =>
  Throttle({
    default: { ttl: envConfig.authTtlMs, limit: envConfig.authLimit },
  });

/** Write-heavy authenticated endpoints (comments, reactions, flags). */
export const ThrottleWrite = (): MethodDecorator =>
  Throttle({
    default: { ttl: envConfig.writeTtlMs, limit: envConfig.writeLimit },
  });
