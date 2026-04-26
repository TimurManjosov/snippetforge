// src/shared/middleware/request-id.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import {
  REQUEST_ID_HEADER,
  REQUEST_ID_MAX_LEN,
  REQUEST_ID_RESPONSE_HEADER,
  REQUEST_ID_SAFE_PATTERN,
} from '../constants';

/**
 * Validates and sanitises an incoming request-id value.
 *
 * @returns the trimmed value when it passes all checks, otherwise `null`.
 */
export function sanitizeRequestId(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > REQUEST_ID_MAX_LEN) return null;
  if (!REQUEST_ID_SAFE_PATTERN.test(trimmed)) return null;
  return trimmed;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    req: Request & { requestId?: string },
    res: Response,
    next: NextFunction,
  ): void {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const requestId = sanitizeRequestId(incoming) ?? randomUUID();

    req.requestId = requestId;
    res.setHeader(REQUEST_ID_RESPONSE_HEADER, requestId);
    next();
  }
}
