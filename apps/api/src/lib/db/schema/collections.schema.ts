import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { snippets, users } from './snippets.schema';

// ========================================
// Collections Table
// ========================================

/**
 * Collections Table - Users can group snippets into named collections
 *
 * BUSINESS RULES:
 * - Each collection belongs to a user (CASCADE DELETE)
 * - Collection names must be unique per user
 * - isPublic controls visibility (public = anyone, private = owner/admin only)
 *
 * PERFORMANCE:
 * - Index on user_id for listing collections
 * - Unique index on (user_id, name) for name uniqueness
 */
export const collections = pgTable(
  'collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 200 }).notNull(),

    description: text('description'),

    isPublic: boolean('is_public').default(false).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('collections_user_id_idx').on(table.userId),
    uniqueName: uniqueIndex('collections_user_name_unique').on(
      table.userId,
      table.name,
    ),
  }),
);

/**
 * Collection Type (read from database)
 */
export type Collection = typeof collections.$inferSelect;

/**
 * NewCollection Type (for INSERT operations)
 */
export type NewCollection = typeof collections.$inferInsert;

// ========================================
// Collection Items Table
// ========================================

/**
 * Collection Items Table - Junction table between collections and snippets
 *
 * BUSINESS RULES:
 * - A snippet can appear in a collection only once (composite PK)
 * - Position controls ordering within a collection
 * - CASCADE DELETE on both collection and snippet
 *
 * PERFORMANCE:
 * - Index on (collection_id, position) for ordered listing
 */
export const collectionItems = pgTable(
  'collection_items',
  {
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),

    snippetId: uuid('snippet_id')
      .notNull()
      .references(() => snippets.id, { onDelete: 'cascade' }),

    position: integer('position').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collectionId, table.snippetId] }),
    positionIdx: index('collection_items_position_idx').on(
      table.collectionId,
      table.position,
    ),
  }),
);

/**
 * CollectionItem Type (read from database)
 */
export type CollectionItem = typeof collectionItems.$inferSelect;

/**
 * NewCollectionItem Type (for INSERT operations)
 */
export type NewCollectionItem = typeof collectionItems.$inferInsert;
