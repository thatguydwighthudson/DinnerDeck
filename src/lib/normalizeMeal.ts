function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map(String).join('\n').trim()
  if (value == null) return ''
  return String(value).trim()
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean)
  }
  return []
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value)
  if (typeof value === 'string') {
    const n = parseInt(value.replace(/[^\d]/g, ''), 10)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

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
  const raw = s as RawMealSuggestion & Record<string, unknown>
  const description = asText(raw.description)
  const instructions = asText(raw.instructions)
  const ingredients = asStringList(raw.ingredients)
  const samItems = asStringList(raw.samItems)
  const htItems = asStringList(raw.htItems)
  const sourceUrl = asHttpUrl(s.sourceUrl)
  const name = asText(raw.name)
  if (!name) throw new Error('Meal suggestion missing name')

  return {
    name,
    emoji: asText(raw.emoji) || '🍽',
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    isVeg: Boolean(raw.isVeg),
    proteinG: asNumber(raw.proteinG),
    carbsG: asNumber(raw.carbsG),
    fatG: asNumber(raw.fatG),
    notes: asText(raw.notes),
    servingSize: asText(raw.servingSize),
    servingWeight: asText(raw.servingWeight),
    description:
      description ||
      `A healthy ${name} — simple prep with fresh ingredients, perfect for the family.`,
    instructions:
      instructions ||
      `Prepare ${name}: prep ingredients, cook the main components, and serve family-style.`,
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
