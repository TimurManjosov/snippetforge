// src/modules/metrics/metrics.service.ts

import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

/**
 * MetricsService - Prometheus Metrics Collection
 *
 * Verwendet eine dedizierte Registry-Instanz, um "metric already registered"-Fehler
 * zu vermeiden, wenn die Nest-App mehrfach im selben Prozess erstellt wird
 * (z.B. bei Jest-Runs oder Hot-Reload).
 * Angewendete Regeln: P2 (low-cardinality Labels), P3 (direktes Delegieren an prom-client Registry).
 */
@Injectable()
export class MetricsService {
  readonly registry: client.Registry;
  readonly httpRequestsTotal: client.Counter<string>;
  readonly httpErrorsTotal: client.Counter<string>;
  readonly httpRequestDurationMs: client.Histogram<string>;

  constructor() {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry, prefix: 'node_' });

    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpErrorsTotal = new client.Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP error responses (4xx/5xx)',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDurationMs = new client.Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in ms',
      labelNames: ['method', 'route', 'status'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
      registers: [this.registry],
    });
  }

  async metricsText(): Promise<string> {
    return this.registry.metrics();
  }

  contentType(): string {
    return this.registry.contentType;
  }
}
