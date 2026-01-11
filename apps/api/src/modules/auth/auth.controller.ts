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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from '../../shared/pipes';
import {
  AuthResponseSchema,
  ConflictErrorResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  UnauthorizedErrorResponseSchema,
  UserResponseSchema,
  ValidationErrorResponseSchema,
} from '../../shared/swagger';
import { type SafeUser } from '../users';
import { AuthService } from './auth.service';
import { type AuthResponse } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import * as loginDto from './dto/login.dto';
import * as registerDto from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * AuthController - Authentication HTTP Endpoints
 *
 * ENDPOINTS:
 * - POST /api/auth/register - Neuen Account erstellen
 * - POST /api/auth/login    - Einloggen und Token erhalten
 * - GET  /api/auth/me       - Eigenes Profil abrufen
 *
 * SWAGGER DECORATORS:
 * - @ApiTags:  Gruppiert Endpoints unter "Auth"
 * - @ApiOperation: Beschreibt einzelnen Endpoint
 * - @ApiResponse: Dokumentiert mögliche Responses
 * - @ApiBody:  Dokumentiert Request Body
 * - @ApiBearerAuth: Markiert als Auth-geschützt
 */
@ApiTags('Auth')
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user account',
    description: `
Creates a new user account and returns authentication tokens.
The user is immediately logged in after registration.

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Username Requirements:**
- 3-30 characters
- Only letters, numbers, and underscores
    `,
  })
  @ApiBody({
    type: RegisterRequestSchema,
    description: 'User registration data',
    examples: {
      valid: {
        summary: 'Valid registration',
        value: {
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'SecurePass123',
        },
      },
      minimal: {
        summary: 'Minimal valid data',
        value: {
          email: 'min@test.com',
          username: 'usr',
          password: 'Test1234',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: AuthResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid input data',
    type: ValidationErrorResponseSchema,
  })
  @ApiConflictResponse({
    description: 'Email or username already exists',
    type: ConflictErrorResponseSchema,
  })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description: `
Authenticates a user with email and password.
Returns JWT tokens on successful authentication.

**Token Usage:**
Include the access token in the Authorization header:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`
    `,
  })
  @ApiBody({
    type: LoginRequestSchema,
    description: 'User credentials',
    examples: {
      valid: {
        summary: 'Valid credentials',
        value: {
          email: 'user@example.com',
          password: 'SecurePass123',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid input format',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    type: UnauthorizedErrorResponseSchema,
  })
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
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: `
Returns the profile of the currently authenticated user.
Requires a valid JWT token in the Authorization header.

**Note:** This endpoint validates the token and returns fresh user data from the database.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile',
    type: UserResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  getMe(@CurrentUser() user: SafeUser): SafeUser {
    this.logger.debug(`Get profile for user: ${user.id}`);
    return user;
  }
}
