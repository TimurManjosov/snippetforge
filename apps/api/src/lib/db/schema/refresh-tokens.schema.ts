import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './snippets.schema';

/**
 * Refresh Tokens — one row per active session.
 *
 * SECURITY MODEL
 * - The raw token value never lives in the database. Only its SHA-256 hash
 *   (`tokenHash`) is stored, so a database leak does not yield usable
 *   refresh tokens.
 * - Tokens are single-use. When a token is rotated, its row is marked
 *   revoked (`revokedAt`) and the new row references it via `replacedById`.
 * - Reuse of a revoked token (e.g. an attacker presenting an old value
 *   after the legitimate client has already rotated) is treated as theft:
 *   the service revokes every active token for the user.
 * - `expiresAt` is enforced at the application layer; the row stays in the
 *   table after expiry for audit purposes until a background cleanup runs.
 *
 * INDEXES
 * - `tokenHash` is the lookup path on every refresh attempt — unique.
 * - `(user_id, revoked_at)` accelerates "revoke all sessions for user".
 */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    /** Forward pointer to the row that superseded this one on rotation. */
    replacedById: uuid('replaced_by_id'),
  },
  (table) => ({
    tokenHashIdx: index('refresh_tokens_token_hash_idx').on(table.tokenHash),
    userRevokedIdx: index('refresh_tokens_user_revoked_idx').on(
      table.userId,
      table.revokedAt,
    ),
  }),
);

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
