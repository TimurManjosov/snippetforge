// src/modules/metrics/metrics.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { METRICS_ENABLED_ENV, METRICS_TOKEN_ENV } from './metrics.constants';

/**
 * MetricsGuard - Schützt den /metrics Endpoint
 *
 * Logik:
 * 1. METRICS_ENABLED !== 'true' → 404
 * 2. Kein METRICS_TOKEN gesetzt → frei zugänglich
 * 3. Token gesetzt → Bearer-Auth erforderlich
 *
 * Angewendete Regeln: C1 (Env-Keys via Konstanten), C3 (NestJS-Exceptions statt manuelles res.status).
 */
@Injectable()
export class MetricsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const enabled = process.env[METRICS_ENABLED_ENV];
    if (enabled !== 'true') {
      throw new NotFoundException();
    }

    const token = process.env[METRICS_TOKEN_ENV];
    if (!token) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (authHeader !== `Bearer ${token}`) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
