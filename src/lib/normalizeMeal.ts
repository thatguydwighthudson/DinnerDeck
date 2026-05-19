import type { AlternateRecipe } from '@/lib/types'

export type RawMealSuggestion = {
  name: string
  emoji?: string
  tags?: string[]
  isVeg?: boolean
  proteinG?: number
  carbsG?: number
  fatG?: number
  description?: string
  instructions?: string
  ingredients?: string[]
  samItems?: string[]
  htItems?: string[]
  imageUrl?: string | null
  sourceUrl?: string | null
  alternateRecipes?: AlternateRecipe[]
}

export function normalizeMealSuggestion(s: RawMealSuggestion) {
  const description = (s.description ?? '').trim()
  const instructions = (s.instructions ?? '').trim()
  const ingredients = (s.ingredients ?? []).filter(Boolean)
  const samItems = s.samItems ?? []
  const htItems = s.htItems ?? []
  const imageUrl = s.imageUrl?.trim() || null

  return {
    name: s.name,
    emoji: s.emoji ?? '🍽',
    tags: s.tags ?? [],
    isVeg: s.isVeg ?? false,
    proteinG: s.proteinG ?? 0,
    carbsG: s.carbsG ?? 0,
    fatG: s.fatG ?? 0,
    description:
      description ||
      `A healthy ${s.name} — simple prep with fresh ingredients, perfect for the family.`,
    instructions:
      instructions ||
      `Prepare ${s.name}: prep ingredients, cook the main components, and serve family-style.`,
    ingredients: ingredients.length > 0 ? ingredients : [...samItems, ...htItems].filter(Boolean),
    samItems,
    htItems,
    imageUrl: imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : null,
    sourceUrl: s.sourceUrl?.trim() || null,
    alternateRecipes: s.alternateRecipes?.length ? s.alternateRecipes : null,
    aiGenerated: true,
  }
}
