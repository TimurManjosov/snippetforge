ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "display_name" varchar(80),
  ADD COLUMN IF NOT EXISTS "bio" varchar(500),
  ADD COLUMN IF NOT EXISTS "avatar_url" varchar(500),
  ADD COLUMN IF NOT EXISTS "website_url" varchar(200);

-- ROLLBACK:
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "display_name";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "bio";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_url";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "website_url";
