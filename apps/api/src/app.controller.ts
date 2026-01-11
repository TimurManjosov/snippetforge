// src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/auth';
import { HealthCheckResponseSchema } from './shared/swagger';

/**
 * AppController - Root und Health Check Endpoints
 *
 * Diese Endpoints sind öffentlich (@Public) und
 * benötigen keine Authentifizierung.
 */
@ApiTags('Health')
@Controller()
@Public()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ============================================================
  // GET /api
  // ============================================================

  @Get()
  @ApiExcludeEndpoint() // Nicht in Swagger anzeigen
  getHello(): string {
    return this.appService.getHello();
  }

  // ============================================================
  // GET /api/health
  // ============================================================

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: `
Returns the health status of the API.
Use this endpoint for:
- Kubernetes liveness/readiness probes
- Load balancer health checks
- Monitoring systems
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthCheckResponseSchema,
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'snippetforge-api',
      version: process.env.API_VERSION || '0.1.0',
    };
  }
}
