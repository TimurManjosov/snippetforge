// src/modules/health/health.module.ts

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ReadyController } from './ready.controller';

/**
 * HealthModule - Liveness & Readiness Endpoints
 *
 * DatabaseService wird global durch DatabaseModule (@Global) bereitgestellt
 * und muss hier nicht erneut deklariert werden.
 * Angewendete Regeln: C2 (klare Trennung Liveness vs. Readiness).
 */
@Module({
  controllers: [HealthController, ReadyController],
})
export class HealthModule {}
