import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { snippets, users } from './snippets.schema';

// ========================================
// Enums
// ========================================

/**
 * Comment Status Enum
 * - visible: Comment is visible to all users
 * - hidden: Comment is hidden by moderator
 * - flagged: Comment has been flagged and awaiting moderation
 */
export const commentStatusEnum = pgEnum('comment_status', [
  'visible',
  'hidden',
  'flagged',
]);

/**
 * Comment Flag Reason Enum
 * - spam: Spam or advertising
 * - abuse: Abusive or offensive content
 * - off-topic: Off-topic or irrelevant
 * - other: Other reason (explained in message)
 */
export const commentFlagReasonEnum = pgEnum('comment_flag_reason', [
  'spam',
  'abuse',
  'off-topic',
  'other',
]);

// ========================================
// Comments Table
// ========================================

/**
 * Comments Table - Threaded comments on code snippets
 *
 * BUSINESS RULES:
 * - Each comment belongs to a snippet (Foreign Key with CASCADE DELETE)
 * - Each comment has an optional user (Foreign Key with SET NULL when user deleted)
 * - Comments can be threaded via parentId (replies to other comments)
 * - Comments can be soft-deleted (deletedAt) to preserve thread structure
 * - Comments can be edited (editedAt tracks last edit)
 * - Comments have a status (visible, hidden, flagged)
 * - reply_count is denormalized for performance (maintained by application)
 *
 * PERFORMANCE:
 * - Index on (snippet_id, created_at) for listing comments on a snippet
 * - Index on (parent_id, created_at) for listing replies to a comment
 * - Index on status for moderation queries
 * - Index on user_id for "my comments" queries
 * - Partial index on (snippet_id, created_at) WHERE deleted_at IS NULL (SQL only)
 *
 * SECURITY:
 * - CASCADE DELETE: When snippet is deleted, all comments are deleted
 * - CASCADE DELETE: When parent comment is deleted, all replies are deleted
 * - SET NULL: When user is deleted, comments remain but user_id is NULL
 */
export const comments = pgTable(
  'comments',
  {
    // ========================================
    // PRIMARY KEY
    // ========================================

    id: uuid('id').primaryKey().defaultRandom(),

    // ========================================
    // RELATIONSHIPS
    // ========================================

    /**
     * Foreign Key to Snippets
     * CASCADE DELETE: When snippet is deleted, all comments are deleted
     */
    snippetId: uuid('snippet_id')
      .notNull()
      .references(() => snippets.id, { onDelete: 'cascade' }),

    /**
     * Foreign Key to Users
     * SET NULL: When user is deleted, comment remains but user_id is NULL
     * (This preserves comment threads even if user account is deleted)
     */
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    /**
     * Foreign Key to Comments (self-referencing for threaded comments)
     * CASCADE DELETE: When parent comment is deleted, all replies are deleted
     * NULL for top-level comments
     */

    parentId: uuid('parent_id').references((): any => comments.id, {
      onDelete: 'cascade',
    }),

    // ========================================
    // CONTENT
    // ========================================

    /**
     * Comment body (Markdown supported)
     * Required, no length limit (text type)
     */
    body: text('body').notNull(),

    /**
     * Comment status
     * Default: visible
     */
    status: commentStatusEnum('status').default('visible').notNull(),

    // ========================================
    // SOFT DELETE & EDIT TRACKING
    // ========================================

    /**
     * Soft delete timestamp
     * NULL = not deleted
     * NOT NULL = deleted at this timestamp
     * Soft delete preserves thread structure
     */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    /**
     * Last edit timestamp
     * NULL = never edited
     * NOT NULL = last edited at this timestamp
     */
    editedAt: timestamp('edited_at', { withTimezone: true }),

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

    // ========================================
    // DENORMALIZED METRICS
    // ========================================

    /**
     * Number of direct replies to this comment
     * Denormalized for performance (maintained by application)
     */
    replyCount: integer('reply_count').default(0).notNull(),
  },
  (table) => ({
    // ========================================
    // INDICES (Performance!)
    // ========================================

    /**
     * Index on (snippet_id, created_at)
     * Query: "All comments on a snippet, sorted by date"
     * SELECT * FROM comments WHERE snippet_id = ? ORDER BY created_at DESC
     */
    snippetCreatedIdx: index('comments_snippet_created_idx').on(
      table.snippetId,
      table.createdAt,
    ),

    /**
     * Index on (parent_id, created_at)
     * Query: "All replies to a comment, sorted by date"
     * SELECT * FROM comments WHERE parent_id = ? ORDER BY created_at DESC
     */
    parentCreatedIdx: index('comments_parent_created_idx').on(
      table.parentId,
      table.createdAt,
    ),

    /**
     * Index on status
     * Query: "All flagged/hidden comments" (for moderation)
     * SELECT * FROM comments WHERE status = 'flagged'
     */
    statusIdx: index('comments_status_idx').on(table.status),

    /**
     * Index on user_id
     * Query: "All my comments"
     * SELECT * FROM comments WHERE user_id = ?
     */
    userIdx: index('comments_user_idx').on(table.userId),

    // Note: Partial index for visible comments (deleted_at IS NULL)
    // is created in SQL migration only, as Drizzle doesn't support
    // partial indices in schema definition
  }),
);

/**
 * Comment Type (read from database)
 */
export type Comment = typeof comments.$inferSelect;

/**
 * New Comment Type (for INSERT operations)
 */
export type NewComment = typeof comments.$inferInsert;

// ========================================
// Comment Flags Table (Moderation Reports)
// ========================================

/**
 * Comment Flags Table - User reports for comment moderation
 *
 * BUSINESS RULES:
 * - Users can flag/report comments for moderation
 * - Each flag has a reason (spam, abuse, off-topic, other)
 * - Each flag can have an optional message explaining the report
 * - A user can only flag a comment once per reason (unique constraint)
 * - When comment is deleted, all flags are deleted (CASCADE)
 * - When reporter user is deleted, flags remain but reporter_user_id is NULL
 *
 * PERFORMANCE:
 * - Index on comment_id for finding all flags for a comment
 * - Index on reporter_user_id for finding all flags by a user
 * - Unique index on (comment_id, reporter_user_id, reason) to prevent duplicates
 *
 * SECURITY:
 * - CASCADE DELETE: When comment is deleted, all flags are deleted
 * - SET NULL: When reporter user is deleted, flags remain but reporter_user_id is NULL
 */
export const commentFlags = pgTable(
  'comment_flags',
  {
    // ========================================
    // PRIMARY KEY
    // ========================================

    id: uuid('id').primaryKey().defaultRandom(),

    // ========================================
    // RELATIONSHIPS
    // ========================================

    /**
     * Foreign Key to Comments
     * CASCADE DELETE: When comment is deleted, all flags are deleted
     */

    commentId: uuid('comment_id')
      .notNull()
      .references((): any => comments.id, { onDelete: 'cascade' }),

    /**
     * Foreign Key to Users (reporter)
     * SET NULL: When reporter user is deleted, flag remains but reporter_user_id is NULL
     */
    reporterUserId: uuid('reporter_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    // ========================================
    // FLAG DETAILS
    // ========================================

    /**
     * Flag reason (enum)
     * Required
     */
    reason: commentFlagReasonEnum('reason').notNull(),

    /**
     * Optional message explaining the flag
     * Max 500 characters
     */
    message: varchar('message', { length: 500 }),

    // ========================================
    // TIMESTAMPS
    // ========================================

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // ========================================
    // INDICES (Performance!)
    // ========================================

    /**
     * Index on comment_id
     * Query: "All flags for a comment"
     * SELECT * FROM comment_flags WHERE comment_id = ?
     */
    commentIdx: index('flags_comment_idx').on(table.commentId),

    /**
     * Index on reporter_user_id
     * Query: "All flags by a user"
     * SELECT * FROM comment_flags WHERE reporter_user_id = ?
     */
    reporterIdx: index('flags_reporter_idx').on(table.reporterUserId),

    // Note: Unique constraint on (comment_id, reporter_user_id, reason)
    // is created in SQL migration as a unique index
  }),
);

/**
 * CommentFlag Type (read from database)
 */
export type CommentFlag = typeof commentFlags.$inferSelect;

/**
 * New CommentFlag Type (for INSERT operations)
 */
export type NewCommentFlag = typeof commentFlags.$inferInsert;
