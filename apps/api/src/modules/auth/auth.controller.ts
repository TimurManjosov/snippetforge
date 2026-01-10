// src/modules/auth/auth.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../shared/pipes';
import { type SafeUser } from '../users';
import { AuthService } from './auth.service';
import { type AuthResponse } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import * as loginDto from './dto/login.dto';
import * as registerDto from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * AuthController - HTTP Endpoints für Authentication
 *
 * ENDPOINTS:
 * - POST /api/auth/register - Neuen User registrieren
 * - POST /api/auth/login    - User einloggen
 * - GET  /api/auth/me       - Aktuellen User abrufen (geschützt)
 *
 * ROUTE PREFIX: /auth (definiert in @Controller)
 * GLOBAL PREFIX: /api (definiert in main.ts)
 * → Vollständiger Pfad: /api/auth/...
 *
 * VALIDATION:
 * Alle Inputs werden mit Zod Schemas validiert (ZodValidationPipe)
 *
 * AUTHORIZATION:
 * - register, login:  @Public() (keine Auth nötig)
 * - me: JwtAuthGuard (Token erforderlich)
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   *
   * Registriert neuen User und gibt Tokens zurück.
   * User ist sofort eingeloggt (kein separater Login nötig).
   *
   * REQUEST BODY:
   * {
   *   "email": "user@example.com",
   *   "username": "johndoe",
   *   "password": "SecurePass123"
   * }
   *
   * RESPONSE (201 Created):
   * {
   *   "user": { "id": "...", "email": "...", ... },
   *   "tokens": { "accessToken": "...", "tokenType": "Bearer", "expiresIn": 900 }
   * }
   *
   * ERRORS:
   * - 400 Bad Request: Validation Error
   * - 409 Conflict: Email/Username already exists
   */
  @Public() // Keine Auth nötig für Registration
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // 201 statt default 200
  async register(
    @Body(new ZodValidationPipe(registerDto.RegisterSchema))
    dto: registerDto.RegisterDto,
  ): Promise<AuthResponse> {
    this.logger.debug(`Register request for: ${dto.email}`);
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login
   *
   * Loggt User ein und gibt Tokens zurück.
   *
   * REQUEST BODY:
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePass123"
   * }
   *
   * RESPONSE (200 OK):
   * {
   *   "user": { "id": "...", "email": "...", ... },
   *   "tokens": { "accessToken": "...", "tokenType": "Bearer", "expiresIn": 900 }
   * }
   *
   * ERRORS:
   * - 400 Bad Request: Validation Error
   * - 401 Unauthorized: Invalid credentials
   */
  @Public() // Keine Auth nötig für Login
  @Post('login')
  @HttpCode(HttpStatus.OK) // 200 (nicht 201, da nichts erstellt wird)
  async login(
    @Body(new ZodValidationPipe(loginDto.LoginSchema)) dto: loginDto.LoginDto,
  ): Promise<AuthResponse> {
    this.logger.debug(`Login request for: ${dto.email}`);
    return this.authService.login(dto);
  }

  /**
   * GET /api/auth/me
   *
   * Gibt aktuellen User zurück (aus JWT Token).
   * Erfordert gültigen Bearer Token.
   *
   * HEADERS:
   * Authorization: Bearer <token>
   *
   * RESPONSE (200 OK):
   * {
   *   "id": "uuid",
   *   "email": "user@example.com",
   *   "username": "johndoe",
   *   "bio": null,
   *   "avatarUrl": null,
   *   "role": "USER",
   *   "createdAt": "2026-01-04T...",
   *   "updatedAt": "2026-01-04T..."
   * }
   *
   * ERRORS:
   * - 401 Unauthorized: Missing/Invalid token
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getMe(@CurrentUser() user: SafeUser): SafeUser {
    this.logger.debug(`Get profile for user: ${user.id}`);
    // User kommt direkt aus Token (via JwtAuthGuard + CurrentUser Decorator)
    // Kein zusätzlicher DB-Call nötig (JwtStrategy hat bereits User geladen)
    return user;
  }
}
