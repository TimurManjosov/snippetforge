// src/modules/health/health.controller.ts

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth';

/**
 * HealthController - Liveness Check
 *
 * Prüft ob der Prozess läuft. Keine DB-Abhängigkeit.
 * Angewendete Regeln: C2 (Single Responsibility - nur Prozess-Liveness), P1 (kein DB-Zugriff).
 */
@ApiTags('Health')
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness check' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
