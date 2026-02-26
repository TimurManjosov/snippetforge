// src/modules/users/users.module.ts

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

/**
 * UsersModule - Kapselt alle User-bezogenen Komponenten
 *
 * STRUKTUR:
 * - Controller: HTTP Endpoints
 * - Repository:  Data Access (intern)
 * - Service: Business Logic (exportiert für andere Module)
 *
 * WARUM exportieren wir UsersService?
 * - AuthModule braucht UsersService für Login/Register
 * - Andere Module könnten User-Daten brauchen
 *
 * WARUM exportieren wir NICHT UsersRepository?
 * - Repository ist Implementierungsdetail
 * - Andere Module sollen durch Service gehen
 * - Bessere Kapselung
 */
@Module({
  controllers: [UsersController],
  providers: [
    UsersRepository, // Data Access Layer (intern)
    UsersService, // Business Logic (exportiert)
  ],
  exports: [
    UsersService, // Nur Service wird exportiert!
  ],
})
export class UsersModule {}
