-- DinnerDeck seed data (with descriptions + ingredients)
-- Safe to re-run only on empty tables (uses WHERE NOT EXISTS).

INSERT INTO "Meal" (
  "name", "emoji", "tags", "isVeg", "isFavorite",
  "proteinG", "carbsG", "fatG", "description", "ingredients", "samItems", "htItems"
)
SELECT * FROM (VALUES
  (
    'Lemon herb salmon', '🐟',
    ARRAY['high-protein', 'low-carb']::TEXT[], FALSE, TRUE,
    42, 4, 18,
    'Oven-baked salmon with lemon, dill, and capers served with roasted asparagus. Ready in about 25 minutes and naturally low carb.',
    ARRAY['4 salmon fillets (6 oz each)', '2 lemons (juice and zest)', '2 tbsp fresh dill, chopped', '1 tbsp capers', '1 bunch asparagus', '2 tbsp olive oil', 'Salt and black pepper']::TEXT[],
    ARRAY['Salmon fillet (2lb)', 'Olive oil']::TEXT[],
    ARRAY['Lemons', 'Fresh dill', 'Capers', 'Asparagus']::TEXT[]
  ),
  (
    'Black bean & sweet potato bowls', '🥘',
    ARRAY['vegetarian', 'balanced', 'high-protein']::TEXT[], TRUE, FALSE,
    22, 48, 8,
    'Hearty vegetarian bowls with seasoned black beans, roasted sweet potato, rice, and fresh toppings. Great for meal prep and easy to customize.',
    ARRAY['2 cups cooked black beans', '2 medium sweet potatoes, cubed', '1 cup cooked brown rice', '1 avocado, sliced', '1 lime, juiced', '1/4 cup cilantro', '1/4 cup crumbled feta', 'Cumin, chili powder, salt']::TEXT[],
    ARRAY['Black beans (bulk)', 'Brown rice (bulk)']::TEXT[],
    ARRAY['Sweet potatoes', 'Avocado', 'Lime', 'Cilantro', 'Feta']::TEXT[]
  ),
  (
    'Turkey taco night', '🌮',
    ARRAY['high-protein', 'balanced']::TEXT[], FALSE, TRUE,
    38, 22, 12,
    'Seasoned ground turkey with a simple spice blend, served taco-bar style with fresh toppings. Kids can pick their own fixings.',
    ARRAY['1.5 lb ground turkey', '2 tbsp taco seasoning', '8–10 corn tortillas', '1 head romaine, shredded', '2 roma tomatoes, diced', '1/2 cup sour cream', 'Shredded cheese', 'Jalapeños (optional)']::TEXT[],
    ARRAY['Ground turkey (3lb)', 'Shredded cheese (bulk)']::TEXT[],
    ARRAY['Corn tortillas', 'Romaine', 'Tomatoes', 'Jalapeños', 'Sour cream']::TEXT[]
  ),
  (
    'Greek chicken thighs', '🍗',
    ARRAY['high-protein', 'low-carb']::TEXT[], FALSE, FALSE,
    45, 6, 16,
    'Marinated chicken thighs roasted until crispy, served with cucumber-tomato salad and tzatziki. Mediterranean flavors with minimal carbs.',
    ARRAY['6 bone-in chicken thighs', '3 tbsp olive oil', '3 cloves garlic, minced', '1 tsp dried oregano', '1 cucumber, sliced', '1 cup cherry tomatoes', '1/4 red onion, thinly sliced', '1/2 cup tzatziki', 'Kalamata olives']::TEXT[],
    ARRAY['Chicken thighs (4lb)', 'Kalamata olives']::TEXT[],
    ARRAY['Cucumber', 'Cherry tomatoes', 'Red onion', 'Tzatziki']::TEXT[]
  ),
  (
    'Veggie stir fry & tofu', '🥦',
    ARRAY['vegetarian', 'balanced']::TEXT[], TRUE, FALSE,
    24, 28, 10,
    'Crispy tofu and mixed vegetables in a ginger-garlic sauce over jasmine rice. Use frozen stir-fry veg for a fast weeknight win.',
    ARRAY['14 oz extra firm tofu, pressed and cubed', '4 cups mixed stir-fry vegetables', '2 cups cooked jasmine rice', '2 tbsp sesame oil', '1 tbsp soy sauce', '1 tbsp fresh ginger, grated', '2 cloves garlic, minced', '2 green onions, sliced']::TEXT[],
    ARRAY['Extra firm tofu', 'Frozen stir-fry veg']::TEXT[],
    ARRAY['Bok choy', 'Sesame oil', 'Ginger', 'Garlic', 'Jasmine rice']::TEXT[]
  ),
  (
    'Sheet pan sausage & veg', '🥩',
    ARRAY['high-protein', 'low-carb']::TEXT[], FALSE, TRUE,
    36, 14, 22,
    'Italian sausage roasted with bell peppers, zucchini, and tomatoes on one pan. Minimal cleanup and ready in under 35 minutes.',
    ARRAY['1.5 lb Italian sausage links, sliced', '2 bell peppers, chunked', '2 zucchini, sliced', '1 cup cherry tomatoes', '2 tbsp olive oil', '1 tsp Italian seasoning', 'Salt and pepper']::TEXT[],
    ARRAY['Italian sausage (bulk)', 'Bell peppers (bag)']::TEXT[],
    ARRAY['Zucchini', 'Cherry tomatoes', 'Broccolini']::TEXT[]
  ),
  (
    'Shrimp & cauliflower grits', '🦐',
    ARRAY['high-protein', 'low-carb']::TEXT[], FALSE, FALSE,
    34, 12, 14,
    'Sautéed shrimp over creamy cauliflower "grits" with parmesan. A lighter take on a Southern classic that still feels special.',
    ARRAY['1.5 lb raw shrimp, peeled', '1 large head cauliflower, riced', '1/2 cup heavy cream', '1/2 cup grated parmesan', '2 tbsp butter', '2 cloves garlic, minced', '2 green onions, sliced', 'Old Bay seasoning']::TEXT[],
    ARRAY['Raw shrimp 2lb', 'Butter']::TEXT[],
    ARRAY['Cauliflower', 'Heavy cream', 'Parmesan', 'Green onions']::TEXT[]
  ),
  (
    'Lentil soup', '🍲',
    ARRAY['vegetarian', 'balanced']::TEXT[], TRUE, FALSE,
    18, 42, 6,
    'Comforting green lentil soup with carrots, celery, and tomatoes. Simmer on the stove and serve with crusty bread for dipping.',
    ARRAY['1.5 cups green lentils, rinsed', '6 cups vegetable or chicken broth', '2 carrots, diced', '2 celery stalks, diced', '1 can diced tomatoes', '1 onion, chopped', '2 tsp cumin', '2 cloves garlic', 'Sourdough bread for serving']::TEXT[],
    ARRAY['Green lentils (bulk)', 'Chicken broth (bulk)']::TEXT[],
    ARRAY['Carrots', 'Celery', 'Canned tomatoes', 'Sourdough', 'Cumin']::TEXT[]
  )
) AS v(
  "name", "emoji", "tags", "isVeg", "isFavorite",
  "proteinG", "carbsG", "fatG", "description", "ingredients", "samItems", "htItems"
)
WHERE NOT EXISTS (SELECT 1 FROM "Meal" LIMIT 1);

-- Backfill descriptions for existing starter meals (safe to re-run)
UPDATE "Meal" SET
  "description" = 'Oven-baked salmon with lemon, dill, and capers served with roasted asparagus. Ready in about 25 minutes and naturally low carb.',
  "ingredients" = ARRAY['4 salmon fillets (6 oz each)', '2 lemons (juice and zest)', '2 tbsp fresh dill, chopped', '1 tbsp capers', '1 bunch asparagus', '2 tbsp olive oil', 'Salt and black pepper']::TEXT[]
WHERE "name" = 'Lemon herb salmon';

UPDATE "Meal" SET
  "description" = 'Hearty vegetarian bowls with seasoned black beans, roasted sweet potato, rice, and fresh toppings. Great for meal prep and easy to customize.',
  "ingredients" = ARRAY['2 cups cooked black beans', '2 medium sweet potatoes, cubed', '1 cup cooked brown rice', '1 avocado, sliced', '1 lime, juiced', '1/4 cup cilantro', '1/4 cup crumbled feta', 'Cumin, chili powder, salt']::TEXT[]
WHERE "name" = 'Black bean & sweet potato bowls';

UPDATE "Meal" SET
  "description" = 'Seasoned ground turkey with a simple spice blend, served taco-bar style with fresh toppings. Kids can pick their own fixings.',
  "ingredients" = ARRAY['1.5 lb ground turkey', '2 tbsp taco seasoning', '8–10 corn tortillas', '1 head romaine, shredded', '2 roma tomatoes, diced', '1/2 cup sour cream', 'Shredded cheese', 'Jalapeños (optional)']::TEXT[]
WHERE "name" = 'Turkey taco night';

UPDATE "Meal" SET
  "description" = 'Marinated chicken thighs roasted until crispy, served with cucumber-tomato salad and tzatziki. Mediterranean flavors with minimal carbs.',
  "ingredients" = ARRAY['6 bone-in chicken thighs', '3 tbsp olive oil', '3 cloves garlic, minced', '1 tsp dried oregano', '1 cucumber, sliced', '1 cup cherry tomatoes', '1/4 red onion, thinly sliced', '1/2 cup tzatziki', 'Kalamata olives']::TEXT[]
WHERE "name" = 'Greek chicken thighs';

UPDATE "Meal" SET
  "description" = 'Crispy tofu and mixed vegetables in a ginger-garlic sauce over jasmine rice. Use frozen stir-fry veg for a fast weeknight win.',
  "ingredients" = ARRAY['14 oz extra firm tofu, pressed and cubed', '4 cups mixed stir-fry vegetables', '2 cups cooked jasmine rice', '2 tbsp sesame oil', '1 tbsp soy sauce', '1 tbsp fresh ginger, grated', '2 cloves garlic, minced', '2 green onions, sliced']::TEXT[]
WHERE "name" = 'Veggie stir fry & tofu';

UPDATE "Meal" SET
  "description" = 'Italian sausage roasted with bell peppers, zucchini, and tomatoes on one pan. Minimal cleanup and ready in under 35 minutes.',
  "ingredients" = ARRAY['1.5 lb Italian sausage links, sliced', '2 bell peppers, chunked', '2 zucchini, sliced', '1 cup cherry tomatoes', '2 tbsp olive oil', '1 tsp Italian seasoning', 'Salt and pepper']::TEXT[]
WHERE "name" = 'Sheet pan sausage & veg';

UPDATE "Meal" SET
  "description" = 'Sautéed shrimp over creamy cauliflower "grits" with parmesan. A lighter take on a Southern classic that still feels special.',
  "ingredients" = ARRAY['1.5 lb raw shrimp, peeled', '1 large head cauliflower, riced', '1/2 cup heavy cream', '1/2 cup grated parmesan', '2 tbsp butter', '2 cloves garlic, minced', '2 green onions, sliced', 'Old Bay seasoning']::TEXT[]
WHERE "name" = 'Shrimp & cauliflower grits';

UPDATE "Meal" SET
  "description" = 'Comforting green lentil soup with carrots, celery, and tomatoes. Simmer on the stove and serve with crusty bread for dipping.',
  "ingredients" = ARRAY['1.5 cups green lentils, rinsed', '6 cups vegetable or chicken broth', '2 carrots, diced', '2 celery stalks, diced', '1 can diced tomatoes', '1 onion, chopped', '2 tsp cumin', '2 cloves garlic', 'Sourdough bread for serving']::TEXT[]
WHERE "name" = 'Lentil soup';

INSERT INTO "KidsMeal" ("name", "emoji", "liked", "note")
SELECT * FROM (VALUES
  ('Chicken tenders', '🍗', TRUE, 'Bake 400° — love the dipping sauce'),
  ('Quesadillas', '🫓', TRUE, 'Cheese only, cut into triangles'),
  ('Mac & cheese', '🧀', TRUE, 'Annie''s brand from Sam''s'),
  ('Turkey meatballs', '🥩', FALSE, 'Try with marinara next time'),
  ('Veggie pasta', '🍝', TRUE, 'Butter noodles + hidden spinach'),
  ('PB&J pinwheels', '🥪', TRUE, 'Backup for crazy nights')
) AS v("name", "emoji", "liked", "note")
WHERE NOT EXISTS (SELECT 1 FROM "KidsMeal" LIMIT 1);
