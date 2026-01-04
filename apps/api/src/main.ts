// src/main.ts

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Bootstrap - Startet die NestJS Anwendung
 *
 * Wichtige Konfigurationen:
 * - enableShutdownHooks:  Erlaubt sauberes Cleanup (DB Connections schließen)
 * - CORS: Erlaubt Frontend-Zugriff von anderem Port
 * - Port aus ENV oder Default 3001
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // App erstellen
  const app = await NestFactory.create(AppModule, {
    // Logger-Level je nach Environment
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Graceful Shutdown ermöglichen
  // Wichtig für:  DB Connections schließen, laufende Requests abschließen
  app.enableShutdownHooks();

  // CORS für Frontend (Next.js auf Port 3000)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // Erlaubt Cookies/Auth Headers
  });

  // Global Prefix für alle Routes
  // Alle Endpoints sind unter /api/...  erreichbar
  // Beispiel: /api/auth/login, /api/users/me
  app.setGlobalPrefix('api');

  // Port aus ENV oder Default
  const port = process.env.PORT || 3001;

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API available at: http://localhost:${port}/api`);
}

bootstrap();
