import { SnippetQuerySchema } from '../../../../src/modules/snippets/dto/snippet-query.dto';

describe('Snippet query schemas', () => {
  it('normalizes defaults and clamps pagination', () => {
    const result = SnippetQuerySchema.parse({ page: '0', limit: '999' });

    expect(result).toMatchObject({
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      limit: 100,
    });
  });

  it('normalizes q/language/tags', () => {
    const result = SnippetQuerySchema.parse({
      q: '  React  ',
      language: '  TypeScript ',
      tags: ' TypeScript,nodejs,typescript, ,NODEJS ',
    });

    expect(result.q).toBe('react');
    expect(result.language).toBe('typescript');
    expect(result.tags).toEqual(['typescript', 'nodejs']);
  });

  it('falls back for invalid sort and order values', () => {
    const result = SnippetQuerySchema.parse({
      sort: 'invalid',
      order: 'invalid',
    });

    expect(result.sort).toBe('createdAt');
    expect(result.order).toBe('desc');
  });

  it('treats empty q/tags as undefined', () => {
    const result = SnippetQuerySchema.parse({
      q: '   ',
      tags: ' , , ',
    });

    expect(result.q).toBeUndefined();
    expect(result.tags).toBeUndefined();
  });

  it('rejects language longer than 50 chars', () => {
    expect(() =>
      SnippetQuerySchema.parse({ language: 'x'.repeat(51) }),
    ).toThrow();
  });
});
