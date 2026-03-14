// src/modules/metrics/metrics.module.ts

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsController } from './metrics.controller';
import { MetricsGuard } from './metrics.guard';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

/**
 * MetricsModule - Prometheus Metrics Collection & Endpoint
 *
 * APP_INTERCEPTOR macht MetricsInterceptor automatisch global.
 * Angewendete Regeln: C3 (Framework-Idiom APP_INTERCEPTOR statt app.useGlobalInterceptors).
 */
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    MetricsGuard,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
