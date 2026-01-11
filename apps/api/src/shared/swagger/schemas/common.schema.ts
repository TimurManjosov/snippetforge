// src/shared/swagger/schemas/common.schema.ts

import { ApiProperty } from '@nestjs/swagger';

/**
 * Common/Shared Swagger Schemas
 * Wiederverwendbare Schemas für die gesamte API
 */

/**
 * Health Check Response Schema
 */
export class HealthCheckResponseSchema {
  @ApiProperty({
    description: 'Service status',
    example: 'ok',
    enum: ['ok', 'degraded', 'error'],
  })
  status: string;

  @ApiProperty({
    description: 'Current server timestamp',
    example: '2026-01-10T12:00:00.000Z',
    format: 'date-time',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Service name',
    example: 'snippetforge-api',
  })
  service: string;

  @ApiProperty({
    description: 'API version',
    example: '0.1.0',
  })
  version: string;
}

/**
 * Pagination Meta Schema
 * Für paginated Responses (zukünftig)
 */
export class PaginationMetaSchema {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Has next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Has previous page',
    example: false,
  })
  hasPreviousPage: boolean;
}

/**
 * Message Response Schema
 * Für einfache Status-Messages
 */
export class MessageResponseSchema {
  @ApiProperty({
    description: 'Status message',
    example: 'Operation completed successfully',
  })
  message: string;
}
