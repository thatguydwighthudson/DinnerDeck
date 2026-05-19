-- Meal notes, serving info from recipes, and related fields
-- Run: psql "$DATABASE_URL" -f sql/migrate-meal-notes-serving.sql

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "notes" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "serving_size" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "serving_weight" TEXT NOT NULL DEFAULT '';
