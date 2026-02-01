// test/unit/dto/snippets/snippet-query.dto.spec.ts

import { z } from 'zod';

const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const LimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

describe('Snippet query schemas', () => {
  it('parses pagination params', () => {
    const result = PaginationQuerySchema.parse({ page: '2', limit: '25' });

    expect(result).toEqual({ page: 2, limit: 25 });
  });

  it('allows missing pagination params', () => {
    const result = PaginationQuerySchema.parse({});

    expect(result).toEqual({});
  });

  it('rejects invalid pagination params', () => {
    expect(() => PaginationQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => PaginationQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it('parses limit params', () => {
    const result = LimitQuerySchema.parse({ limit: '10' });

    expect(result).toEqual({ limit: 10 });
  });
});
