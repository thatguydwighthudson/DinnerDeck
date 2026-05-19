-- Instructions on meals + week slot flags for eat-out / planned meals
-- Run: psql "$DATABASE_URL" -f sql/migrate-instructions-and-plan-slots.sql

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "instructions" TEXT NOT NULL DEFAULT '';

ALTER TABLE "WeekPlan"
  ADD COLUMN IF NOT EXISTS "is_eat_out" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "WeekPlan"
  ADD COLUMN IF NOT EXISTS "planned_meal" JSONB;
