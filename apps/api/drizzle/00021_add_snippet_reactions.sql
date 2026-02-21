-- ========================================
-- Migration: Add Snippet Reactions
-- Description: Creates table for emoji reactions on snippets (like, love, star, laugh, wow, sad, angry)
-- Commit: 21 - Backend – Reactions API (Likes/Stars/Emojis) + Aggregation
-- ========================================

-- ========================================
-- 1. CREATE ENUM
-- ========================================

-- Create reaction_type enum
DO $$ BEGIN
  CREATE TYPE reaction_type AS ENUM ('like', 'love', 'star', 'laugh', 'wow', 'sad', 'angry');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 2. CREATE SNIPPET_REACTIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS snippet_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id uuid NOT NULL,
  user_id uuid,
  type reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- 3. ADD FOREIGN KEYS
-- ========================================

-- Foreign Key: snippet_id -> snippets.id (CASCADE DELETE)
DO $$ BEGIN
  ALTER TABLE snippet_reactions ADD CONSTRAINT snippet_reactions_snippet_id_fk
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Foreign Key: user_id -> users.id (SET NULL)
DO $$ BEGIN
  ALTER TABLE snippet_reactions ADD CONSTRAINT snippet_reactions_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 4. CREATE UNIQUE CONSTRAINT
-- ========================================

-- Unique constraint: A user can only react once per snippet per type
CREATE UNIQUE INDEX IF NOT EXISTS snippet_reactions_unique_idx
  ON snippet_reactions (snippet_id, user_id, type);

-- ========================================
-- 5. CREATE INDICES
-- ========================================

-- Index: snippet_id for listing reactions on a snippet
CREATE INDEX IF NOT EXISTS snippet_reactions_snippet_idx
  ON snippet_reactions (snippet_id);

-- Index: user_id for listing reactions by a user
CREATE INDEX IF NOT EXISTS snippet_reactions_user_idx
  ON snippet_reactions (user_id);

-- Index: (snippet_id, type) for aggregation queries
CREATE INDEX IF NOT EXISTS snippet_reactions_snippet_type_idx
  ON snippet_reactions (snippet_id, type);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- This migration creates:
-- - 1 enum: reaction_type
-- - 1 table: snippet_reactions
-- - 2 foreign keys (snippet_id, user_id)
-- - 1 unique index (snippet_id, user_id, type)
-- - 3 indices (snippet_id, user_id, snippet_id+type)
