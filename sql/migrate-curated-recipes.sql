-- DinnerDeck: curated recipe catalog (hidden from meal library until copied)
-- Safe to re-run (IF NOT EXISTS / IF NOT EXISTS on columns and indexes)
-- Run in Neon: paste in SQL editor or psql "$DATABASE_URL" -f sql/migrate-curated-recipes.sql

-- ---------------------------------------------------------------------------
-- 1. Curated recipe catalog (system-owned, not shown in library UI)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "CuratedRecipe" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "source_url" TEXT NOT NULL,
  "meal_type" TEXT NOT NULL DEFAULT 'dinner',
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "isVeg" BOOLEAN NOT NULL DEFAULT FALSE,
  "emoji" TEXT NOT NULL DEFAULT '🍽',
  -- Full meal payload after one-time import/enrichment (matches app meal shape).
  -- NULL until enriched; suggest should only pick rows where enriched IS NOT NULL
  -- OR you accept on-demand import when copying to library.
  "enriched" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order" INTEGER,
  "curator_notes" TEXT NOT NULL DEFAULT '',
  -- Set when this row is picked for "Suggest this week"; used for 14-day re-suggest cooldown
  "last_suggested_at" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CuratedRecipe_meal_type_check"
    CHECK ("meal_type" IN ('breakfast', 'lunch', 'snack', 'dinner', 'dessert'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "CuratedRecipe_source_url_key"
  ON "CuratedRecipe" ("source_url");

CREATE INDEX IF NOT EXISTS "CuratedRecipe_meal_type_active_idx"
  ON "CuratedRecipe" ("meal_type", "active")
  WHERE "active" = TRUE;

CREATE INDEX IF NOT EXISTS "CuratedRecipe_enriched_null_idx"
  ON "CuratedRecipe" ("id")
  WHERE "enriched" IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Link library meals back to catalog (dedup / analytics)
-- ---------------------------------------------------------------------------

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "catalog_recipe_id" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Meal_catalog_recipe_id_fkey'
  ) THEN
    ALTER TABLE "Meal"
      ADD CONSTRAINT "Meal_catalog_recipe_id_fkey"
      FOREIGN KEY ("catalog_recipe_id")
      REFERENCES "CuratedRecipe" ("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Meal_catalog_recipe_id_idx"
  ON "Meal" ("catalog_recipe_id")
  WHERE "catalog_recipe_id" IS NOT NULL;

-- If you already ran an earlier version of this migration without last_suggested_at:
ALTER TABLE "CuratedRecipe"
  ADD COLUMN IF NOT EXISTS "last_suggested_at" TIMESTAMP(3);

-- ---------------------------------------------------------------------------
-- enriched JSONB shape (documented for seed/enrichment scripts):
-- {
--   "name": "...",
--   "emoji": "🍗",
--   "tags": ["high-protein", "balanced"],
--   "isVeg": false,
--   "proteinG": 35,
--   "carbsG": 12,
--   "fatG": 18,
--   "notes": "",
--   "servingSize": "4 servings",
--   "servingWeight": "~350g per serving",
--   "description": "...",
--   "instructions": "...",
--   "ingredients": ["..."],
--   "samItems": ["..."],
--   "htItems": ["..."],
--   "sourceUrl": "https://..."
-- }
-- ---------------------------------------------------------------------------
