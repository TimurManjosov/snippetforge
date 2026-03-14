// src/modules/metrics/metrics.controller.ts

import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth';
import { MetricsGuard } from './metrics.guard';
import { MetricsService } from './metrics.service';

/**
 * MetricsController - Prometheus-kompatibler Metrics Endpoint
 *
 * Verwendet @Res() statt @Header() da der Content-Type dynamisch
 * aus prom-client kommt (text/plain; version=0.0.4; charset=utf-8).
 * @Header() erlaubt nur statische Werte zur Compile-Zeit.
 *
 * Angewendete Regeln: P3 (Content-Type direkt von prom-client), C3 (Guard statt manuellem Auth).
 */
@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get('metrics')
  @UseGuards(MetricsGuard)
  @ApiExcludeEndpoint()
  async metricsText(@Res() res: Response): Promise<void> {
    const text = await this.metrics.metricsText();
    res.setHeader('Content-Type', this.metrics.contentType());
    res.send(text);
  }
}
