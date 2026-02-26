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
    displayName: varchar('display_name', { length: 80 }),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    websiteUrl: varchar('website_url', { length: 200 }),
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
 * Snippets Table - Code Snippets created by Users
 *
 * BUSINESS RULES:
 * - Each snippet belongs to a user (Foreign Key with CASCADE DELETE)
 * - Title is required, max 200 characters
 * - Code is required, max 50,000 characters
 * - Language is required (e.g. "typescript", "python")
 * - Description is optional
 * - isPublic defaults to true (Snippets are public by default)
 * - viewCount is automatically incremented
 *
 * PERFORMANCE:
 * - Index on userId (for "my snippets" queries)
 * - Index on language (for "all TypeScript snippets" queries)
 * - Index on createdAt (for sorting)
 * - Composite index on (isPublic, createdAt) for common query pattern
 *
 * SECURITY:
 * - CASCADE DELETE: When user is deleted, their snippets are also deleted
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
     * Snippet title
     * Max 200 characters (for clarity)
     */
    title: varchar('title', { length: 200 }).notNull(),

    /**
     * Optional description
     * Explains what the code does
     */
    description: text('description'),

    /**
     * The actual code
     * Max 50,000 characters (prevents excessively large files)
     */
    code: text('code').notNull(),

    /**
     * Programming language
     * Used for syntax highlighting
     * Examples: "typescript", "python", "javascript", "rust"
     */
    language: varchar('language', { length: 50 }).notNull(),

    // ========================================
    // RELATIONSHIPS
    // ========================================
    /**
     * Foreign Key to Users
     * CASCADE DELETE: When user is deleted, their snippets are also deleted
     */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // ========================================
    // VISIBILITY & METRICS
    // ========================================

    /**
     * Visibility
     * true = Public (everyone can see)
     * false = Private (only owner can see)
     */
    isPublic: boolean('is_public').default(true).notNull(),

    /**
     * Number of views
     * Incremented when someone opens the snippet
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
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // ========================================
    // INDICES (Performance!)
    // ========================================

    /**
     * Index on userId
     * Query: "All my snippets" (SELECT * FROM snippets WHERE user_id = ?)
     * Without index: Full Table Scan
     * With index: Index Scan (10-1000x faster)
     */
    userIdIdx: index('snippets_user_id_idx').on(table.userId),

    /**
     * Index on language
     * Query: "All TypeScript snippets" (SELECT * FROM snippets WHERE language = 'typescript')
     */
    languageIdx: index('snippets_language_idx').on(table.language),

    /**
     * Index on createdAt
     * Query: Sort by date (ORDER BY created_at DESC)
     */
    createdAtIdx: index('snippets_created_at_idx').on(table.createdAt),

    /**
     * Composite index for most common query: "Public snippets sorted by date"
     * Query: SELECT * FROM snippets WHERE is_public = true ORDER BY created_at DESC
     */
    publicCreatedAtIdx: index('snippets_public_created_at_idx').on(
      table.isPublic,
      table.createdAt,
    ),
  }),
);

/**
 * Snippet Type (read from database)
 */
export type Snippet = typeof snippets.$inferSelect;
/**
 * New Snippet Type (for INSERT operations)
 */
export type NewSnippet = typeof snippets.$inferInsert;
