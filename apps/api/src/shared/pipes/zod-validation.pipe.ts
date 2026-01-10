// src/shared/pipes/zod-validation.pipe.ts

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, type ZodSchema } from 'zod';
import { ErrorCodes } from '../constants';

/**
 * ZodValidationPipe - Validiert Input mit Zod Schemas
 *
 * VERWENDUNG:
 * @Post('register')
 * async register(
 *   @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto
 * ) {
 *   // dto ist GARANTIERT valide
 * }
 *
 * ERROR FORMAT:
 * Wirft BadRequestException mit speziellem Format,
 * das von HttpExceptionFilter erkannt wird.
 *
 * PERFORMANCE:
 * - Zod ist schnell (native JS, kein Reflection)
 * - Parse + Transform in einem Schritt
 * - Fehler werden früh erkannt (Fail Fast)
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private schema: ZodSchema<T>) {}

  /**
   * Transform - Validiert und transformiert Input
   */
  transform(value: unknown): T {
    try {
      // Zod validiert UND transformiert (z.B. email lowercase)
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatiere Zod Errors
        const formattedErrors = this.formatZodErrors(error);

        // BadRequestException mit Custom Format
        // HttpExceptionFilter erkennt 'errors' Property
        throw new BadRequestException({
          message: 'Validation failed',
          code: ErrorCodes.VALIDATION_ERROR,
          errors: formattedErrors,
        });
      }

      // Unbekannter Error - weiterwerfen
      throw error;
    }
  }

  /**
   * Formatiert Zod Errors in Frontend-freundliches Format
   *
   * INPUT (Zod Format):
   * [
   *   { path: ['email'], message: 'Invalid email' },
   *   { path: ['password'], message: 'Too short' }
   * ]
   *
   * OUTPUT:
   * {
   *   email: ['Invalid email'],
   *   password: ['Too short']
   * }
   */
  private formatZodErrors(error: ZodError): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    for (const issue of error.issues) {
      // Path kann nested sein: ['user', 'email'] → 'user.email'
      const path = issue.path.length > 0 ? issue.path.join('.') : '_root'; // Für root-level Errors

      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }

      formattedErrors[path].push(issue.message);
    }

    return formattedErrors;
  }
}
