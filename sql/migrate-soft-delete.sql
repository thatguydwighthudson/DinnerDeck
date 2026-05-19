-- Add soft-delete for meals (library removal preserves history)
ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
