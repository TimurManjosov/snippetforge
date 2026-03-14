// src/modules/metrics/metrics.service.ts

import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

/**
 * MetricsService - Prometheus Metrics Collection
 *
 * Stellt drei HTTP-Metriken bereit (Counter + Histogram) und sammelt Node.js Default Metrics.
 * Angewendete Regeln: P2 (low-cardinality Labels), P3 (direktes Delegieren an prom-client Registry).
 */
@Injectable()
export class MetricsService {
  readonly httpRequestsTotal: client.Counter<string>;
  readonly httpErrorsTotal: client.Counter<string>;
  readonly httpRequestDurationMs: client.Histogram<string>;

  constructor() {
    client.collectDefaultMetrics({ prefix: 'node_' });

    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    this.httpErrorsTotal = new client.Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP error responses (4xx/5xx)',
      labelNames: ['method', 'route', 'status'],
    });

    this.httpRequestDurationMs = new client.Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in ms',
      labelNames: ['method', 'route', 'status'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
    });
  }

  async metricsText(): Promise<string> {
    return client.register.metrics();
  }

  contentType(): string {
    return client.register.contentType;
  }
}
