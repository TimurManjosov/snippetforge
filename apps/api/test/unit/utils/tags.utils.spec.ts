// test/unit/utils/tags.utils.spec.ts

import { slugify } from '../../../src/modules/tags/tags.utils';

/**
 * Tags Utils Unit Tests
 *
 * Tests for slugify function
 */
describe('Tags Utils', () => {
  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('TypeScript')).toBe('typescript');
      expect(slugify('REACT')).toBe('react');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('React Hooks')).toBe('react-hooks');
      expect(slugify('Node.js Express')).toBe('nodejs-express');
    });

    it('should remove non-alphanumeric characters', () => {
      expect(slugify('C++')).toBe('c');
      expect(slugify('Node.js')).toBe('nodejs');
      expect(slugify('C#')).toBe('c');
    });

    it('should replace multiple spaces/hyphens with single hyphen', () => {
      expect(slugify('React    Hooks')).toBe('react-hooks');
      expect(slugify('React--Hooks')).toBe('react-hooks');
    });

    it('should trim hyphens from start and end', () => {
      expect(slugify('-typescript-')).toBe('typescript');
      expect(slugify('--react--')).toBe('react');
    });

    it('should handle complex cases', () => {
      expect(slugify('TypeScript & React')).toBe('typescript-react');
      expect(slugify('Node.js & Express.js')).toBe('nodejs-expressjs');
      expect(slugify('Vue.js 3.0')).toBe('vuejs-30');
    });

    it('should handle edge cases', () => {
      expect(slugify('')).toBe('');
      expect(slugify('   ')).toBe('');
      expect(slugify('!!!')).toBe('');
      expect(slugify('a')).toBe('a');
    });

    it('should preserve hyphens between words', () => {
      expect(slugify('next-auth')).toBe('next-auth');
      expect(slugify('styled-components')).toBe('styled-components');
    });

    it('should trim whitespace', () => {
      expect(slugify('  TypeScript  ')).toBe('typescript');
      expect(slugify('\tReact\n')).toBe('react');
    });
  });
});
