// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule, JwtAuthGuard } from './modules/auth';
import { UsersModule } from './modules/users';
import { DatabaseModule } from './shared/database';

/**
 * AppModule - Root Module
 *
 * WICHTIG: JwtAuthGuard ist GLOBAL aktiviert!
 * Das bedeutet:  ALLE Routes sind geschützt, außer @Public()
 *
 * Vorteile:
 * - Security by Default (vergessene Auth ist nicht möglich)
 * - Weniger Boilerplate (@UseGuards auf jeder Route)
 *
 * Nachteile:
 * - Muss @Public() für öffentliche Routes setzen
 *
 * ALTERNATIV: Guards nur auf einzelnen Routes/Controllern
 * Dann APP_GUARD Provider entfernen und @UseGuards() nutzen
 */
@Module({
  imports: [
    // 1. Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    // 2. Database
    DatabaseModule,

    // 3. Feature Modules
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Global JwtAuthGuard
    // Alle Routes sind geschützt, außer @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
