// src/shared/filters/global-http-exception.filter.ts

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logging/app-logger';

/**
 * GlobalHttpExceptionFilter – catches every thrown exception, enriches the
 * response body with `requestId`, and emits a structured `request.error` log.
 *
 * This filter is registered globally via `app.useGlobalFilters()` and is
 * intended to work alongside the {@link RequestIdMiddleware} which populates
 * `req.requestId`.
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly log = new AppLogger();

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { requestId?: string; user?: { id: string } }>();
    const res = ctx.getResponse<Response>();

    const requestId = req.requestId ?? null;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorBody =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    // Structured error log – never includes auth headers, cookies, or bodies.
    this.log.error(
      {
        requestId,
        method: req.method,
        path: req.originalUrl ?? req.url,
        statusCode: status,
        userId: req.user?.id ?? null,
        exceptionName: (exception as Record<string, unknown>)?.name ?? null,
        exceptionMessage: (exception as Record<string, unknown>)?.message ?? null,
        stack: (exception as Record<string, unknown>)?.stack ?? null,
      },
      'request.error',
    );

    const body =
      typeof errorBody === 'string'
        ? { requestId, message: errorBody }
        : { requestId, ...(errorBody as object) };

    res.status(status).json(body);
  }
}
