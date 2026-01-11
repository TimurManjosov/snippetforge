// src/shared/swagger/schemas/error.schema. ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Swagger Schemas für Error Responses
 *
 * WARUM KLASSEN STATT INTERFACES?
 * - @nestjs/swagger braucht Klassen für Schema-Generierung
 * - Decorators können nur auf Klassen angewendet werden
 * - Runtime-Reflection für automatische Schema-Erstellung
 *
 * WICHTIG:
 * - Diese Klassen sind NUR für Dokumentation
 * - Sie werden NICHT für Validierung verwendet
 * - Zod-Schemas bleiben für Runtime-Validierung
 */

/**
 * Error Details Schema
 * Zusätzliche Informationen bei Validation Errors
 */
export class ErrorDetailsSchema {
  @ApiPropertyOptional({
    description: 'Field-specific validation errors',
    example: {
      email: ['Invalid email format'],
      password: ['Password must be at least 8 characters'],
    },
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  fields?: Record<string, string[]>;

  @ApiPropertyOptional({
    description: 'Additional context information',
    type: 'object',
    additionalProperties: true,
  })
  context?: Record<string, unknown>;
}

/**
 * Error Object Schema
 * Hauptteil der Error Response
 */
export class ErrorObjectSchema {
  @ApiProperty({
    description: 'Machine-readable error code',
    example: 'VALIDATION_ERROR',
    enum: [
      'AUTH_TOKEN_MISSING',
      'AUTH_TOKEN_INVALID',
      'AUTH_TOKEN_EXPIRED',
      'AUTH_INVALID_CREDENTIALS',
      'AUTH_INSUFFICIENT_ROLE',
      'AUTH_ACCESS_DENIED',
      'VALIDATION_ERROR',
      'USER_NOT_FOUND',
      'USER_EMAIL_EXISTS',
      'USER_USERNAME_EXISTS',
      'RESOURCE_NOT_FOUND',
      'SERVER_ERROR',
    ],
  })
  code: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details',
    type: ErrorDetailsSchema,
  })
  details?: ErrorDetailsSchema;
}

/**
 * Response Meta Schema
 * Metadaten jeder Response
 */
export class ResponseMetaSchema {
  @ApiProperty({
    description: 'ISO 8601 timestamp',
    example: '2026-01-10T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path',
    example: '/api/auth/register',
  })
  path: string;

  @ApiProperty({
    description: 'HTTP method',
    example: 'POST',
  })
  method: string;

  @ApiPropertyOptional({
    description: 'Request ID for tracing',
    example: 'req-123-456-789',
  })
  requestId?: string;
}

/**
 * Standard Error Response Schema
 * Wird für alle Error-Dokumentationen verwendet
 */
export class ErrorResponseSchema {
  @ApiProperty({
    description: 'Always false for errors',
    example: false,
  })
  success: false;

  @ApiProperty({
    description: 'Error details',
    type: ErrorObjectSchema,
  })
  error: ErrorObjectSchema;

  @ApiProperty({
    description: 'Response metadata',
    type: ResponseMetaSchema,
  })
  meta: ResponseMetaSchema;
}

/**
 * Validation Error Response Schema
 * Spezifisch für 400 Bad Request mit Validation Details
 */
export class ValidationErrorResponseSchema extends ErrorResponseSchema {
  @ApiProperty({
    description: 'Error details with validation fields',
    type: ErrorObjectSchema,
    example: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      statusCode: 400,
      details: {
        fields: {
          email: ['Invalid email format'],
          password: ['Password must be at least 8 characters'],
        },
      },
    },
  })
  declare error: ErrorObjectSchema;
}

/**
 * Unauthorized Error Response Schema
 * Spezifisch für 401 Unauthorized
 */
export class UnauthorizedErrorResponseSchema extends ErrorResponseSchema {
  @ApiProperty({
    description: 'Error details for authentication failure',
    type: ErrorObjectSchema,
    example: {
      code: 'AUTH_TOKEN_MISSING',
      message: 'Invalid or missing authentication token',
      statusCode: 401,
    },
  })
  declare error: ErrorObjectSchema;
}

/**
 * Forbidden Error Response Schema
 * Spezifisch für 403 Forbidden
 */
export class ForbiddenErrorResponseSchema extends ErrorResponseSchema {
  @ApiProperty({
    description: 'Error details for authorization failure',
    type: ErrorObjectSchema,
    example: {
      code: 'AUTH_INSUFFICIENT_ROLE',
      message: 'Access denied.  Required role:  ADMIN',
      statusCode: 403,
    },
  })
  declare error: ErrorObjectSchema;
}

/**
 * Not Found Error Response Schema
 * Spezifisch für 404 Not Found
 */
export class NotFoundErrorResponseSchema extends ErrorResponseSchema {
  @ApiProperty({
    description: 'Error details for not found',
    type: ErrorObjectSchema,
    example: {
      code: 'RESOURCE_NOT_FOUND',
      message: 'Resource not found',
      statusCode: 404,
    },
  })
  declare error: ErrorObjectSchema;
}

/**
 * Conflict Error Response Schema
 * Spezifisch für 409 Conflict
 */
export class ConflictErrorResponseSchema extends ErrorResponseSchema {
  @ApiProperty({
    description: 'Error details for conflict',
    type: ErrorObjectSchema,
    example: {
      code: 'USER_EMAIL_EXISTS',
      message: 'Email is already registered',
      statusCode: 409,
    },
  })
  declare error: ErrorObjectSchema;
}

/**
 * Internal Server Error Response Schema
 * Spezifisch für 500 Internal Server Error
 */
export class InternalServerErrorResponseSchema extends ErrorResponseSchema {
  @ApiProperty({
    description: 'Error details for server error',
    type: ErrorObjectSchema,
    example: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred.  Please try again later.',
      statusCode: 500,
    },
  })
  declare error: ErrorObjectSchema;
}
