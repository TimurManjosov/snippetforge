import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Role Enum
export const roleEnum = pgEnum('role', ['USER', 'ADMIN', 'MODERATOR']);

// Users Table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 30 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 60 }).notNull(),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    role: roleEnum('role').default('USER').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    usernameIdx: index('users_username_idx').on(table.username),
    roleIdx: index('users_role_idx').on(table.role),
  }),
);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * Snippets Table - Code Snippets erstellt von Users
 *
 * BUSINESS RULES:
 * - Jeder Snippet gehört einem User (Foreign Key mit CASCADE DELETE)
 * - Title ist Pflicht, max 200 Zeichen
 * - Code ist Pflicht, max 50,000 Zeichen
 * - Language ist Pflicht (z.B. "typescript", "python")
 * - Description ist optional
 * - isPublic default true (Snippets sind standardmäßig öffentlich)
 * - viewCount wird automatisch hochgezählt
 *
 * PERFORMANCE:
 * - Index auf userId (für "meine Snippets" Query)
 * - Index auf language (für "alle TypeScript Snippets" Query)
 * - Index auf createdAt (für Sortierung)
 * - Index auf isPublic (für "alle öffentlichen Snippets" Query)
 *
 * SECURITY:
 * - CASCADE DELETE:  Wenn User gelöscht wird, werden seine Snippets auch gelöscht
 */
export const snippets = pgTable(
  'snippets',
  {
    // ========================================
    // PRIMARY KEY
    // ========================================

    id: uuid('id').primaryKey().defaultRandom(),

    // ========================================
    // SNIPPET CONTENT
    // ========================================

    /**
     * Titel des Snippets
     * Max 200 Zeichen (für Übersichtlichkeit)
     */
    title: varchar('title', { length: 200 }).notNull(),

    /** Optionale Beschreibung
     * Erklärt was der Code macht
     */
    description: text('description'),

    /**
     * Der eigentliche Code
     * Max 50,000 Zeichen (verhindert zu große Files)
     */
    code: text('code').notNull(),

    /**
     * Programmiersprache
     * Verwendet für Syntax Highlighting
     * Beispiele: "typescript", "python", "javascript", "rust"
     */
    language: varchar('language', { length: 50 }).notNull(),

    // ========================================
    // RELATIONSHIPS
    // ========================================
    /**
     * Foreign Key zu Users
     * CASCADE DELETE: Wenn User gelöscht wird, werden seine Snippets auch gelöscht
     */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // ========================================
    // VISIBILITY & METRICS
    // ========================================

    /**
     * Sichtbarkeit
     * true = Öffentlich (jeder kann sehen)
     * false = Privat (nur Owner kann sehen)
     */
    isPublic: boolean('is_public').default(true).notNull(),

    /**
     * Anzahl der Views
     * Wird hochgezählt wenn jemand den Snippet öffnet
     */
    viewCount: integer('view_count').default(0).notNull(),

    // ========================================
    // TIMESTAMPS
    // ========================================

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // ========================================
    // INDICES (Performance!)
    // ========================================

    /**
     * Index auf userId
     * Query:  "Alle meine Snippets" (SELECT * FROM snippets WHERE user_id = ?)
     * Ohne Index: Full Table Scan
     * Mit Index: Index Scan (10-1000x schneller)
     */
    userIdIdx: index('snippets_user_id_idx').on(table.userId),

    /**
     * Index auf language
     * Query: "Alle TypeScript Snippets" (SELECT * FROM snippets WHERE language = 'typescript')
     */
    languageIdx: index('snippets_language_idx').on(table.language),

    /**
     * Index auf createdAt
     * Query:  Sortierung nach Datum (ORDER BY created_at DESC)
     */
    createdAtIdx: index('snippets_created_at_idx').on(table.createdAt),

    /**
     * Index auf isPublic
     * Query: "Alle öffentlichen Snippets" (SELECT * FROM snippets WHERE is_public = true)
     */
    publicIdx: index('snippets_is_public_idx').on(table.isPublic),

    /**
     * Composite Index für häufigste Query:   "Öffentliche Snippets sortiert nach Datum"
     * Query: SELECT * FROM snippets WHERE is_public = true ORDER BY created_at DESC
     */
    publicCreatedAtIdx: index('snippets_public_created_at_idx').on(
      table.isPublic,
      table.createdAt,
    ),
  }),
);

/**
 * Snippet Type (aus DB gelesen)
 */
export type Snippet = typeof snippets.$inferSelect;
/**
 * New Snippet Type (für INSERT)
 */
export type NewSnippet = typeof snippets.$inferInsert;
