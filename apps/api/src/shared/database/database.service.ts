// src/shared/database/database. service.ts

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../lib/db/schema';

/**
 * DatabaseService - Zentrale Datenbankverbindung für die gesamte Anwendung
 *
 * Verantwortlichkeiten:
 * - Connection Pool Management
 * - Lifecycle (Connect on Start, Disconnect on Shutdown)
 * - Health Checks
 * - Drizzle Client Bereitstellung
 *
 * Warum als Service und nicht als Modul-Export?
 * - Dependency Injection ermöglicht einfaches Mocking in Tests
 * - Lifecycle Hooks für sauberes Cleanup
 * - Zentrale Konfiguration an einer Stelle
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private client: postgres.Sql;
  private _drizzle: PostgresJsDatabase<typeof schema>;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Getter für den Drizzle Client
   * Wird von Repositories verwendet für Type-Safe Queries
   */
  get drizzle(): PostgresJsDatabase<typeof schema> {
    if (!this._drizzle) {
      throw new Error('Database not initialized.  Call onModuleInit first.');
    }
    return this._drizzle;
  }

  /**
   * Lifecycle Hook:  Wird automatisch beim App-Start aufgerufen
   * Etabliert Datenbankverbindung mit Connection Pool
   */
  async onModuleInit(): Promise<void> {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      this.logger.error('DATABASE_URL is not defined in environment variables');
      throw new Error('DATABASE_URL is required');
    }

    this.logger.log('🔌 Initializing database connection...');

    try {
      // PostgreSQL Client mit Connection Pool
      // Warum diese Einstellungen?
      // - max:  10 = Maximal 10 gleichzeitige Verbindungen (verhindert DB-Überlastung)
      // - idle_timeout: 20 = Ungenutzte Verbindungen nach 20s schließen (Resource-Freigabe)
      // - connect_timeout: 10 = Max 10s warten auf Connection (Fail Fast)
      this.client = postgres(databaseUrl, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        // SSL für Production (auskommentiert für lokale Entwicklung)
        // ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      });

      // Drizzle ORM Wrapper
      // Schema wird mitgegeben für Type-Safe Queries
      this._drizzle = drizzle(this.client, {
        schema,
        logger: this.configService.get('NODE_ENV') === 'development',
      });

      // Connection Test
      await this.healthCheck();
      this.logger.log('✅ Database connection established successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * Lifecycle Hook: Wird automatisch beim App-Shutdown aufgerufen
   * Schließt alle Datenbankverbindungen sauber
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('🔌 Closing database connection...');

    if (this.client) {
      await this.client.end();
      this.logger.log('✅ Database connection closed');
    }
  }

  /**
   * Health Check für Monitoring/Readiness Probes
   * Wird auch beim Startup verwendet um Connection zu verifizieren
   *
   * @returns true wenn DB erreichbar, wirft Error wenn nicht
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple Query um Connection zu testen
      await this.client`SELECT 1 as health_check`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      throw new Error('Database is not reachable');
    }
  }

  /**
   * Führt Raw SQL aus (für komplexe Queries, Migrations)
   * ACHTUNG: Nur verwenden wenn Drizzle Query Builder nicht ausreicht
   *
   * @param sql - Raw SQL String
   * @returns Query Result
   */
  async executeRaw<T>(sql: string): Promise<T[]> {
    return this.client.unsafe(sql) as Promise<T[]>;
  }
}
