import type { AlternateRecipe } from '@/lib/types'

function asHttpUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null
  return trimmed
}

function normalizeAlternates(
  alts: AlternateRecipe[] | undefined,
  excludeUrl: string | null
): AlternateRecipe[] | null {
  if (!alts?.length) return null
  const seen = new Set<string>()
  if (excludeUrl) seen.add(excludeUrl)
  const normalized: AlternateRecipe[] = []
  for (const alt of alts) {
    const url = asHttpUrl(alt.url)
    if (!url || seen.has(url)) continue
    seen.add(url)
    normalized.push({
      url,
      imageUrl: null,
      siteName: (alt.siteName || 'Recipe').trim() || 'Recipe',
    })
    if (normalized.length >= 2) break
  }
  return normalized.length ? normalized : null
}

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
  const alternates = normalizeAlternates(s.alternateRecipes, null)
  const sourceUrl =
    asHttpUrl(s.sourceUrl) ?? alternates?.[0]?.url ?? null
  const alternateRecipes = normalizeAlternates(s.alternateRecipes, sourceUrl)

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
    imageUrl: null,
    sourceUrl,
    alternateRecipes,
    aiGenerated: true,
  }
}
