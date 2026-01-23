// src/modules/snippets/index.ts

/**
 * Public API des SnippetsModule
 *
 * WARUM Barrel Exports?
 * - Single Import: `import { SnippetsRepository, Snippet } from './modules/snippets'`
 * - Kapselung: Internes bleibt intern
 * - Refactoring: Nur index.ts muss angepasst werden
 */

// Repository
export { SnippetsRepository } from './snippets.repository';
// Types
export * from './snippets.types';
