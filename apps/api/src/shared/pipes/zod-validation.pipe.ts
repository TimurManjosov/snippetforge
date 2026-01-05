// src/shared/pipes/zod-validation. pipe.ts

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import * as zod from 'zod';

/**
 * ZodValidationPipe - Validiert Input mit Zod Schemas
 *
 * VERWENDUNG:
 * ```typescript
 * @Post('register')
 * async register(
 *   @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto
 * ) {
 *   // dto ist GARANTIERT valide
 * }
 * ```
 *
 * WARUM als Pipe statt im Service?
 * - Fail Fast: Invalide Requests werden sofort abgelehnt
 * - Clean Controllers: Kein Validation-Code im Controller
 * - Konsistente Errors: Alle Validation Errors haben gleiches Format
 * - Testbar: Pipe kann isoliert getestet werden
 *
 * ALTERNATIVE: class-validator mit @UsePipes()
 * Warum Zod besser ist:
 * - Type Inference (kein manuelles Interface schreiben)
 * - Bessere Fehlermeldungen
 * - Funktional (keine Decorators auf DTOs)
 * - Kann im Frontend wiederverwendet werden
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private schema: zod.ZodSchema<T>) {}

  /**
   * Transform - Validiert und transformiert Input
   *
   * @param value - Raw Input (aus Request Body, Query, etc.)
   * @param metadata - Informationen über Parameter (body, query, param)
   * @returns Validierter und transformierter Wert
   * @throws BadRequestException bei Validation Errors
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, _metadata: ArgumentMetadata): T {
    try {
      // Zod validiert UND transformiert (z.B. email lowercase)
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof zod.ZodError) {
        // Formatiere Zod Errors für bessere Lesbarkeit
        const formattedErrors = this.formatZodErrors(error);

        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
          statusCode: 400,
        });
      }

      // Unbekannter Error - weiterwerfen
      throw error;
    }
  }

  /**
   * Formatiert Zod Errors in lesbares Format
   *
   * INPUT (Zod Format):
   * [
   *   { path: ['email'], message: 'Invalid email' },
   *   { path:  ['password'], message: 'Too short' }
   * ]
   *
   * OUTPUT (Unser Format):
   * {
   *   email: ['Invalid email'],
   *   password: ['Too short']
   * }
   */
  private formatZodErrors(error: zod.ZodError): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    for (const issue of error.issues) {
      // Path kann nested sein:  ['user', 'email'] → 'user.email'
      const path = issue.path.join('. ') || 'root';

      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }

      formattedErrors[path].push(issue.message);
    }

    return formattedErrors;
  }
}
