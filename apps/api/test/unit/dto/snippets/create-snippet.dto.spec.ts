// test/unit/dto/snippets/create-snippet.dto.spec.ts

import {
  CreateSnippetSchema,
  validateCreateSnippetDto,
  safeValidateCreateSnippetDto,
  type CreateSnippetDto,
} from '../../../../src/modules/snippets/dto/create-snippet.dto';

/**
 * CreateSnippetDto Unit Tests
 *
 * Testet:
 * - Valide Daten werden transformiert
 * - Invalide Daten werden abgelehnt
 * - Transformationen (trim, lowercase) funktionieren
 * - Validierung Rules eingehalten werden
 */
describe('CreateSnippetDto', () => {
  describe('CreateSnippetSchema', () => {
    describe('with valid data', () => {
      it('should validate a complete snippet with all fields', () => {
        // Arrange
        const input = {
          title: 'Test Snippet',
          description: 'This is a test snippet',
          code: 'console.log("Hello World");',
          language: 'javascript',
          isPublic: true,
        };

        // Act
        const result = CreateSnippetSchema.parse(input);

        // Assert
        expect(result.title).toBe('Test Snippet');
        expect(result.description).toBe('This is a test snippet');
        expect(result.code).toBe('console.log("Hello World");');
        expect(result.language).toBe('javascript');
        expect(result.isPublic).toBe(true);
      });

      it('should validate snippet without optional fields', () => {
        // Arrange
        const input = {
          title: 'Minimal Snippet',
          code: 'print("Hello")',
          language: 'python',
        };

        // Act
        const result = CreateSnippetSchema.parse(input);

        // Assert
        expect(result.title).toBe('Minimal Snippet');
        expect(result.code).toBe('print("Hello")');
        expect(result.language).toBe('python');
        expect(result.description).toBeUndefined();
        expect(result.isPublic).toBe(true); // default value
      });

      it('should trim whitespace from title', () => {
        // Arrange
        const input = {
          title: '  Trimmed Title  ',
          code: 'code',
          language: 'typescript',
        };

        // Act
        const result = CreateSnippetSchema.parse(input);

        // Assert
        expect(result.title).toBe('Trimmed Title');
      });

      it('should trim whitespace from description', () => {
        // Arrange
        const input = {
          title: 'Test',
          description: '  Trimmed Description  ',
          code: 'code',
          language: 'typescript',
        };

        // Act
        const result = CreateSnippetSchema.parse(input);

        // Assert
        expect(result.description).toBe('Trimmed Description');
      });

      it('should convert language to lowercase', () => {
        // Arrange
        const input = {
          title: 'Test',
          code: 'code',
          language: 'TypeScript',
        };

        // Act
        const result = CreateSnippetSchema.parse(input);

        // Assert
        expect(result.language).toBe('typescript');
      });

      it('should accept hyphenated language names', () => {
        // Arrange
        const input = {
          title: 'Test',
          code: 'code',
          language: 'c-sharp',
        };

        // Act
        const result = CreateSnippetSchema.parse(input);

        // Assert
        expect(result.language).toBe('c-sharp');
      });

      it('should accept numeric language names', () => {
        // Arrange
        const input = {
          title: 'Test',
          code: 'code',
          language: 'c99',
        };

        // Act
        const result = CreateSnippetSchema.parse(input);

        // Assert
        expect(result.language).toBe('c99');
      });
    });

    describe('with invalid data', () => {
      it('should reject empty title', () => {
        // Arrange
        const input = {
          title: '',
          code: 'code',
          language: 'javascript',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject title exceeding 200 characters', () => {
        // Arrange
        const input = {
          title: 'a'.repeat(201),
          code: 'code',
          language: 'javascript',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject description exceeding 1000 characters', () => {
        // Arrange
        const input = {
          title: 'Test',
          description: 'a'.repeat(1001),
          code: 'code',
          language: 'javascript',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject empty code', () => {
        // Arrange
        const input = {
          title: 'Test',
          code: '',
          language: 'javascript',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject code exceeding 50000 characters', () => {
        // Arrange
        const input = {
          title: 'Test',
          code: 'a'.repeat(50001),
          language: 'javascript',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject empty language', () => {
        // Arrange
        const input = {
          title: 'Test',
          code: 'code',
          language: '',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject language with spaces', () => {
        // Arrange
        const input = {
          title: 'Test',
          code: 'code',
          language: 'java script',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject language with uppercase and special chars', () => {
        // Arrange
        const input = {
          title: 'Test',
          code: 'code',
          language: 'JavaScript!',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject missing required fields', () => {
        // Arrange
        const input = {
          title: 'Test',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });

      it('should reject invalid isPublic type', () => {
        // Arrange
        const input = {
          title: 'Test',
          code: 'code',
          language: 'javascript',
          isPublic: 'yes',
        };

        // Act & Assert
        expect(() => CreateSnippetSchema.parse(input)).toThrow();
      });
    });
  });

  describe('validateCreateSnippetDto', () => {
    it('should parse valid data', () => {
      // Arrange
      const input = {
        title: 'Test',
        code: 'console.log("test");',
        language: 'javascript',
      };

      // Act
      const result = validateCreateSnippetDto(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Test');
    });

    it('should throw on invalid data', () => {
      // Arrange
      const input = {
        title: '',
        code: 'code',
        language: 'javascript',
      };

      // Act & Assert
      expect(() => validateCreateSnippetDto(input)).toThrow();
    });
  });

  describe('safeValidateCreateSnippetDto', () => {
    it('should return success for valid data', () => {
      // Arrange
      const input = {
        title: 'Test',
        code: 'code',
        language: 'javascript',
      };

      // Act
      const result = safeValidateCreateSnippetDto(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test');
      }
    });

    it('should return error for invalid data', () => {
      // Arrange
      const input = {
        title: '',
        code: 'code',
        language: 'javascript',
      };

      // Act
      const result = safeValidateCreateSnippetDto(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      // Arrange
      const snippet: CreateSnippetDto = {
        title: 'Test',
        code: 'code',
        language: 'javascript',
        description: 'optional',
        isPublic: false,
      };

      // Assert - TypeScript should not complain
      expect(snippet.title).toBeDefined();
      expect(snippet.code).toBeDefined();
      expect(snippet.language).toBeDefined();
    });
  });
});
