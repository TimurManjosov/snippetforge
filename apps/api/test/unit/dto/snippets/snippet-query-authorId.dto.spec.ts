import { SnippetQuerySchema } from '../../../../src/modules/snippets/dto/snippet-query.dto';

describe('SnippetQuerySchema – authorId', () => {
  it('accepts a valid UUID as authorId', () => {
    const result = SnippetQuerySchema.parse({
      authorId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.authorId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects non-UUID authorId', () => {
    expect(() =>
      SnippetQuerySchema.parse({ authorId: 'not-a-uuid' }),
    ).toThrow();
  });

  it('allows authorId to be omitted', () => {
    const result = SnippetQuerySchema.parse({});
    expect(result.authorId).toBeUndefined();
  });

  it('authorId coexists with other filters', () => {
    const result = SnippetQuerySchema.parse({
      authorId: '550e8400-e29b-41d4-a716-446655440000',
      q: 'react',
      sort: 'createdAt',
      page: '2',
      limit: '10',
    });
    expect(result.authorId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.q).toBe('react');
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });
});
