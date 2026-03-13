// src/shared/interceptors/http-logging.interceptor.ts

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AppLogger } from '../logging/app-logger';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly log = new AppLogger();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { requestId?: string; user?: { id: string } }>();
    const res = http.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - start;
          this.log.info(
            {
              requestId: req.requestId ?? null,
              method: req.method,
              path: req.originalUrl ?? req.url,
              statusCode: res.statusCode,
              durationMs,
              userId: req.user?.id ?? null,
            },
            'request.completed',
          );
        },
      }),
    );
  }
}
