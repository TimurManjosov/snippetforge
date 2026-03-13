// src/main.ts

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  createSwaggerConfig,
  isSwaggerEnabled,
  SWAGGER_PATH,
  swaggerCustomOptions,
} from './config/swagger.config';
import {
  GlobalHttpExceptionFilter,
} from './shared/filters';
import { HttpLoggingInterceptor } from './shared/interceptors/http-logging.interceptor';

/**
 * Bootstrap - Startet die NestJS Anwendung
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  // ========================================
  // APP ERSTELLEN
  // ========================================

  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
    abortOnError: true,
  });

  // ========================================
  // GLOBAL EXCEPTION FILTERS
  // ========================================

  app.useGlobalInterceptors(new HttpLoggingInterceptor());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // ========================================
  // KONFIGURATION
  // ========================================

  app.enableShutdownHooks();

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  app.setGlobalPrefix('api');

  // ========================================
  // SWAGGER DOCUMENTATION
  // ========================================

  if (isSwaggerEnabled()) {
    const config = createSwaggerConfig();
    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup(SWAGGER_PATH, app, document, swaggerCustomOptions);

    logger.log(
      `📖 Swagger documentation available at: http://localhost:${process.env.PORT || 3001}/${SWAGGER_PATH}`,
    );
  } else {
    logger.log('📖 Swagger documentation is disabled');
  }

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
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
