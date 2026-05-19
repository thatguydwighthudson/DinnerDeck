-- DinnerDeck: meal images, alternate recipes, multi-meal-type week planning
-- Safe to re-run (IF NOT EXISTS / IF EXISTS where applicable)
-- Run: psql "$DATABASE_URL" -f sql/migrate-meal-images-and-meal-types.sql

-- ---------------------------------------------------------------------------
-- 1. Meal: columns required by Drizzle (safe if already present)
-- ---------------------------------------------------------------------------

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "ingredients" TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "image_url" TEXT;

-- Rename legacy camelCase source column if present
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

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "alternate_recipes" JSONB;

-- ---------------------------------------------------------------------------
-- 2. WeekPlan: meal type per slot
-- ---------------------------------------------------------------------------

ALTER TABLE "WeekPlan"
  ADD COLUMN IF NOT EXISTS "meal_type" TEXT NOT NULL DEFAULT 'dinner';

UPDATE "WeekPlan"
SET "meal_type" = 'dinner'
WHERE "meal_type" IS NULL;

DROP INDEX IF EXISTS "WeekPlan_weekStart_dayOfWeek_key";

CREATE UNIQUE INDEX IF NOT EXISTS "WeekPlan_weekStart_dayOfWeek_mealType_key"
  ON "WeekPlan" ("weekStart", "dayOfWeek", "meal_type");
