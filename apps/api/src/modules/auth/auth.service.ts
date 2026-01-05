// src/modules/auth/auth.service.ts

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService, type SafeUser } from '../users';
import {
  type AuthResponse,
  type JwtPayload,
  type TokenResponse,
} from './auth.types';
import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';

/**
 * AuthService - Zentrale Authentifizierungs-Logik
 *
 * VERANTWORTLICHKEITEN:
 * - User Registration (delegiert an UsersService)
 * - User Login (Credential-Validierung + Token-Generierung)
 * - Token-Generierung (JWT)
 *
 * WAS HIER NICHT PASSIERT:
 * - Password Hashing (→ UsersService)
 * - User CRUD (→ UsersService)
 * - Token-Validierung (→ JwtStrategy)
 * - HTTP Concerns (→ AuthController)
 *
 * SECURITY CONSIDERATIONS:
 * - Keine User Enumeration bei Login
 * - Timing-Safe Password Comparison (in UsersService)
 * - Minimaler JWT Payload
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Token Expiration in Sekunden (aus Config oder Default 15 Minuten)
  private readonly accessTokenExpiresIn: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Parse JWT_EXPIRES_IN (z.B. "15m", "1h", "7d")
    const expiresInString =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    this.accessTokenExpiresIn = this.parseExpiresIn(expiresInString);
  }

  // ============================================================
  // PUBLIC METHODS
  // ============================================================

  /**
   * Register - Erstellt neuen User und gibt Tokens zurück
   *
   * @param dto - RegisterDto (email, username, password)
   * @returns AuthResponse (user + tokens)
   * @throws ConflictException wenn Email/Username existiert (von UsersService)
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    this.logger.debug(`Registering new user: ${dto.email}`);

    // 1. User erstellen (UsersService handled Hashing + Duplicate Check)
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      password: dto.password,
    });

    // 2. Tokens generieren
    const tokens = await this.generateTokens(user);

    this.logger.log(`User registered successfully: ${user.id}`);

    return {
      user,
      tokens,
    };
  }

  /**
   * Login - Validiert Credentials und gibt Tokens zurück
   *
   * SECURITY:
   * - Gleiche Fehlermeldung bei "Email nicht gefunden" und "Passwort falsch"
   * - Verhindert User Enumeration
   *
   * @param dto - LoginDto (email, password)
   * @returns AuthResponse (user + tokens)
   * @throws UnauthorizedException bei ungültigen Credentials
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    this.logger.debug(`Login attempt for: ${dto.email}`);

    // 1. Credentials validieren (UsersService macht Timing-Safe Comparison)
    const user = await this.usersService.validateCredentials(
      dto.email,
      dto.password,
    );

    // 2. Wenn null → Credentials ungültig
    if (!user) {
      this.logger.warn(`Failed login attempt for: ${dto.email}`);
      // SECURITY: Gleiche Message für alle Fehler!
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Tokens generieren
    const tokens = await this.generateTokens(user);

    this.logger.log(`User logged in successfully: ${user.id}`);

    return {
      user,
      tokens,
    };
  }

  /**
   * ValidateUserById - Lädt User für Token-Refresh
   *
   * @param userId - UUID des Users
   * @returns SafeUser
   * @throws NotFoundException wenn User nicht existiert
   */
  async validateUserById(userId: string): Promise<SafeUser> {
    return this.usersService.findById(userId);
  }

  /**
   * GetCurrentUser - Alias für findById (für Controller-Klarheit)
   */
  async getCurrentUser(userId: string): Promise<SafeUser> {
    return this.usersService.findById(userId);
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Generiert JWT Access Token
   *
   * @param user - SafeUser für Payload
   * @returns TokenResponse
   */
  private async generateTokens(user: SafeUser): Promise<TokenResponse> {
    // JWT Payload (minimale Daten!)
    const payload: JwtPayload = {
      sub: user.id, // Standard JWT Claim für Subject (User ID)
      email: user.email, // Für schnellen Lookup
      role: user.role, // Für Authorization ohne DB-Query
    };

    // Token signieren
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiresIn,
    };
  }

  /**
   * Parsed JWT_EXPIRES_IN String zu Sekunden
   *
   * Unterstützte Formate:
   * - "15m" → 900 (15 Minuten)
   * - "1h" → 3600 (1 Stunde)
   * - "7d" → 604800 (7 Tage)
   * - "3600" → 3600 (direkt Sekunden)
   */
  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)(s|m|h|d)?$/);

    if (!match) {
      this.logger.warn(
        `Invalid JWT_EXPIRES_IN format: ${value}, using default 15m`,
      );
      return 900; // Default:  15 Minuten
    }

    const num = parseInt(match[1], 10);
    const unit = match[2] || 's';

    switch (unit) {
      case 's':
        return num;
      case 'm':
        return num * 60;
      case 'h':
        return num * 60 * 60;
      case 'd':
        return num * 60 * 60 * 24;
      default:
        return num;
    }
  }
}
