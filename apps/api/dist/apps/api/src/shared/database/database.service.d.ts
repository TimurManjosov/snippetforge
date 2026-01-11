import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../lib/db/schema';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private client;
    private _drizzle;
    constructor(configService: ConfigService);
    get drizzle(): PostgresJsDatabase<typeof schema>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    healthCheck(): Promise<boolean>;
    executeRaw<T>(sql: string): Promise<T[]>;
}
