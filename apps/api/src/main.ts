// src/main.ts

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter, HttpExceptionFilter } from './shared/filters';

/**
 * Bootstrap - Startet die NestJS Anwendung
 *
 * REIHENFOLGE DER MIDDLEWARE:
 * 1. Global Filters (Exception Handling)
 * 2. Global Pipes (Validation) - kommt in späterem Commit
 * 3. Global Interceptors (Logging, Transformation) - optional
 * 4. Global Guards (Authentication) - bereits via APP_GUARD in AppModule
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  // ========================================
  // APP ERSTELLEN
  // ========================================

  const app = await NestFactory.create(AppModule, {
    // Logger-Level je nach Environment
    logger: isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],

    // Abort on Error:  App startet nicht wenn kritischer Fehler
    abortOnError: true,
  });

  // ========================================
  // GLOBAL EXCEPTION FILTERS
  // ========================================

  /**
   * Filter-Reihenfolge ist WICHTIG!
   *
   * NestJS führt Filter in UMGEKEHRTER Reihenfolge aus:
   * - Letzter Filter im Array wird ZUERST versucht
   * - Wenn er die Exception nicht catcht, geht es zum vorherigen
   *
   * Unsere Reihenfolge:
   * 1. AllExceptionsFilter (Catch-All, niedrigste Priorität)
   * 2. HttpExceptionFilter (spezifisch, wird zuerst versucht)
   *
   * Ablauf bei HttpException:
   * → HttpExceptionFilter catcht → Response
   *
   * Ablauf bei TypeError:
   * → HttpExceptionFilter catcht NICHT (nicht @Catch(HttpException))
   * → AllExceptionsFilter catcht (@Catch()) → Response
   */
  app.useGlobalFilters(
    new AllExceptionsFilter(), // Catch-All (Fallback)
    new HttpExceptionFilter(), // HTTP Exceptions
  );

  // ========================================
  // KONFIGURATION
  // ========================================

  // Graceful Shutdown: Cleanup bei SIGTERM/SIGINT
  app.enableShutdownHooks();

  // CORS für Frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Global Prefix:  Alle Routes unter /api
  app.setGlobalPrefix('api');

  // ========================================
  // SERVER STARTEN
  // ========================================

  const port = process.env.PORT || 3001;

  await app.listen(port);

  // Startup Logs
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API available at: http://localhost:${port}/api`);
  logger.log(`🔒 Environment: ${isProduction ? 'production' : 'development'}`);

  if (!isProduction) {
    logger.debug('Debug logging is enabled');
  }
}

bootstrap().catch((error) => {
  // Falls Bootstrap fehlschlägt
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
