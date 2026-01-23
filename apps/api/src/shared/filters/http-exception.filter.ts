// src/shared/filters/http-exception.filter.ts

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ErrorCodes,
  HttpStatusToErrorCode,
  type ErrorCode,
} from '../constants';
import { createErrorResponse, type ErrorDetails } from '../types';

/**
 * HttpExceptionFilter - Fängt alle HttpExceptions und formatiert sie einheitlich
 *
 * WAS ES FÄNGT:
 * - BadRequestException (400)
 * - UnauthorizedException (401)
 * - ForbiddenException (403)
 * - NotFoundException (404)
 * - ConflictException (409)
 * - Alle anderen HttpExceptions
 *
 * WAS ES NICHT FÄNGT:
 * - TypeError, ReferenceError, etc. (→ AllExceptionsFilter)
 * - Errors die keine HttpException sind
 *
 * PERFORMANCE OPTIMIERUNGEN:
 * - Minimale Object-Erstellung
 * - Keine synchronen Operationen blockieren
 * - Logging ist non-blocking
 *
 * SECURITY:
 * - Keine Stack Traces in Response
 * - Sensitive Daten werden gefiltert
 * - Einheitliche Error Messages (keine Information Leakage)
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Catch - Hauptmethode die von NestJS aufgerufen wird
   *
   * @param exception - Die gefangene HttpException
   * @param host - ArgumentsHost für Zugriff auf Request/Response
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Error Details extrahieren
    const { message, code, details } = this.extractErrorInfo(
      exceptionResponse,
      status,
    );

    // Error Response erstellen
    const errorResponse = createErrorResponse({
      code,
      message,
      statusCode: status,
      path: request.url,
      method: request.method,
      details,
      requestId: this.extractRequestId(request),
    });

    // Logging
    this.logError(exception, request, status, code);

    // Response senden
    response.status(status).json(errorResponse);
  }

  /**
   * Extrahiert Error-Informationen aus der Exception Response
   *
   * NestJS Exceptions können verschiedene Formate haben:
   * - String: "Not found"
   * - Object: { message: "Not found", error: "Not Found" }
   * - Object mit Array: { message: ["error1", "error2"] }
   * - Custom Object: { message: "...", code: "CUSTOM_CODE", errors: {...} }
   *
   * Diese Methode normalisiert alle Formate.
   */
  private extractErrorInfo(
    response: string | object,
    status: number,
  ): { message: string; code: ErrorCode; details?: ErrorDetails } {
    // Default Values
    let message = 'An error occurred';
    let code: ErrorCode =
      HttpStatusToErrorCode[status] || ErrorCodes.SERVER_ERROR;
    let details: ErrorDetails | undefined;

    // String Response
    if (typeof response === 'string') {
      message = response;
      code = this.inferErrorCode(message, status, code);
      return { message, code, details };
    }

    // Object Response
    if (typeof response === 'object' && response !== null) {
      const res = response as Record<string, unknown>;

      // Message extrahieren
      if (typeof res.message === 'string') {
        message = res.message;
      } else if (Array.isArray(res.message)) {
        // Array von Messages (z.B. class-validator)
        message = (res.message[0] as string) || 'Validation failed';

        // Alle Messages als Details speichern
        if (res.message.length > 1) {
          details = { context: { messages: res.message } };
        }
      }

      // Custom Error Code
      if (typeof res.code === 'string') {
        code = res.code as ErrorCode;
      }

      // Zod Validation Errors (von ZodValidationPipe)
      if (res.errors && typeof res.errors === 'object') {
        details = { fields: res.errors as Record<string, string[]> };
      }

      // Spezifische Codes basierend auf Message
      code = this.inferErrorCode(message, status, code);
    }

    return { message, code, details };
  }

  /**
   * Inferiert spezifischen Error Code basierend auf Message
   *
   * WARUM?
   * - Viele NestJS Exceptions haben keinen Code
   * - Wir wollen spezifische Codes für Frontend
   * - Ermöglicht besseres Error Handling
   */
  private inferErrorCode(
    message: string,
    status: number,
    defaultCode: ErrorCode,
  ): ErrorCode {
    const lowerMessage = message.toLowerCase();

    // Authentication Errors
    if (status === HttpStatus.UNAUTHORIZED) {
      if (lowerMessage.includes('expired')) {
        return ErrorCodes.AUTH_TOKEN_EXPIRED;
      }
      if (
        lowerMessage.includes('missing') ||
        lowerMessage.includes('no token')
      ) {
        return ErrorCodes.AUTH_TOKEN_MISSING;
      }
      if (
        lowerMessage.includes('invalid credentials') ||
        lowerMessage.includes('email or password')
      ) {
        return ErrorCodes.AUTH_INVALID_CREDENTIALS;
      }
      return ErrorCodes.AUTH_TOKEN_INVALID;
    }

    // Authorization Errors
    if (status === HttpStatus.FORBIDDEN) {
      if (lowerMessage.includes('role')) {
        return ErrorCodes.AUTH_INSUFFICIENT_ROLE;
      }
      return ErrorCodes.AUTH_ACCESS_DENIED;
    }

    // Conflict Errors
    if (status === HttpStatus.CONFLICT) {
      if (lowerMessage.includes('email')) {
        return ErrorCodes.USER_EMAIL_EXISTS;
      }
      if (lowerMessage.includes('username')) {
        return ErrorCodes.USER_USERNAME_EXISTS;
      }
    }

    // Not Found Errors
    if (status === HttpStatus.NOT_FOUND) {
      if (lowerMessage.includes('user')) {
        return ErrorCodes.USER_NOT_FOUND;
      }
    }

    return defaultCode;
  }

  /**
   * Extrahiert Request ID für Tracing
   *
   * Request ID kann kommen von:
   * - X-Request-ID Header (gesetzt von Load Balancer/Gateway)
   * - Custom Middleware
   */
  private extractRequestId(request: Request): string | undefined {
    return (
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      undefined
    );
  }

  /**
   * Logging mit unterschiedlichen Levels je nach Error-Typ
   *
   * LOGGING STRATEGY:
   * - 4xx (Client Errors): warn Level (User-Fehler)
   * - 5xx (Server Errors): error Level (Unsere Fehler)
   *
   * FORMAT:
   * [METHOD] /path - STATUS CODE: message
   */
  private logError(
    exception: HttpException,
    request: Request,
    status: number,
    code: string,
  ): void {
    const { method, url, ip } = request;
    const message = exception.message;
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Log Context für strukturiertes Logging
    const logContext = {
      method,
      url,
      status,
      code,
      ip,
      userAgent: userAgent.substring(0, 100), // Truncate für Performance
    };

    // Log Level basierend auf Status
    if (status >= 500) {
      // Server Errors: Immer mit Stack Trace loggen
      this.logger.error(
        `[${method}] ${url} - ${status} ${code}: ${message}`,
        exception.stack,
        JSON.stringify(logContext),
      );
    } else if (status === 401 || status === 403) {
      // Auth Errors: Security-relevant, warn Level
      this.logger.warn(
        `[${method}] ${url} - ${status} ${code}: ${message}`,
        JSON.stringify(logContext),
      );
    } else if (status >= 400) {
      // Client Errors: Debug Level (zu viel Noise bei warn)
      this.logger.debug(
        `[${method}] ${url} - ${status} ${code}: ${message}`,
        JSON.stringify(logContext),
      );
    }
  }
}
