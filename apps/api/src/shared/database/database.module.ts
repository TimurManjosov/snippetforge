// src/shared/database/database.module.ts

import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * DatabaseModule - Stellt Datenbankverbindung app-weit bereit
 *
 * @Global() Decorator:
 * - Macht DatabaseService in ALLEN Modulen verfügbar
 * - Ohne @Global(): Jedes Modul müsste DatabaseModule importieren
 * - Mit @Global(): Einmal in AppModule importieren = überall verfügbar
 *
 * Wann @Global() verwenden?
 * - Infrastruktur-Services (Database, Config, Logger)
 * - Services die von fast allen Modulen gebraucht werden
 *
 * Wann NICHT @Global()?
 * - Feature-spezifische Services (AuthService, UsersService)
 * - Services die nur von wenigen Modulen gebraucht werden
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
