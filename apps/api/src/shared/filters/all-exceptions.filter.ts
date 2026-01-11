// src/shared/filters/all-exceptions.filter.ts

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCodes, type ErrorCode } from '../constants';
import { createErrorResponse } from '../types';

/**
 * AllExceptionsFilter - Fängt ALLE Exceptions (Catch-All)
 *
 * WAS ES FÄNGT:
 * - TypeError, ReferenceError (Programming Errors)
 * - Database Connection Errors
 * - JSON Parse Errors
 * - Alle Errors die NICHT HttpException sind
 *
 * WARUM BRAUCHEN WIR DAS?
 * - HttpExceptionFilter fängt nur HttpExceptions
 * - Ohne diesen Filter würden unbekannte Errors als
 *   500 mit Stack Trace an Client gehen → Security Risk!
 *
 * REIHENFOLGE IN main.ts:
 * app.useGlobalFilters(
 *   new AllExceptionsFilter(),    // Catch-All (niedrigste Priorität)
 *   new HttpExceptionFilter(),    // Spezifisch (höhere Priorität)
 * )
 * NestJS führt Filter in UMGEKEHRTER Reihenfolge aus:
 * 1. HttpExceptionFilter versucht zu catchen
 * 2. Falls nicht HttpException → AllExceptionsFilter catcht
 *
 * SECURITY:
 * - NIEMALS Stack Traces an Client senden
 * - NIEMALS interne Error Messages an Client senden
 * - In Production: Generische "Internal Server Error" Message
 * - In Development: Detailliertere Messages für Debugging
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /** Ist Production Environment? */
  private readonly isProduction = process.env.NODE_ENV === 'production';

  /**
   * Catch - Hauptmethode für alle nicht-HTTP Exceptions
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Falls doch eine HttpException durchkommt (sollte nicht passieren)
    if (exception instanceof HttpException) {
      // Delegiere an HttpExceptionFilter
      // Dies sollte normalerweise nicht vorkommen
      this.logger.warn(
        'HttpException caught by AllExceptionsFilter - this should not happen',
      );
      const status = exception.getStatus();
      response.status(status).json(
        createErrorResponse({
          code: ErrorCodes.SERVER_ERROR,
          message: exception.message,
          statusCode: status,
          path: request.url,
          method: request.method,
        }),
      );
      return;
    }

    // Alle anderen Exceptions als 500 behandeln
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const { code, message } = this.processException(exception);

    // Error Response erstellen
    const errorResponse = createErrorResponse({
      code,
      message,
      statusCode: status,
      path: request.url,
      method: request.method,
      requestId: this.extractRequestId(request),
    });

    // IMMER loggen bei unbekannten Errors (mit Stack Trace)
    this.logError(exception, request);

    // Response senden
    response.status(status).json(errorResponse);
  }

  /**
   * Verarbeitet die Exception und extrahiert Code + Message
   *
   * SECURITY-REGEL:
   * In Production: NIEMALS echte Error Message zurückgeben
   * - Könnte interne Pfade verraten
   * - Könnte DB-Schema verraten
   * - Könnte verwendete Libraries verraten
   */
  private processException(exception: unknown): {
    code: ErrorCode;
    message: string;
  } {
    // Default für Production
    let code: ErrorCode = ErrorCodes.SERVER_ERROR;
    let message = 'An unexpected error occurred. Please try again later.';

    // In Development:  Mehr Details für Debugging
    if (!this.isProduction && exception instanceof Error) {
      // Spezifische Error-Typen erkennen
      const errorInfo = this.identifyErrorType(exception);
      code = errorInfo.code;

      // In Development: Echte Error Message (aber sanitized)
      message = this.sanitizeErrorMessage(exception.message);
    }

    return { code, message };
  }

  /**
   * Identifiziert den Error-Typ und gibt passenden Code zurück
   *
   * Erkennt:
   * - JWT Errors (von passport-jwt)
   * - Database Errors (von postgres/drizzle)
   * - JSON Parse Errors
   * - Type Errors
   */
  private identifyErrorType(error: Error): { code: ErrorCode } {
    const errorName = error.name;
    const errorMessage = error.message.toLowerCase();

    // JWT Errors (von passport-jwt / jsonwebtoken)
    if (errorName === 'JsonWebTokenError') {
      return { code: ErrorCodes.AUTH_TOKEN_INVALID };
    }
    if (errorName === 'TokenExpiredError') {
      return { code: ErrorCodes.AUTH_TOKEN_EXPIRED };
    }
    if (errorName === 'NotBeforeError') {
      return { code: ErrorCodes.AUTH_TOKEN_INVALID };
    }

    // Database Errors
    if (
      errorMessage.includes('database') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('postgres') ||
      errorMessage.includes('econnrefused')
    ) {
      return { code: ErrorCodes.SERVER_DATABASE_ERROR };
    }

    // Unique Constraint Violation (PostgreSQL)
    if (
      errorMessage.includes('unique constraint') ||
      errorMessage.includes('duplicate key')
    ) {
      return { code: ErrorCodes.RESOURCE_ALREADY_EXISTS };
    }

    // JSON Parse Error
    if (errorName === 'SyntaxError' && errorMessage.includes('json')) {
      return { code: ErrorCodes.VALIDATION_ERROR };
    }

    // Default
    return { code: ErrorCodes.SERVER_ERROR };
  }

  /**
   * Sanitized Error Messages
   *
   * Entfernt potenziell sensitive Informationen:
   * - Dateipfade
   * - Connection Strings
   * - Interne Methodennamen
   */
  private sanitizeErrorMessage(message: string): string {
    // Maximale Länge
    let sanitized = message.substring(0, 500);

    // Patterns die entfernt werden sollen
    const sensitivePatterns = [
      // Dateipfade (Windows und Unix)
      /[A-Za-z]:\\[^\s]+/g,
      /(?:\/[\w.-]+){2,}/g,

      // Connection Strings
      /postgresql:\/\/[^\s]+/gi,
      /postgres:\/\/[^\s]+/gi,
      /mongodb:\/\/[^\s]+/gi,

      // Stack Trace Teile
      /at\s+[^\n]+/g,

      // Node.js Interna
      /node:internal[^\n]+/g,
    ];

    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }

  /**
   * Extrahiert Request ID für Tracing
   */
  private extractRequestId(request: Request): string | undefined {
    return (
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      undefined
    );
  }

  /**
   * Logging für unbekannte Errors
   *
   * IMMER mit vollem Stack Trace loggen:
   * - Diese Errors sind unerwartet
   * - Wir brauchen alle Infos für Debugging
   * - Stack Trace geht NUR ins Log, NICHT an Client
   */
  private logError(exception: unknown, request: Request): void {
    const { method, url, ip } = request;
    const userAgent = request.headers['user-agent'] || 'unknown';

    const logContext = {
      method,
      url,
      ip,
      userAgent: userAgent.substring(0, 100),
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof Error) {
      this.logger.error(
        `[UNHANDLED] [${method}] ${url} - ${exception.name}: ${exception.message}`,
        exception.stack,
        JSON.stringify(logContext),
      );
    } else {
      // Für non-Error throws (z.B. throw "string")
      this.logger.error(
        `[UNHANDLED] [${method}] ${url} - Unknown exception type`,
        String(exception),
        JSON.stringify(logContext),
      );
    }
  }
}
