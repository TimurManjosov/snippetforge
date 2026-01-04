// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './shared/database';

/**
 * AppModule - Root Module der Anwendung
 *
 * Import-Reihenfolge ist wichtig:
 * 1. ConfigModule (lädt . env Variablen)
 * 2. DatabaseModule (braucht Config für DATABASE_URL)
 * 3. Feature Modules (brauchen Database)
 */
@Module({
  imports: [
    // 1. Configuration - Lädt .env Variablen
    ConfigModule.forRoot({
      isGlobal: true, // Macht ConfigService überall verfügbar
      envFilePath: '.env', // Pfad zur .env Datei
      cache: true, // Cached Env-Variablen (Performance)
    }),

    // 2. Database - Stellt Drizzle ORM bereit
    DatabaseModule,

    // 3. Feature Modules (kommen in späteren Commits)
    // UsersModule,
    // AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
