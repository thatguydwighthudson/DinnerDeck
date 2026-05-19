export const GROCERY_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Frozen',
  'Pantry & dry goods',
  'Bakery',
  'Condiments & oils',
  'Other',
] as const

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number]

export function categorizeGroceryItem(item: string): GroceryCategory {
  const s = item.toLowerCase()

  if (/\b(chicken|turkey|beef|pork|sausage|salmon|shrimp|fish|meat|thigh|ground turkey|ground beef|bacon|ham)\b/.test(s)) {
    return 'Meat & seafood'
  }
  if (/\b(lettuce|romaine|tomato|pepper|onion|garlic|ginger|herb|dill|lemon|lime|cilantro|avocado|asparagus|broccoli|zucchini|celery|carrot|potato|sweet potato|bok choy|cucumber|spinach|greens|scallion|green onion|jalapeño|jalapeno|mushroom|cauliflower|cherry tomato)\b/.test(s)) {
    return 'Produce'
  }
  if (/\b(milk|cheese|cream|butter|yogurt|feta|parmesan|sour cream|tzatziki|egg|heavy cream)\b/.test(s)) {
    return 'Dairy & eggs'
  }
  if (/\b(frozen|ice cream)\b/.test(s)) {
    return 'Frozen'
  }
  if (/\b(bread|sourdough|tortilla|roll|bun|pita)\b/.test(s)) {
    return 'Bakery'
  }
  if (/\b(oil|olive oil|sesame oil|vinegar|sauce|seasoning|spice|cumin|broth|stock|rice|bean|lentil|pasta|canned|olive|taco)\b/.test(s)) {
    return 'Pantry & dry goods'
  }
  if (/\b(salt|pepper|marinara|salsa|mayo|ketchup|mustard|dressing)\b/.test(s)) {
    return 'Condiments & oils'
  }

  return 'Other'
}

export type GroceryLine = { id: string; name: string; qty: number }

export type GroceryCategoryGroup = { category: GroceryCategory; items: GroceryLine[] }

export function groupItemsByCategory(
  items: Map<string, number>,
  storePrefix: 's' | 'h'
): GroceryCategoryGroup[] {
  const byCategory = new Map<GroceryCategory, Map<string, number>>()

  for (const [name, qty] of items) {
    const category = categorizeGroceryItem(name)
    if (!byCategory.has(category)) byCategory.set(category, new Map())
    const bucket = byCategory.get(category)!
    bucket.set(name, (bucket.get(name) || 0) + qty)
  }

  return GROCERY_CATEGORIES.filter(c => byCategory.has(c)).map(category => ({
    category,
    items: Array.from(byCategory.get(category)!.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, qty]) => ({
        id: `${storePrefix}_${name}`,
        name,
        qty,
      })),
  }))
}
