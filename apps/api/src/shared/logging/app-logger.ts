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

  info(obj: Record<string, unknown>, msg?: string): void {
    this.logger.log(JSON.stringify({ level: 'info', msg, ...obj }));
  }

  warn(obj: Record<string, unknown>, msg?: string): void {
    this.logger.warn(JSON.stringify({ level: 'warn', msg, ...obj }));
  }

  error(obj: Record<string, unknown>, msg?: string): void {
    this.logger.error(JSON.stringify({ level: 'error', msg, ...obj }));
  }
}
