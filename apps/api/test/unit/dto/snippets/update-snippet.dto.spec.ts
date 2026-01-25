// test/unit/dto/snippets/update-snippet.dto.spec.ts

import {
  UpdateSnippetSchema,
  validateUpdateSnippetDto,
  safeValidateUpdateSnippetDto,
  type UpdateSnippetDto,
} from '../../../../src/modules/snippets/dto/update-snippet.dto';

/**
 * UpdateSnippetDto Unit Tests
 *
 * Testet:
 * - Partial Updates funktionieren
 * - Valide Daten werden transformiert
 * - Invalide Daten werden abgelehnt
 * - Transformationen (trim, lowercase) funktionieren
 * - Nullable description funktioniert
 */
describe('UpdateSnippetDto', () => {
  describe('UpdateSnippetSchema', () => {
    describe('with valid data', () => {
      it('should validate update with all fields', () => {
        // Arrange
        const input = {
          title: 'Updated Title',
          description: 'Updated description',
          code: 'console.log("updated");',
          language: 'typescript',
          isPublic: false,
        };

        // Act
        const result = UpdateSnippetSchema.parse(input);

        // Assert
        expect(result.title).toBe('Updated Title');
        expect(result.description).toBe('Updated description');
        expect(result.code).toBe('console.log("updated");');
        expect(result.language).toBe('typescript');
        expect(result.isPublic).toBe(false);
      });

      it('should validate update with only title', () => {
        // Arrange
        const input = {
          title: 'New Title',
        };

        // Act
        const result = UpdateSnippetSchema.parse(input);

        // Assert
        expect(result.title).toBe('New Title');
        expect(result.description).toBeUndefined();
        expect(result.code).toBeUndefined();
        expect(result.language).toBeUndefined();
        expect(result.isPublic).toBeUndefined();
      });

      it('should validate update with only code', () => {
        // Arrange
        const input = {
          code: 'new code',
        };

        // Act
        const result = UpdateSnippetSchema.parse(input);

        // Assert
        expect(result.code).toBe('new code');
        expect(result.title).toBeUndefined();
      });

      it('should validate update with only isPublic', () => {
        // Arrange
        const input = {
          isPublic: true,
        };

        // Act
        const result = UpdateSnippetSchema.parse(input);

        // Assert
        expect(result.isPublic).toBe(true);
      });

      it('should allow null description to clear it', () => {
        // Arrange
        const input = {
          description: null,
        };

        // Act
        const result = UpdateSnippetSchema.parse(input);

        // Assert
        expect(result.description).toBeNull();
      });

      it('should trim whitespace from title', () => {
        // Arrange
        const input = {
          title: '  Trimmed  ',
        };

        // Act
        const result = UpdateSnippetSchema.parse(input);

        // Assert
        expect(result.title).toBe('Trimmed');
      });

      it('should trim whitespace from description', () => {
        // Arrange
        const input = {
          description: '  Trimmed Description  ',
        };

        // Act
        const result = UpdateSnippetSchema.parse(input);

        // Assert
        expect(result.description).toBe('Trimmed Description');
      });

      it('should convert language to lowercase', () => {
        // Arrange
        const input = {
          language: 'PYTHON',
        };

        // Act
        const result = UpdateSnippetSchema.parse(input);

        // Assert
        expect(result.language).toBe('python');
      });

      it('should validate empty update (no changes)', () => {
        // Arrange
        const input = {};

        // Act
        const result = UpdateSnippetSchema.parse(input);

        // Assert
        expect(result).toEqual({});
      });
    });

    describe('with invalid data', () => {
      it('should reject empty title when provided', () => {
        // Arrange
        const input = {
          title: '',
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject title exceeding 200 characters', () => {
        // Arrange
        const input = {
          title: 'a'.repeat(201),
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject description exceeding 1000 characters', () => {
        // Arrange
        const input = {
          description: 'a'.repeat(1001),
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject empty code when provided', () => {
        // Arrange
        const input = {
          code: '',
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject code exceeding 50000 characters', () => {
        // Arrange
        const input = {
          code: 'a'.repeat(50001),
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject empty language when provided', () => {
        // Arrange
        const input = {
          language: '',
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject language with invalid characters', () => {
        // Arrange
        const input = {
          language: 'C++',
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject language with spaces', () => {
        // Arrange
        const input = {
          language: 'type script',
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject invalid isPublic type', () => {
        // Arrange
        const input = {
          isPublic: 'true',
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject non-boolean isPublic', () => {
        // Arrange
        const input = {
          isPublic: 1,
        };

        // Act & Assert
        expect(() => UpdateSnippetSchema.parse(input)).toThrow();
      });
    });
  });

  describe('validateUpdateSnippetDto', () => {
    it('should parse valid partial update', () => {
      // Arrange
      const input = {
        title: 'Updated',
      };

      // Act
      const result = validateUpdateSnippetDto(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Updated');
    });

    it('should throw on invalid data', () => {
      // Arrange
      const input = {
        title: '',
      };

      // Act & Assert
      expect(() => validateUpdateSnippetDto(input)).toThrow();
    });
  });

  describe('safeValidateUpdateSnippetDto', () => {
    it('should return success for valid data', () => {
      // Arrange
      const input = {
        language: 'rust',
      };

      // Act
      const result = safeValidateUpdateSnippetDto(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.language).toBe('rust');
      }
    });

    it('should return error for invalid data', () => {
      // Arrange
      const input = {
        code: '',
      };

      // Act
      const result = safeValidateUpdateSnippetDto(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should return success for empty update', () => {
      // Arrange
      const input = {};

      // Act
      const result = safeValidateUpdateSnippetDto(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type with all optional fields', () => {
      // Arrange
      const update: UpdateSnippetDto = {
        title: 'Test',
        description: 'desc',
        code: 'code',
        language: 'javascript',
        isPublic: true,
      };

      // Assert - TypeScript should not complain
      expect(update.title).toBeDefined();
    });

    it('should allow partial updates', () => {
      // Arrange
      const update: UpdateSnippetDto = {
        title: 'Only title',
      };

      // Assert - TypeScript should not complain
      expect(update.title).toBeDefined();
    });

    it('should allow null description', () => {
      // Arrange
      const update: UpdateSnippetDto = {
        description: null,
      };

      // Assert - TypeScript should not complain
      expect(update.description).toBeNull();
    });
  });
});
