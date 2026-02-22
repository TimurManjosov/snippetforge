-- ========================================
-- Migration: Add Favorites and Collections
-- Description: Creates tables for favorites, collections, and collection_items
-- Commit: 22 - Backend – Favorites & Collections (DB + API)
-- ========================================

-- ========================================
-- 1. CREATE FAVORITES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snippet_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- 2. ADD FOREIGN KEYS FOR FAVORITES
-- ========================================

DO $$ BEGIN
  ALTER TABLE favorites ADD CONSTRAINT favorites_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE favorites ADD CONSTRAINT favorites_snippet_id_fk
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 3. FAVORITES INDICES
-- ========================================

-- Unique constraint: A user can favorite a snippet only once
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_snippet_unique
  ON favorites (user_id, snippet_id);

-- Index for listing favorites by user ordered by created_at
CREATE INDEX IF NOT EXISTS favorites_user_created_idx
  ON favorites (user_id, created_at);

-- ========================================
-- 4. CREATE COLLECTIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name varchar(200) NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- 5. ADD FOREIGN KEYS FOR COLLECTIONS
-- ========================================

DO $$ BEGIN
  ALTER TABLE collections ADD CONSTRAINT collections_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 6. COLLECTIONS INDICES
-- ========================================

-- Index on user_id for listing collections
CREATE INDEX IF NOT EXISTS collections_user_id_idx
  ON collections (user_id);

-- Unique constraint: Collection names must be unique per user
CREATE UNIQUE INDEX IF NOT EXISTS collections_user_name_unique
  ON collections (user_id, name);

-- ========================================
-- 7. CREATE COLLECTION_ITEMS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id uuid NOT NULL,
  snippet_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, snippet_id)
);

-- ========================================
-- 8. ADD FOREIGN KEYS FOR COLLECTION_ITEMS
-- ========================================

DO $$ BEGIN
  ALTER TABLE collection_items ADD CONSTRAINT collection_items_collection_id_fk
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE collection_items ADD CONSTRAINT collection_items_snippet_id_fk
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 9. COLLECTION_ITEMS INDICES
-- ========================================

-- Index for ordered listing of items in a collection
CREATE INDEX IF NOT EXISTS collection_items_position_idx
  ON collection_items (collection_id, position);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- This migration creates:
-- - 3 tables: favorites, collections, collection_items
-- - 5 foreign keys
-- - 1 unique index on favorites (user_id, snippet_id)
-- - 1 unique index on collections (user_id, name)
-- - 1 composite primary key on collection_items (collection_id, snippet_id)
-- - 3 additional indices
