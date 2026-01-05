// src/modules/auth/strategies/jwt. strategy.ts

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService, type SafeUser } from '../../users';
import { type JwtPayload } from '../auth.types';

/**
 * JwtStrategy - Validiert JWT Tokens bei geschützten Routes
 *
 * WIE ES FUNKTIONIERT:
 * 1. Request kommt rein mit Authorization:  Bearer <token>
 * 2. JwtAuthGuard aktiviert diese Strategy
 * 3. passport-jwt extrahiert Token aus Header
 * 4. passport-jwt verifiziert Signatur mit Secret
 * 5. validate() wird mit decoded Payload aufgerufen
 * 6. validate() lädt User aus DB und gibt ihn zurück
 * 7. User wird an request.user angehängt
 *
 * WARUM User aus DB laden statt nur Payload nutzen?
 * - User könnte gelöscht/deaktiviert worden sein
 * - User-Rolle könnte sich geändert haben
 * - Wir brauchen aktuelle User-Daten
 *
 * ALTERNATIVE:  Nur Payload nutzen (ohne DB-Query)
 * Pro: Schneller (kein DB-Roundtrip)
 * Contra: Veraltete Daten möglich
 * Entscheidung: DB-Query für Sicherheit (bei jedem Request)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    // Passport Strategy Konfiguration
    super({
      // Wo ist der Token?  → Authorization Header als Bearer Token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Abgelaufene Tokens ablehnen?
      ignoreExpiration: false,

      // Secret für Signatur-Validierung
      secretOrKey: configService.get<string>('JWT_SECRET') || '',

      // Algorithms die akzeptiert werden
      algorithms: ['HS256'],
    });
  }

  /**
   * Validate - Wird nach erfolgreicher Token-Verifikation aufgerufen
   *
   * WICHTIG: Wenn diese Methode einen Wert zurückgibt,
   * wird dieser an request.user angehängt.
   * Wenn sie eine Exception wirft, wird 401 zurückgegeben.
   *
   * @param payload - Decoded JWT Payload (bereits verifiziert!)
   * @returns SafeUser für request.user
   * @throws UnauthorizedException wenn User nicht existiert
   */
  async validate(payload: JwtPayload): Promise<SafeUser> {
    this.logger.debug(`Validating JWT for user: ${payload.sub}`);

    // User aus DB laden (aktuelle Daten!)
    // Wir nutzen try-catch weil findById eine Exception wirft wenn nicht gefunden
    try {
      const user = await this.usersService.findById(payload.sub);

      this.logger.debug(`JWT validated for user: ${user.email}`);
      return user;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // User nicht gefunden (gelöscht?)
      this.logger.warn(`JWT validation failed:  User ${payload.sub} not found`);
      throw new UnauthorizedException('User not found or has been deleted');
    }
  }
}
