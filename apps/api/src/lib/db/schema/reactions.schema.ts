import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { snippets, users } from './snippets.schema';

// ========================================
// Enums
// ========================================

/**
 * Reaction Type Enum
 * - like, love, star, laugh, wow, sad, angry
 */
export const reactionTypeEnum = pgEnum('reaction_type', [
  'like',
  'love',
  'star',
  'laugh',
  'wow',
  'sad',
  'angry',
]);

// ========================================
// Snippet Reactions Table
// ========================================

/**
 * Snippet Reactions Table - Emoji reactions on code snippets
 *
 * BUSINESS RULES:
 * - Each reaction belongs to a snippet (Foreign Key with CASCADE DELETE)
 * - Each reaction has an optional user (Foreign Key with SET NULL when user deleted)
 * - A user can only react once per snippet per type (unique constraint)
 *
 * PERFORMANCE:
 * - Index on snippet_id for listing reactions on a snippet
 * - Index on user_id for listing reactions by a user
 * - Composite index on (snippet_id, type) for aggregation queries
 *
 * SECURITY:
 * - CASCADE DELETE: When snippet is deleted, all reactions are deleted
 * - SET NULL: When user is deleted, reactions remain but user_id is NULL
 */
export const snippetReactions = pgTable(
  'snippet_reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    snippetId: uuid('snippet_id')
      .notNull()
      .references(() => snippets.id, { onDelete: 'cascade' }),

    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    type: reactionTypeEnum('type').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    snippetIdx: index('snippet_reactions_snippet_idx').on(table.snippetId),
    userIdx: index('snippet_reactions_user_idx').on(table.userId),
    snippetTypeIdx: index('snippet_reactions_snippet_type_idx').on(
      table.snippetId,
      table.type,
    ),
    uniqueReaction: uniqueIndex('snippet_reactions_unique_idx').on(
      table.snippetId,
      table.userId,
      table.type,
    ),
  }),
);

/**
 * SnippetReaction Type (read from database)
 */
export type SnippetReaction = typeof snippetReactions.$inferSelect;

/**
 * NewSnippetReaction Type (for INSERT operations)
 */
export type NewSnippetReaction = typeof snippetReactions.$inferInsert;
