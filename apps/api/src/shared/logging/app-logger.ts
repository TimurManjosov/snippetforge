// src/shared/logging/app-logger.ts

import { Logger } from '@nestjs/common';

/**
 * Structured application logger that wraps the built-in NestJS {@link Logger}.
 *
 * Each log entry is serialised as a single JSON line containing `level`, `msg`,
 * and every field from the provided `obj` parameter.
 *
 * **NEVER include in log objects:**
 * - Authorization / Cookie headers
 * - Request bodies of auth routes (passwords)
 * - Full request bodies (privacy)
 */
export class AppLogger {
  private readonly logger = new Logger('App');

  private serialize(
    obj: Record<string, unknown>,
    level: string,
    msg?: string,
  ): string {
    try {
      return JSON.stringify({ level, msg, ...obj });
    } catch {
      return JSON.stringify({
        level,
        msg,
        serializationError: 'Object could not be serialized',
      });
    }
  }

  info(obj: Record<string, unknown>, msg?: string): void {
    this.logger.log(this.serialize(obj, 'info', msg));
  }

  warn(obj: Record<string, unknown>, msg?: string): void {
    this.logger.warn(this.serialize(obj, 'warn', msg));
  }

  error(obj: Record<string, unknown>, msg?: string): void {
    this.logger.error(this.serialize(obj, 'error', msg));
  }
}
