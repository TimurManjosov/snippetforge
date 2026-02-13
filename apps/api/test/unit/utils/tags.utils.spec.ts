import { slugify } from '../../../src/modules/tags';

describe('slugify', () => {
  it('converts name to lowercase slug', () => {
    expect(slugify('TypeScript')).toBe('typescript');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('Node JS Backend')).toBe('node-js-backend');
  });

  it('removes special characters', () => {
    expect(slugify('C#/.NET')).toBe('cnet');
  });

  it('collapses duplicated hyphens and trims edges', () => {
    expect(slugify('  hello---world  ')).toBe('hello-world');
  });

  it('returns empty string when no valid characters exist', () => {
    expect(slugify('!!!')).toBe('');
  });
});
