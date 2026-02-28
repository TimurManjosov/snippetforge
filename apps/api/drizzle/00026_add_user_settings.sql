DO $$ BEGIN
  CREATE TYPE ui_theme AS ENUM ('system', 'light', 'dark');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "default_snippet_visibility" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "default_language" varchar(50),
  ADD COLUMN IF NOT EXISTS "ui_theme" ui_theme NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS "items_per_page" int NOT NULL DEFAULT 20;

-- ROLLBACK:
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "default_snippet_visibility";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "default_language";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "ui_theme";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "items_per_page";
-- DROP TYPE IF EXISTS ui_theme;
