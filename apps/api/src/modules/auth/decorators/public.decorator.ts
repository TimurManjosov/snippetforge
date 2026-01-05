// src/modules/auth/decorators/public.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata Key für @Public() Decorator
 * Wird von JwtAuthGuard gelesen
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() Decorator - Markiert Route als öffentlich (keine Auth nötig)
 *
 * WARUM brauchen wir das?
 * Wenn JwtAuthGuard global aktiv ist, sind ALLE Routes geschützt.
 * Manche Routes (Login, Register, Health) müssen aber öffentlich sein.
 *
 * VERWENDUNG:
 * @Public()
 * @Post('login')
 * login() {}
 *
 * @Public()
 * @Get('health')
 * healthCheck() {}
 *
 * WIE ES FUNKTIONIERT:
 * 1. SetMetadata speichert { isPublic: true } auf Route
 * 2. JwtAuthGuard liest Metadata via Reflector
 * 3. Wenn isPublic === true, wird Auth übersprungen
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
