// test/unit/dto/snippets/snippet-params.dto.spec.ts

import { z } from 'zod';

const SnippetIdParamSchema = z.string().uuid();
const SnippetLanguageParamSchema = z
  .string()
  .min(1)
  .max(50)
  .transform((value) => value.toLowerCase().trim())
  .refine(
    (value) => /^[a-z0-9-]+$/.test(value),
    'Language must be lowercase alphanumeric with hyphens',
  );

describe('Snippet param schemas', () => {
  it('validates snippet id', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';

    expect(SnippetIdParamSchema.parse(id)).toBe(id);
  });

  it('rejects invalid snippet id', () => {
    expect(() => SnippetIdParamSchema.parse('invalid')).toThrow();
  });

  it('normalizes snippet language', () => {
    const result = SnippetLanguageParamSchema.parse('TypeScript ');

    expect(result).toBe('typescript');
  });

  it('rejects invalid snippet language', () => {
    expect(() => SnippetLanguageParamSchema.parse('TypeScript!')).toThrow();
  });
});
