// src/modules/health/health.module.ts

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ReadyController } from './ready.controller';
import { DatabaseService } from '../../shared/database';

/**
 * HealthModule - Liveness & Readiness Endpoints
 *
 * Angewendete Regeln: C2 (klare Trennung Liveness vs. Readiness).
 */
@Module({
  controllers: [HealthController, ReadyController],
  providers: [DatabaseService],
})
export class HealthModule {}
