// src/modules/metrics/metrics.interceptor.ts

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Extrahiert stabile Route-Templates für low-cardinality Metrics-Labels.
 * Nutzt req.route?.path (vom Express-Router) statt roher URLs mit IDs.
 *
 * Angewendete Regeln: P2 (Kardinality-Schutz - keine dynamischen Segmente als Labels).
 */
function getRouteTemplate(req: Request): string {
  const routePath = (req as any).route?.path;
  if (routePath) {
    const baseUrl = req.baseUrl ?? '';
    return `${baseUrl}${routePath}`;
  }
  return (req.originalUrl ?? req.url ?? '').split('?')[0];
}

/**
 * MetricsInterceptor - Erfasst HTTP-Metriken für alle Requests
 *
 * Global registriert via APP_INTERCEPTOR in MetricsModule.
 * Angewendete Regeln: P2 (low-cardinality Labels), C3 (Framework-Idiome via NestInterceptor).
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const method = req.method;
          const route = getRouteTemplate(req);
          const status = String(res.statusCode);

          this.metrics.httpRequestsTotal.inc({ method, route, status });
          this.metrics.httpRequestDurationMs.observe({ method, route, status }, duration);

          if (res.statusCode >= 400) {
            this.metrics.httpErrorsTotal.inc({ method, route, status });
          }
        },
        error: () => {
          const duration = Date.now() - start;
          const method = req.method;
          const route = getRouteTemplate(req);
          const status = String(res.statusCode || 500);

          this.metrics.httpRequestsTotal.inc({ method, route, status });
          this.metrics.httpRequestDurationMs.observe({ method, route, status }, duration);
          this.metrics.httpErrorsTotal.inc({ method, route, status });
        },
      }),
    );
  }
}
