// src/app.module. ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users';
import { DatabaseModule } from './shared/database';

/**
 * AppModule - Root Module der Anwendung
 *
 * Import-Reihenfolge:
 * 1. ConfigModule (Infrastruktur)
 * 2. DatabaseModule (Infrastruktur)
 * 3. Feature Modules (Business Logic)
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
    // AuthModule, (kommt in Commit 3)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
