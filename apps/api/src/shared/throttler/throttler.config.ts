import { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Throttler configuration sourced from environment variables.
 *
 * A single global "default" policy is registered here. Stricter per-route
 * limits (auth, write paths) are applied via `@Throttle()` overrides — see
 * `throttler.policies.ts`.
 *
 * Defaults assume a single-node deployment with the API behind a load
 * balancer that forwards the real client IP. For a multi-node deployment a
 * shared storage backend (e.g. Redis) should be plugged in via `storage`.
 */

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface ThrottlerEnvConfig {
  defaultTtlMs: number;
  defaultLimit: number;
  authTtlMs: number;
  authLimit: number;
  writeTtlMs: number;
  writeLimit: number;
}

export function loadThrottlerEnvConfig(): ThrottlerEnvConfig {
  return {
    defaultTtlMs: readPositiveInt('THROTTLE_DEFAULT_TTL_MS', 60_000),
    defaultLimit: readPositiveInt('THROTTLE_DEFAULT_LIMIT', 120),
    authTtlMs: readPositiveInt('THROTTLE_AUTH_TTL_MS', 60_000),
    authLimit: readPositiveInt('THROTTLE_AUTH_LIMIT', 5),
    writeTtlMs: readPositiveInt('THROTTLE_WRITE_TTL_MS', 60_000),
    writeLimit: readPositiveInt('THROTTLE_WRITE_LIMIT', 30),
  };
}

export function createThrottlerOptions(): ThrottlerModuleOptions {
  const { defaultTtlMs, defaultLimit } = loadThrottlerEnvConfig();

  return {
    throttlers: [
      {
        name: 'default',
        ttl: defaultTtlMs,
        limit: defaultLimit,
      },
    ],
  };
}
