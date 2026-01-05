// src/modules/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { UsersModule } from '../users';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * AuthModule - Alles rund um Authentication
 *
 * IMPORTS:
 * - PassportModule:  Basis für Authentication Strategies
 * - JwtModule:  JWT Token Handling (Sign/Verify)
 * - UsersModule: Zugriff auf UsersService
 *
 * PROVIDERS:
 * - AuthService:  Business Logic
 * - JwtStrategy: Token Validierung
 * - Guards: JwtAuthGuard, RolesGuard
 *
 * EXPORTS:
 * - Guards und Service für Verwendung in anderen Modulen
 */
@Module({
  imports: [
    // Passport.js Basis-Modul
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // JWT Modul mit async Konfiguration (braucht ConfigService)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') ||
          '900s') as StringValue;
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn,
            algorithm: 'HS256' as const,
          },
        };
      },
    }),

    // UsersModule für Zugriff auf UsersService
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [
    // Andere Module können diese nutzen
    AuthService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
