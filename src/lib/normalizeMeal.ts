function asHttpUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null
  return trimmed
}

export type RawMealSuggestion = {
  name: string
  emoji?: string
  tags?: string[]
  isVeg?: boolean
  proteinG?: number
  carbsG?: number
  fatG?: number
  notes?: string
  servingSize?: string
  servingWeight?: string
  description?: string
  instructions?: string
  ingredients?: string[]
  samItems?: string[]
  htItems?: string[]
  imageUrl?: string | null
  sourceUrl?: string | null
  catalogRecipeId?: number
}

export function normalizeMealSuggestion(s: RawMealSuggestion) {
  const description = (s.description ?? '').trim()
  const instructions = (s.instructions ?? '').trim()
  const ingredients = (s.ingredients ?? []).filter(Boolean)
  const samItems = s.samItems ?? []
  const htItems = s.htItems ?? []
  const sourceUrl = asHttpUrl(s.sourceUrl)

  return {
    name: s.name,
    emoji: s.emoji ?? '🍽',
    tags: s.tags ?? [],
    isVeg: s.isVeg ?? false,
    proteinG: s.proteinG ?? 0,
    carbsG: s.carbsG ?? 0,
    fatG: s.fatG ?? 0,
    notes: (s.notes ?? '').trim(),
    servingSize: (s.servingSize ?? '').trim(),
    servingWeight: (s.servingWeight ?? '').trim(),
    description:
      description ||
      `A healthy ${s.name} — simple prep with fresh ingredients, perfect for the family.`,
    instructions:
      instructions ||
      `Prepare ${s.name}: prep ingredients, cook the main components, and serve family-style.`,
    ingredients: ingredients.length > 0 ? ingredients : [...samItems, ...htItems].filter(Boolean),
    samItems,
    htItems,
    imageUrl: null,
    sourceUrl,
    alternateRecipes: null,
    aiGenerated: !s.catalogRecipeId,
    catalogRecipeId: s.catalogRecipeId,
  }
}
