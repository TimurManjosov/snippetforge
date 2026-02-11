import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { snippets } from './snippets.schema';

// ========================================
// Tags Table
// ========================================

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Types
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

// ========================================
// Snippet-Tags Join Table (Many-to-Many)
// ========================================

export const snippetTags = pgTable(
  'snippet_tags',
  {
    snippetId: uuid('snippet_id')
      .notNull()
      .references(() => snippets.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.snippetId, table.tagId] }),
    snippetIdIdx: index('snippet_tags_snippet_id_idx').on(table.snippetId),
    tagIdIdx: index('snippet_tags_tag_id_idx').on(table.tagId),
  }),
);

// Types
export type SnippetTag = typeof snippetTags.$inferSelect;
export type NewSnippetTag = typeof snippetTags.$inferInsert;
