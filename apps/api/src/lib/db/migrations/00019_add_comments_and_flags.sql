-- ========================================
-- Migration: Add Comments and Moderation Flags
-- Description: Creates tables for threaded comments on snippets and moderation flag/report system
-- Commit: 19 - Database – Comments & Moderation Flags (Schema + Migration)
-- ========================================

-- ========================================
-- 1. CREATE ENUMS
-- ========================================

-- Create comment_status enum (visible, hidden, flagged)
DO $$ BEGIN
  CREATE TYPE comment_status AS ENUM ('visible', 'hidden', 'flagged');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create comment_flag_reason enum (spam, abuse, off-topic, other)
DO $$ BEGIN
  CREATE TYPE comment_flag_reason AS ENUM ('spam', 'abuse', 'off-topic', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 2. CREATE COMMENTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id uuid NOT NULL,
  user_id uuid,
  parent_id uuid,
  body text NOT NULL,
  status comment_status NOT NULL DEFAULT 'visible',
  deleted_at timestamptz,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reply_count int NOT NULL DEFAULT 0
);

-- ========================================
-- 3. ADD FOREIGN KEYS TO COMMENTS TABLE
-- ========================================

-- Foreign Key: snippet_id -> snippets.id (CASCADE DELETE)
DO $$ BEGIN
  ALTER TABLE comments ADD CONSTRAINT comments_snippet_id_fk
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Foreign Key: user_id -> users.id (SET NULL)
DO $$ BEGIN
  ALTER TABLE comments ADD CONSTRAINT comments_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Foreign Key: parent_id -> comments.id (CASCADE DELETE)
DO $$ BEGIN
  ALTER TABLE comments ADD CONSTRAINT comments_parent_id_fk
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 4. CREATE INDICES ON COMMENTS TABLE
-- ========================================

-- Index: (snippet_id, created_at) for listing comments on a snippet
CREATE INDEX IF NOT EXISTS comments_snippet_created_idx
  ON comments (snippet_id, created_at);

-- Index: (parent_id, created_at) for listing replies to a comment
CREATE INDEX IF NOT EXISTS comments_parent_created_idx
  ON comments (parent_id, created_at);

-- Index: status for moderation queries
CREATE INDEX IF NOT EXISTS comments_status_idx
  ON comments (status);

-- Index: user_id for "my comments" queries
CREATE INDEX IF NOT EXISTS comments_user_idx
  ON comments (user_id);

-- Partial Index: (snippet_id, created_at) WHERE deleted_at IS NULL
-- This index is used for queries that only want visible (non-deleted) comments
-- Much more efficient than filtering deleted comments in the WHERE clause
CREATE INDEX IF NOT EXISTS comments_visible_partial_idx
  ON comments (snippet_id, created_at)
  WHERE deleted_at IS NULL;

-- ========================================
-- 5. CREATE COMMENT_FLAGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS comment_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  reporter_user_id uuid,
  reason comment_flag_reason NOT NULL,
  message varchar(500),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- 6. ADD FOREIGN KEYS TO COMMENT_FLAGS TABLE
-- ========================================

-- Foreign Key: comment_id -> comments.id (CASCADE DELETE)
DO $$ BEGIN
  ALTER TABLE comment_flags ADD CONSTRAINT comment_flags_comment_id_fk
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Foreign Key: reporter_user_id -> users.id (SET NULL)
DO $$ BEGIN
  ALTER TABLE comment_flags ADD CONSTRAINT comment_flags_reporter_user_id_fk
    FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 7. CREATE UNIQUE CONSTRAINT ON COMMENT_FLAGS
-- ========================================

-- Unique constraint: A user can only flag a comment once per reason
-- Implemented as a unique index for better performance
CREATE UNIQUE INDEX IF NOT EXISTS comment_flags_unique_idx
  ON comment_flags (comment_id, reporter_user_id, reason);

-- ========================================
-- 8. CREATE INDICES ON COMMENT_FLAGS TABLE
-- ========================================

-- Index: comment_id for finding all flags for a comment
CREATE INDEX IF NOT EXISTS flags_comment_idx
  ON comment_flags (comment_id);

-- Index: reporter_user_id for finding all flags by a user
CREATE INDEX IF NOT EXISTS flags_reporter_idx
  ON comment_flags (reporter_user_id);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- This migration creates:
-- - 2 enums: comment_status, comment_flag_reason
-- - 2 tables: comments, comment_flags
-- - 5 foreign keys (3 on comments, 2 on comment_flags)
-- - 9 indices (5 on comments including 1 partial, 3 on comment_flags including 1 unique)
