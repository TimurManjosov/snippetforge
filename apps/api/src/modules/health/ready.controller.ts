// src/modules/health/ready.controller.ts

// E2E SMOKE (manual / integration test):
// - GET /api/live → 200, body enthält { status: 'ok', uptimeSeconds: <number> }
// - GET /api/ready → 200 wenn DB erreichbar, 503 wenn nicht
// - GET /api/metrics (METRICS_ENABLED=false) → 404
// - GET /api/metrics (METRICS_ENABLED=true, kein Token) → 200, Prometheus text format
// - GET /api/metrics (METRICS_ENABLED=true, falscher Token) → 401

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth';
import { DatabaseService } from '../../shared/database';

/**
 * ReadyController - Readiness Check (DB-Konnektivität)
 *
 * Prüft ob die Anwendung bereit ist, Requests zu verarbeiten.
 * Angewendete Regeln: P1 (exakt ein DB-Statement), C2 (nur DB-Check), C3 (ServiceUnavailableException).
 */
@ApiTags('Health')
@Controller()
export class ReadyController {
  constructor(private readonly db: DatabaseService) {}

  @Public()
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness check (DB connectivity)' })
  async ready() {
    try {
      await this.db.healthCheck();
      return {
        status: 'ok',
        checks: { db: 'ok' },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'fail',
        checks: { db: 'fail' },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
