// src/modules/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { type SafeUser } from '../../users';

/**
 * @CurrentUser() Decorator - Injiziert aktuellen User in Controller-Methode
 *
 * WARUM als Decorator statt request.user?
 * 1. Typsicherheit:  Decorator gibt SafeUser zurück, nicht any
 * 2. Clean Code: Controller-Methode zeigt klar welche Daten sie braucht
 * 3. Testbar: Decorator kann gemockt werden
 *
 * VERWENDUNG:
 * @Get('me')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: SafeUser) {
 *   return user
 * }
 *
 * // Mit Property-Zugriff
 * @Get('my-email')
 * @UseGuards(JwtAuthGuard)
 * getEmail(@CurrentUser('email') email: string) {
 *   return { email }
 * }
 *
 * VORAUSSETZUNG: JwtAuthGuard muss aktiv sein!
 * Sonst ist request.user undefined
 */
export const CurrentUser = createParamDecorator(
  /**
   * @param data - Optionaler Property-Name (z.B. 'email', 'id')
   * @param ctx - Execution Context
   * @returns User oder User-Property
   */
  (data: keyof SafeUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as SafeUser | undefined;

    // Wenn kein User (Guard nicht aktiv?), undefined zurückgeben
    if (!user) {
      return undefined;
    }

    // Wenn Property angefragt, nur diese zurückgeben
    if (data) {
      return user[data];
    }

    // Sonst ganzen User zurückgeben
    return user;
  },
);
