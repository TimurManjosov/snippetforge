// src/shared/database/index.ts

/**
 * Barrel Export - Vereinfacht Imports
 *
 * Statt:
 *   import { DatabaseService } from './shared/database/database.service'
 *   import { DatabaseModule } from './shared/database/database.module'
 *
 * Jetzt:
 *   import { DatabaseService, DatabaseModule } from './shared/database'
 */

export { DatabaseModule } from './database.module';
export { DatabaseService } from './database.service';
