-- DinnerDeck: meal type on library meals (for grouping in meal library)
-- Run: psql "$DATABASE_URL" -f sql/migrate-meal-library-type.sql

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "meal_type" TEXT NOT NULL DEFAULT 'dinner';

UPDATE "Meal"
SET "meal_type" = 'dinner'
WHERE "meal_type" IS NULL;
