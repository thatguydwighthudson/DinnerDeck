import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { meals, kidsMeals } from '@/db/schema'

const starterMeals = [
  {
    name: 'Lemon herb salmon',
    emoji: '🐟',
    tags: ['high-protein', 'low-carb'],
    isVeg: false,
    isFavorite: true,
    proteinG: 42,
    carbsG: 4,
    fatG: 18,
    description:
      'Oven-baked salmon with lemon, dill, and capers served with roasted asparagus. Ready in about 25 minutes and naturally low carb.',
    ingredients: [
      '4 salmon fillets (6 oz each)',
      '2 lemons (juice and zest)',
      '2 tbsp fresh dill, chopped',
      '1 tbsp capers',
      '1 bunch asparagus',
      '2 tbsp olive oil',
      'Salt and black pepper',
    ],
    samItems: ['Salmon fillet (2lb)', 'Olive oil'],
    htItems: ['Lemons', 'Fresh dill', 'Capers', 'Asparagus'],
  },
  {
    name: 'Black bean & sweet potato bowls',
    emoji: '🥘',
    tags: ['vegetarian', 'balanced', 'high-protein'],
    isVeg: true,
    isFavorite: false,
    proteinG: 22,
    carbsG: 48,
    fatG: 8,
    description:
      'Hearty vegetarian bowls with seasoned black beans, roasted sweet potato, rice, and fresh toppings. Great for meal prep and easy to customize.',
    ingredients: [
      '2 cups cooked black beans',
      '2 medium sweet potatoes, cubed',
      '1 cup cooked brown rice',
      '1 avocado, sliced',
      '1 lime, juiced',
      '1/4 cup cilantro',
      '1/4 cup crumbled feta',
      'Cumin, chili powder, salt',
    ],
    samItems: ['Black beans (bulk)', 'Brown rice (bulk)'],
    htItems: ['Sweet potatoes', 'Avocado', 'Lime', 'Cilantro', 'Feta'],
  },
  {
    name: 'Turkey taco night',
    emoji: '🌮',
    tags: ['high-protein', 'balanced'],
    isVeg: false,
    isFavorite: true,
    proteinG: 38,
    carbsG: 22,
    fatG: 12,
    description:
      'Seasoned ground turkey with a simple spice blend, served taco-bar style with fresh toppings. Kids can pick their own fixings.',
    ingredients: [
      '1.5 lb ground turkey',
      '2 tbsp taco seasoning',
      '8–10 corn tortillas',
      '1 head romaine, shredded',
      '2 roma tomatoes, diced',
      '1/2 cup sour cream',
      'Shredded cheese',
      'Jalapeños (optional)',
    ],
    samItems: ['Ground turkey (3lb)', 'Shredded cheese (bulk)'],
    htItems: ['Corn tortillas', 'Romaine', 'Tomatoes', 'Jalapeños', 'Sour cream'],
  },
  {
    name: 'Greek chicken thighs',
    emoji: '🍗',
    tags: ['high-protein', 'low-carb'],
    isVeg: false,
    isFavorite: false,
    proteinG: 45,
    carbsG: 6,
    fatG: 16,
    description:
      'Marinated chicken thighs roasted until crispy, served with cucumber-tomato salad and tzatziki. Mediterranean flavors with minimal carbs.',
    ingredients: [
      '6 bone-in chicken thighs',
      '3 tbsp olive oil',
      '3 cloves garlic, minced',
      '1 tsp dried oregano',
      '1 cucumber, sliced',
      '1 cup cherry tomatoes',
      '1/4 red onion, thinly sliced',
      '1/2 cup tzatziki',
      'Kalamata olives',
    ],
    samItems: ['Chicken thighs (4lb)', 'Kalamata olives'],
    htItems: ['Cucumber', 'Cherry tomatoes', 'Red onion', 'Tzatziki'],
  },
  {
    name: 'Veggie stir fry & tofu',
    emoji: '🥦',
    tags: ['vegetarian', 'balanced'],
    isVeg: true,
    isFavorite: false,
    proteinG: 24,
    carbsG: 28,
    fatG: 10,
    description:
      'Crispy tofu and mixed vegetables in a ginger-garlic sauce over jasmine rice. Use frozen stir-fry veg for a fast weeknight win.',
    ingredients: [
      '14 oz extra firm tofu, pressed and cubed',
      '4 cups mixed stir-fry vegetables',
      '2 cups cooked jasmine rice',
      '2 tbsp sesame oil',
      '1 tbsp soy sauce',
      '1 tbsp fresh ginger, grated',
      '2 cloves garlic, minced',
      '2 green onions, sliced',
    ],
    samItems: ['Extra firm tofu', 'Frozen stir-fry veg'],
    htItems: ['Bok choy', 'Sesame oil', 'Ginger', 'Garlic', 'Jasmine rice'],
  },
  {
    name: 'Sheet pan sausage & veg',
    emoji: '🥩',
    tags: ['high-protein', 'low-carb'],
    isVeg: false,
    isFavorite: true,
    proteinG: 36,
    carbsG: 14,
    fatG: 22,
    description:
      'Italian sausage roasted with bell peppers, zucchini, and tomatoes on one pan. Minimal cleanup and ready in under 35 minutes.',
    ingredients: [
      '1.5 lb Italian sausage links, sliced',
      '2 bell peppers, chunked',
      '2 zucchini, sliced',
      '1 cup cherry tomatoes',
      '2 tbsp olive oil',
      '1 tsp Italian seasoning',
      'Salt and pepper',
    ],
    samItems: ['Italian sausage (bulk)', 'Bell peppers (bag)'],
    htItems: ['Zucchini', 'Cherry tomatoes', 'Broccolini'],
  },
  {
    name: 'Shrimp & cauliflower grits',
    emoji: '🦐',
    tags: ['high-protein', 'low-carb'],
    isVeg: false,
    isFavorite: false,
    proteinG: 34,
    carbsG: 12,
    fatG: 14,
    description:
      'Sautéed shrimp over creamy cauliflower "grits" with parmesan. A lighter take on a Southern classic that still feels special.',
    ingredients: [
      '1.5 lb raw shrimp, peeled',
      '1 large head cauliflower, riced',
      '1/2 cup heavy cream',
      '1/2 cup grated parmesan',
      '2 tbsp butter',
      '2 cloves garlic, minced',
      '2 green onions, sliced',
      'Old Bay seasoning',
    ],
    samItems: ['Raw shrimp 2lb', 'Butter'],
    htItems: ['Cauliflower', 'Heavy cream', 'Parmesan', 'Green onions'],
  },
  {
    name: 'Lentil soup',
    emoji: '🍲',
    tags: ['vegetarian', 'balanced'],
    isVeg: true,
    isFavorite: false,
    proteinG: 18,
    carbsG: 42,
    fatG: 6,
    description:
      'Comforting green lentil soup with carrots, celery, and tomatoes. Simmer on the stove and serve with crusty bread for dipping.',
    ingredients: [
      '1.5 cups green lentils, rinsed',
      '6 cups vegetable or chicken broth',
      '2 carrots, diced',
      '2 celery stalks, diced',
      '1 can diced tomatoes',
      '1 onion, chopped',
      '2 tsp cumin',
      '2 cloves garlic',
      'Sourdough bread for serving',
    ],
    samItems: ['Green lentils (bulk)', 'Chicken broth (bulk)'],
    htItems: ['Carrots', 'Celery', 'Canned tomatoes', 'Sourdough', 'Cumin'],
  },
]

const starterKidsMeals = [
  { name: 'Chicken tenders', emoji: '🍗', liked: true, note: 'Bake 400° — love the dipping sauce' },
  { name: 'Quesadillas', emoji: '🫓', liked: true, note: 'Cheese only, cut into triangles' },
  { name: 'Mac & cheese', emoji: '🧀', liked: true, note: "Annie's brand from Sam's" },
  { name: 'Turkey meatballs', emoji: '🥩', liked: false, note: 'Try with marinara next time' },
  { name: 'Veggie pasta', emoji: '🍝', liked: true, note: 'Butter noodles + hidden spinach' },
  { name: 'PB&J pinwheels', emoji: '🥪', liked: true, note: 'Backup for crazy nights' },
]

async function main() {
  console.log('Seeding meals...')

  const existing = await db.select({ id: meals.id }).from(meals).limit(1)
  if (existing.length === 0) {
    await db.insert(meals).values(starterMeals)
    console.log('Inserted starter meals.')
  } else {
    console.log('Meals exist — backfilling descriptions and ingredients by name...')
    for (const meal of starterMeals) {
      await db
        .update(meals)
        .set({
          description: meal.description,
          ingredients: meal.ingredients,
        })
        .where(eq(meals.name, meal.name))
    }
  }

  const existingKids = await db.select({ id: kidsMeals.id }).from(kidsMeals).limit(1)
  if (existingKids.length === 0) {
    await db.insert(kidsMeals).values(starterKidsMeals)
  }

  console.log('Seed complete.')
}

main().catch(console.error)
