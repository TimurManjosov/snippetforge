// src/shared/swagger/schemas/snippets.schema.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaSchema } from './common.schema';

/**
 * Swagger Schemas for Snippet Endpoints
 */

// ============================================================
// REQUEST SCHEMAS
// ============================================================

export class CreateSnippetRequestSchema {
  @ApiProperty({
    description: 'Snippet title',
    example: 'Quick Sort Implementation',
    maxLength: 200,
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Optional snippet description',
    example: 'Efficient quick sort in TypeScript',
    maxLength: 1000,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Snippet code content',
    example: 'const quickSort = (arr) => { /* ... */ };',
    maxLength: 50000,
  })
  code: string;

  @ApiProperty({
    description: 'Programming language identifier',
    example: 'typescript',
    maxLength: 50,
  })
  language: string;

  @ApiPropertyOptional({
    description: 'Visibility flag',
    example: true,
    default: true,
  })
  isPublic?: boolean;
}

export class UpdateSnippetRequestSchema {
  @ApiPropertyOptional({
    description: 'Snippet title',
    example: 'Updated snippet title',
    maxLength: 200,
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Optional snippet description',
    example: 'Updated description',
    maxLength: 1000,
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Snippet code content',
    example: 'console.log("Updated code");',
    maxLength: 50000,
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Programming language identifier',
    example: 'javascript',
    maxLength: 50,
  })
  language?: string;

  @ApiPropertyOptional({
    description: 'Visibility flag',
    example: false,
  })
  isPublic?: boolean;
}

// ============================================================
// RESPONSE SCHEMAS
// ============================================================

export class SnippetResponseSchema {
  @ApiProperty({
    description: 'Snippet unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Snippet title',
    example: 'Quick Sort Implementation',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Optional snippet description',
    example: 'Efficient quick sort in TypeScript',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Snippet code content',
    example: 'const quickSort = (arr) => { /* ... */ };',
  })
  code: string;

  @ApiProperty({
    description: 'Programming language identifier',
    example: 'typescript',
  })
  language: string;

  @ApiProperty({
    description: 'Snippet owner user id',
    example: 'f3b6c0b4-0c1c-4c88-9b23-2b7b6a5e1234',
    format: 'uuid',
  })
  userId: string;

  @ApiProperty({
    description: 'Visibility flag',
    example: true,
  })
  isPublic: boolean;

  @ApiProperty({
    description: 'Snippet view count',
    example: 42,
  })
  viewCount: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-17T10:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-17T10:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}

export class SnippetPreviewResponseSchema {
  @ApiProperty({
    description: 'Snippet unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Snippet title',
    example: 'Quick Sort Implementation',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Optional snippet description',
    example: 'Efficient quick sort in TypeScript',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Programming language identifier',
    example: 'typescript',
  })
  language: string;

  @ApiProperty({
    description: 'Snippet owner user id',
    example: 'f3b6c0b4-0c1c-4c88-9b23-2b7b6a5e1234',
    format: 'uuid',
  })
  userId: string;

  @ApiProperty({
    description: 'Visibility flag',
    example: true,
  })
  isPublic: boolean;

  @ApiProperty({
    description: 'Snippet view count',
    example: 42,
  })
  viewCount: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-17T10:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-17T10:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}

export class PaginatedSnippetPreviewsResponseSchema {
  @ApiProperty({
    description: 'Snippet preview list',
    type: SnippetPreviewResponseSchema,
    isArray: true,
  })
  items: SnippetPreviewResponseSchema[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaSchema,
  })
  meta: PaginationMetaSchema;
}

export class SnippetStatsResponseSchema {
  @ApiProperty({
    description: 'Total snippets owned by the user',
    example: 12,
  })
  total: number;

  @ApiProperty({
    description: 'Public snippets owned by the user',
    example: 8,
  })
  public: number;

  @ApiProperty({
    description: 'Private snippets owned by the user',
    example: 4,
  })
  private: number;

  @ApiProperty({
    description: 'Total snippet views',
    example: 256,
  })
  totalViews: number;

  @ApiPropertyOptional({
    description: 'Most viewed snippet',
    type: SnippetResponseSchema,
  })
  mostViewed?: SnippetResponseSchema;

  @ApiPropertyOptional({
    description: 'Latest snippet created by the user',
    type: SnippetResponseSchema,
  })
  latestSnippet?: SnippetResponseSchema;
}
