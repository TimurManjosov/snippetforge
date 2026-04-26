// src/modules/metrics/metrics.interceptor.ts

import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Extrahiert stabile Route-Templates für low-cardinality Metrics-Labels.
 * Nutzt req.route?.path (vom Express-Router) statt roher URLs mit IDs.
 * Gibt 'unknown' zurück wenn keine Route verfügbar (z.B. bei 404s / Pre-Routing-Fehlern),
 * um Cardinality-Explosion durch dynamische Segmente zu verhindern.
 *
 * Angewendete Regeln: P2 (Kardinality-Schutz - keine dynamischen Segmente als Labels).
 */
function getRouteTemplate(req: Request): string {
  const routePath = (req as any).route?.path;
  if (routePath) {
    const baseUrl = req.baseUrl ?? '';
    return `${baseUrl}${routePath}`;
  }
  return 'unknown';
}

/**
 * MetricsInterceptor - Erfasst HTTP-Metriken für alle Requests
 *
 * Verwendet finalize() um Metriken exakt einmal pro Request zu erfassen,
 * unabhängig davon wie viele Werte die Observable emittiert.
 * Der HTTP-Status wird bei Fehlern aus HttpException.getStatus() abgeleitet
 * statt aus res.statusCode (welches bei Fehlern oft noch 200 ist).
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
    let statusCode = 200;
    let isError = false;

    return next.handle().pipe(
      tap({
        next: () => {
          statusCode = res.statusCode;
        },
        error: (err: unknown) => {
          isError = true;
          statusCode = err instanceof HttpException ? err.getStatus() : 500;
        },
      }),
      finalize(() => {
        const duration = Date.now() - start;
        const method = req.method;
        const route = getRouteTemplate(req);
        const status = String(statusCode);

        this.metrics.httpRequestsTotal.inc({ method, route, status });
        this.metrics.httpRequestDurationMs.observe(
          { method, route, status },
          duration,
        );

        if (isError || statusCode >= 400) {
          this.metrics.httpErrorsTotal.inc({ method, route, status });
        }
      }),
    );
  }
}
