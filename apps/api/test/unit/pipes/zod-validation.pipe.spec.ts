// test/unit/pipes/zod-validation.pipe.spec.ts

import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../src/shared/pipes/zod-validation.pipe';

/**
 * ZodValidationPipe Unit Tests
 *
 * Testet:
 * - Valide Daten werden transformiert
 * - Invalide Daten werfen BadRequestException
 * - Error-Format ist korrekt
 */
describe('ZodValidationPipe', () => {
  // Test Schema
  const TestSchema = z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().min(0, 'Age must be positive').optional(),
  });

  let pipe: ZodValidationPipe<z.infer<typeof TestSchema>>;

  beforeEach(() => {
    pipe = new ZodValidationPipe(TestSchema);
  });

  describe('transform', () => {
    describe('with valid data', () => {
      it('should return parsed data when all fields are valid', () => {
        // Arrange
        const input = {
          email: 'test@example.com',
          name: 'John',
          age: 25,
        };

        // Act
        const result = pipe.transform(input);

        // Assert
        expect(result).toEqual(input);
      });

      it('should return parsed data with optional fields omitted', () => {
        // Arrange
        const input = {
          email: 'test@example.com',
          name: 'John',
        };

        // Act
        const result = pipe.transform(input);

        // Assert
        expect(result).toEqual(input);
        expect(result).not.toHaveProperty('age');
      });

      it('should transform data (e.g., trim strings) if schema defines transformations', () => {
        // Arrange
        const schemaWithTransform = z.object({
          email: z
            .string()
            .email()
            .transform((v) => v.toLowerCase()),
        });
        const pipeWithTransform = new ZodValidationPipe(schemaWithTransform);
        const input = { email: 'TEST@EXAMPLE.COM' };

        // Act
        const result = pipeWithTransform.transform(input);

        // Assert
        expect(result.email).toBe('test@example.com');
      });
    });

    describe('with invalid data', () => {
      it('should throw BadRequestException for invalid email', () => {
        // Arrange
        const input = {
          email: 'not-an-email',
          name: 'John',
        };

        // Act & Assert
        expect(() => pipe.transform(input)).toThrow(BadRequestException);
      });

      it('should throw BadRequestException for too short name', () => {
        // Arrange
        const input = {
          email: 'test@example.com',
          name: 'J', // too short
        };

        // Act & Assert
        expect(() => pipe.transform(input)).toThrow(BadRequestException);
      });

      it('should include field-specific errors in exception', () => {
        // Arrange
        const input = {
          email: 'invalid',
          name: 'J',
        };

        // Act & Assert
        try {
          pipe.transform(input);
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          const response = (error as BadRequestException).getResponse() as {
            errors: Record<string, string[]>;
          };
          expect(response.errors).toHaveProperty('email');
          expect(response.errors).toHaveProperty('name');
        }
      });

      it('should include error code in exception', () => {
        // Arrange
        const input = { email: 'invalid', name: 'J' };

        // Act & Assert
        try {
          pipe.transform(input);
          fail('Should have thrown');
        } catch (error) {
          const response = (error as BadRequestException).getResponse() as {
            code: string;
          };
          expect(response.code).toBe('VALIDATION_ERROR');
        }
      });

      it('should handle missing required fields', () => {
        // Arrange
        const input = {}; // missing email and name

        // Act & Assert
        expect(() => pipe.transform(input)).toThrow(BadRequestException);
      });

      it('should handle wrong types', () => {
        // Arrange
        const input = {
          email: 123, // should be string
          name: 'John',
        };

        // Act & Assert
        expect(() => pipe.transform(input)).toThrow(BadRequestException);
      });
    });

    describe('error message formatting', () => {
      it('should format nested path errors correctly', () => {
        // Arrange
        const nestedSchema = z.object({
          user: z.object({
            email: z.string().email(),
          }),
        });
        const nestedPipe = new ZodValidationPipe(nestedSchema);
        const input = { user: { email: 'invalid' } };

        // Act & Assert
        try {
          nestedPipe.transform(input);
          fail('Should have thrown');
        } catch (error) {
          const response = (error as BadRequestException).getResponse() as {
            errors: Record<string, string[]>;
          };
          expect(response.errors['user.email']).toBeDefined();
          expect(response.errors['user.email']).toContain(
            'Invalid email address',
          );
        }
      });

      it('should rethrow non-ZodError errors', () => {
        // Arrange - Create a schema that throws a non-ZodError
        const errorSchema = z.string().transform(() => {
          throw new Error('Custom transform error');
        });
        const errorPipe = new ZodValidationPipe(errorSchema);

        // Act & Assert
        expect(() => errorPipe.transform('test')).toThrow(
          'Custom transform error',
        );
      });

      it('should map root-level issues to _root path', () => {
        // Arrange
        const rootSchema = z.object({}).superRefine((_, ctx) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Root level error',
            path: [],
          });
        });
        const rootPipe = new ZodValidationPipe(rootSchema);

        // Act & Assert
        try {
          rootPipe.transform({});
          fail('Should have thrown');
        } catch (error) {
          const response = (error as BadRequestException).getResponse() as {
            errors: Record<string, string[]>;
          };
          expect(response.errors._root).toContain('Root level error');
        }
      });

      it('should aggregate multiple issues for the same field', () => {
        // Arrange
        const multiIssueSchema = z.object({
          code: z
            .string()
            .min(5, 'Too short')
            .regex(/^\d+$/, 'Must be numeric'),
        });
        const multiIssuePipe = new ZodValidationPipe(multiIssueSchema);

        // Act & Assert
        try {
          multiIssuePipe.transform({ code: 'ABC' });
          fail('Should have thrown');
        } catch (error) {
          const response = (error as BadRequestException).getResponse() as {
            errors: Record<string, string[]>;
          };
          expect(response.errors.code).toEqual([
            'Too short',
            'Must be numeric',
          ]);
        }
      });
    });
  });
});
