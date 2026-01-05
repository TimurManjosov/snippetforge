// src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/auth';

/**
 * AppController - Basis-Controller für Health Check
 *
 * @Public() auf Controller-Ebene:
 * Alle Routes in diesem Controller sind öffentlich
 */
@Controller()
@Public() // Alle Routes hier sind öffentlich
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /api
   * Health Check / Welcome Message
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * GET /api/health
   * Detaillierter Health Check (für Monitoring)
   */
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'snippetforge-api',
      version: '0.1.0',
    };
  }
}
