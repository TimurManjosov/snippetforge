import { ListUsersQuerySchema } from '../../../../src/modules/users/dto/list-users.dto';

describe('ListUsersQuerySchema', () => {
  it('applies defaults when no params provided', () => {
    const result = ListUsersQuerySchema.parse({});
    expect(result).toEqual({
      q: undefined,
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });
  });

  it('trims and accepts q', () => {
    const result = ListUsersQuerySchema.parse({ q: '  alice  ' });
    expect(result.q).toBe('alice');
  });

  it('treats empty q as undefined', () => {
    const result = ListUsersQuerySchema.parse({ q: '   ' });
    expect(result.q).toBeUndefined();
  });

  it('coerces page and limit from strings', () => {
    const result = ListUsersQuerySchema.parse({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('clamps limit to max 100', () => {
    expect(() => ListUsersQuerySchema.parse({ limit: 200 })).toThrow();
  });

  it('rejects page < 1', () => {
    expect(() => ListUsersQuerySchema.parse({ page: 0 })).toThrow();
  });

  it('accepts valid sort values', () => {
    const result = ListUsersQuerySchema.parse({ sort: 'publicSnippetCount' });
    expect(result.sort).toBe('publicSnippetCount');
  });

  it('rejects invalid sort value', () => {
    expect(() => ListUsersQuerySchema.parse({ sort: 'invalid' })).toThrow();
  });

  it('accepts valid order values', () => {
    expect(ListUsersQuerySchema.parse({ order: 'asc' }).order).toBe('asc');
    expect(ListUsersQuerySchema.parse({ order: 'desc' }).order).toBe('desc');
  });
});
