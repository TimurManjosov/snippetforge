// src/app.module.ts

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule, JwtAuthGuard } from './modules/auth';
import { CollectionsModule } from './modules/collections';
import { CommentsModule } from './modules/comments';
import { FavoritesModule } from './modules/favorites';
import { HealthModule } from './modules/health';
import { MetricsModule } from './modules/metrics';
import { ReactionsModule } from './modules/reactions';
import { SettingsModule } from './modules/settings';
import { SnippetsModule } from './modules/snippets';
import { TagsModule } from './modules/tags';
import { UsersModule } from './modules/users';
import { DatabaseModule } from './shared/database';
import { RequestIdMiddleware } from './shared/middleware/request-id.middleware';
import { createThrottlerOptions } from './shared/throttler';

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

    // 3. Rate limiting (global default + per-route overrides via @Throttle*)
    ThrottlerModule.forRoot(createThrottlerOptions()),

    // 4. Operations
    HealthModule,
    MetricsModule,

    // 5. Feature Modules
    UsersModule,
    AuthModule,
    SnippetsModule,
    TagsModule,
    CommentsModule,
    ReactionsModule,
    FavoritesModule,
    CollectionsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Global rate limiting. Runs before the auth guard so unauthenticated
    // floods are rejected without spending CPU on JWT verification.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global JwtAuthGuard
    // Alle Routes sind geschützt, außer @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
