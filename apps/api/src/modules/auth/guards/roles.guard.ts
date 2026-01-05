// src/modules/auth/guards/roles.guard.ts

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { type SafeUser } from '../../users';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard - Role-Based Access Control (RBAC)
 *
 * WIE ES FUNKTIONIERT:
 * 1. Route ist mit @Roles('ADMIN', 'MODERATOR') dekoriert
 * 2. User ist bereits authentifiziert (JwtAuthGuard lief vorher)
 * 3. RolesGuard prüft ob user.role in erlaubten Rollen ist
 * 4. Wenn ja: Route wird ausgeführt
 * 5. Wenn nein: 403 Forbidden
 *
 * WICHTIG: RolesGuard muss NACH JwtAuthGuard kommen!
 * @UseGuards(JwtAuthGuard, RolesGuard) ← Richtige Reihenfolge
 *
 * VERWENDUNG:
 * @Roles('ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete('users/:id')
 * deleteUser() {}
 *
 * @Roles('ADMIN', 'MODERATOR')  // Einer von beiden reicht
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Put('posts/:id/moderate')
 * moderatePost() {}
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  /**
   * canActivate - Prüft ob User die erforderliche Rolle hat
   *
   * @param context - Execution Context
   * @returns true wenn erlaubt
   * @throws ForbiddenException wenn Rolle nicht ausreicht
   */
  canActivate(context: ExecutionContext): boolean {
    // 1. Hole erlaubte Rollen von Route/Controller
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Wenn keine Rollen definiert, alle erlauben
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Hole User aus Request (wurde von JwtAuthGuard gesetzt)
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as SafeUser | undefined;

    // 4. Defensive Check: User sollte existieren (JwtAuthGuard lief vorher)
    if (!user) {
      this.logger.error(
        'RolesGuard: No user found in request. JwtAuthGuard missing?',
      );
      throw new ForbiddenException('Authentication required');
    }

    // 5. Prüfe ob User-Rolle in erlaubten Rollen ist
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      this.logger.warn(
        `Access denied: User ${user.id} with role ${user.role} ` +
          `tried to access route requiring ${requiredRoles.join(' or ')}`,
      );
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    this.logger.debug(`Access granted: User ${user.id} with role ${user.role}`);
    return true;
  }
}
