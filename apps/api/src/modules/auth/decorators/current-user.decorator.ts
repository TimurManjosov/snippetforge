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
export const currentUserFactory = (
  data: keyof SafeUser | undefined,
  ctx: ExecutionContext,
) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = request.user as SafeUser | undefined;

  if (!user) {
    return undefined;
  }

  if (data) {
    return user[data];
  }

  return user;
};

export const CurrentUser = createParamDecorator(currentUserFactory);
