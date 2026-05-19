-- Run if /api/meals returns 500 after migrate-meal-images-and-meal-types.sql
-- Fixes common gaps between SQL migrations and Drizzle (src/db/schema.ts)
-- psql "$DATABASE_URL" -f sql/migrate-fix-drizzle-column-gap.sql

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "ingredients" TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "image_url" TEXT;

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "alternate_recipes" JSONB;

-- Drizzle maps sourceUrl -> source_url (not sourceUrl)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Meal' AND column_name = 'sourceUrl'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Meal' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE "Meal" RENAME COLUMN "sourceUrl" TO "source_url";
  END IF;
END $$;

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "source_url" TEXT;
