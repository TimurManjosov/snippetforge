import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { snippets, users } from './snippets.schema';

// ========================================
// Favorites Table
// ========================================

/**
 * Favorites Table - Users can favorite snippets
 *
 * BUSINESS RULES:
 * - Each favorite links a user to a snippet
 * - A user can favorite a snippet only once (unique constraint)
 * - CASCADE DELETE on both user and snippet
 *
 * PERFORMANCE:
 * - Index on (user_id, created_at) for listing favorites
 * - Unique index on (user_id, snippet_id) for idempotent add
 */
export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    snippetId: uuid('snippet_id')
      .notNull()
      .references(() => snippets.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userCreatedIdx: index('favorites_user_created_idx').on(
      table.userId,
      table.createdAt,
    ),
    uniqueFavorite: uniqueIndex('favorites_user_snippet_unique').on(
      table.userId,
      table.snippetId,
    ),
  }),
);

/**
 * Favorite Type (read from database)
 */
export type Favorite = typeof favorites.$inferSelect;

/**
 * NewFavorite Type (for INSERT operations)
 */
export type NewFavorite = typeof favorites.$inferInsert;
