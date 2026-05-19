-- DinnerDeck: add description + ingredients to Meal, then backfill starter meals
-- Safe to re-run (ADD COLUMN IF NOT EXISTS; UPDATEs are idempotent by name)
-- Run: psql "$DATABASE_URL" -f sql/migrate-meal-details.sql

-- ---------------------------------------------------------------------------
-- 1. Add new columns
-- ---------------------------------------------------------------------------

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Meal"
  ADD COLUMN IF NOT EXISTS "ingredients" TEXT[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 2. Backfill starter meals (by name)
-- ---------------------------------------------------------------------------

UPDATE "Meal" SET
  "description" = 'Oven-baked salmon with lemon, dill, and capers served with roasted asparagus. Ready in about 25 minutes and naturally low carb.',
  "ingredients" = ARRAY[
    '4 salmon fillets (6 oz each)',
    '2 lemons (juice and zest)',
    '2 tbsp fresh dill, chopped',
    '1 tbsp capers',
    '1 bunch asparagus',
    '2 tbsp olive oil',
    'Salt and black pepper'
  ]::TEXT[]
WHERE "name" = 'Lemon herb salmon';

UPDATE "Meal" SET
  "description" = 'Hearty vegetarian bowls with seasoned black beans, roasted sweet potato, rice, and fresh toppings. Great for meal prep and easy to customize.',
  "ingredients" = ARRAY[
    '2 cups cooked black beans',
    '2 medium sweet potatoes, cubed',
    '1 cup cooked brown rice',
    '1 avocado, sliced',
    '1 lime, juiced',
    '1/4 cup cilantro',
    '1/4 cup crumbled feta',
    'Cumin, chili powder, salt'
  ]::TEXT[]
WHERE "name" = 'Black bean & sweet potato bowls';

UPDATE "Meal" SET
  "description" = 'Seasoned ground turkey with a simple spice blend, served taco-bar style with fresh toppings. Kids can pick their own fixings.',
  "ingredients" = ARRAY[
    '1.5 lb ground turkey',
    '2 tbsp taco seasoning',
    '8–10 corn tortillas',
    '1 head romaine, shredded',
    '2 roma tomatoes, diced',
    '1/2 cup sour cream',
    'Shredded cheese',
    'Jalapeños (optional)'
  ]::TEXT[]
WHERE "name" = 'Turkey taco night';

UPDATE "Meal" SET
  "description" = 'Marinated chicken thighs roasted until crispy, served with cucumber-tomato salad and tzatziki. Mediterranean flavors with minimal carbs.',
  "ingredients" = ARRAY[
    '6 bone-in chicken thighs',
    '3 tbsp olive oil',
    '3 cloves garlic, minced',
    '1 tsp dried oregano',
    '1 cucumber, sliced',
    '1 cup cherry tomatoes',
    '1/4 red onion, thinly sliced',
    '1/2 cup tzatziki',
    'Kalamata olives'
  ]::TEXT[]
WHERE "name" = 'Greek chicken thighs';

UPDATE "Meal" SET
  "description" = 'Crispy tofu and mixed vegetables in a ginger-garlic sauce over jasmine rice. Use frozen stir-fry veg for a fast weeknight win.',
  "ingredients" = ARRAY[
    '14 oz extra firm tofu, pressed and cubed',
    '4 cups mixed stir-fry vegetables',
    '2 cups cooked jasmine rice',
    '2 tbsp sesame oil',
    '1 tbsp soy sauce',
    '1 tbsp fresh ginger, grated',
    '2 cloves garlic, minced',
    '2 green onions, sliced'
  ]::TEXT[]
WHERE "name" = 'Veggie stir fry & tofu';

UPDATE "Meal" SET
  "description" = 'Italian sausage roasted with bell peppers, zucchini, and tomatoes on one pan. Minimal cleanup and ready in under 35 minutes.',
  "ingredients" = ARRAY[
    '1.5 lb Italian sausage links, sliced',
    '2 bell peppers, chunked',
    '2 zucchini, sliced',
    '1 cup cherry tomatoes',
    '2 tbsp olive oil',
    '1 tsp Italian seasoning',
    'Salt and pepper'
  ]::TEXT[]
WHERE "name" = 'Sheet pan sausage & veg';

UPDATE "Meal" SET
  "description" = 'Sautéed shrimp over creamy cauliflower "grits" with parmesan. A lighter take on a Southern classic that still feels special.',
  "ingredients" = ARRAY[
    '1.5 lb raw shrimp, peeled',
    '1 large head cauliflower, riced',
    '1/2 cup heavy cream',
    '1/2 cup grated parmesan',
    '2 tbsp butter',
    '2 cloves garlic, minced',
    '2 green onions, sliced',
    'Old Bay seasoning'
  ]::TEXT[]
WHERE "name" = 'Shrimp & cauliflower grits';

UPDATE "Meal" SET
  "description" = 'Comforting green lentil soup with carrots, celery, and tomatoes. Simmer on the stove and serve with crusty bread for dipping.',
  "ingredients" = ARRAY[
    '1.5 cups green lentils, rinsed',
    '6 cups vegetable or chicken broth',
    '2 carrots, diced',
    '2 celery stalks, diced',
    '1 can diced tomatoes',
    '1 onion, chopped',
    '2 tsp cumin',
    '2 cloves garlic',
    'Sourdough bread for serving'
  ]::TEXT[]
WHERE "name" = 'Lentil soup';
