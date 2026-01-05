// src/modules/auth/guards/jwt-auth. guard.ts

import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JwtAuthGuard - Schützt Routes vor unauthentifizierten Zugriffen
 *
 * WIE ES FUNKTIONIERT:
 * 1. Guard wird auf Route/Controller angewendet
 * 2. canActivate() wird aufgerufen
 * 3. Prüft ob Route @Public() ist → Wenn ja, erlauben
 * 4. Wenn nicht public, delegiert an Passport JwtStrategy
 * 5. JwtStrategy validiert Token und lädt User
 * 6. Wenn erfolgreich:  request.user = User, Route wird ausgeführt
 * 7. Wenn fehlgeschlagen: 401 Unauthorized
 *
 * VERWENDUNG:
 *
 * // Auf einzelner Route
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile() {}
 *
 * // Global auf allen Routes (in main.ts)
 * app.useGlobalGuards(new JwtAuthGuard(reflector))
 *
 * // Route von Auth ausnehmen
 * @Public()
 * @Get('health')
 * healthCheck() {}
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * canActivate - Entscheidet ob Request durchgelassen wird
   *
   * @param context - Execution Context (enthält Request, Handler, etc.)
   * @returns true wenn erlaubt, false/Exception wenn nicht
   */
  canActivate(context: ExecutionContext) {
    // 1. Prüfe ob Route als @Public() markiert ist
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Methode (@Public() auf Methode)
      context.getClass(), // Controller (@Public() auf Controller)
    ]);

    // 2. Wenn public, sofort erlauben (keine Token-Prüfung)
    if (isPublic) {
      this.logger.debug('Public route accessed, skipping authentication');
      return true;
    }

    // 3. Wenn nicht public, Passport JWT Strategy ausführen
    return super.canActivate(context);
  }

  /**
   * handleRequest - Verarbeitet Passport-Ergebnis
   *
   * Wird nach JwtStrategy.validate() aufgerufen
   * Erlaubt uns, den Error/User zu customizen
   *
   * @param err - Error von Passport (null wenn erfolgreich)
   * @param user - User von JwtStrategy. validate() (undefined wenn fehlgeschlagen)
   * @param info - Zusätzliche Info (z.B. "jwt expired")
   * @returns User wenn erfolgreich
   * @throws UnauthorizedException wenn fehlgeschlagen
   */
  handleRequest<T>(err: Error | null, user: T, info: Error | undefined): T {
    // Passport Error (z.B. invalid signature)
    if (err) {
      this.logger.warn(`Authentication error: ${err.message}`);
      throw new UnauthorizedException('Authentication failed');
    }

    // Kein User (Token invalid/expired oder User nicht gefunden)
    if (!user) {
      const message =
        info?.message || 'Invalid or missing authentication token';
      this.logger.warn(`Authentication failed: ${message}`);
      throw new UnauthorizedException(message);
    }

    return user;
  }
}
