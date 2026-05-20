import { and, eq, isNotNull, isNull, lt, notInArray, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { curatedRecipes, meals } from '@/db/schema'
import type { EnrichedRecipePayload } from '@/lib/importRecipeFromUrl'
import type { MealFocusPrefs, MealFocusPresetId } from '@/lib/mealFocus'
import type { MealType } from '@/lib/mealTypes'
import type { RawMealSuggestion } from '@/lib/normalizeMeal'

export const WEEK_DINNER_SUGGEST_COUNT = 5
export const PICKER_CATALOG_SUGGEST_COUNT = 3
const COOLDOWN_DAYS = 14

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function matchesMealFocus(
  row: { tags: string[]; isVeg: boolean },
  presets: MealFocusPresetId[]
): boolean {
  if (!presets.length) return true
  const tags = new Set(row.tags ?? [])
  return presets.some(preset => {
    switch (preset) {
      case 'high-protein':
        return tags.has('high-protein')
      case 'low-carb':
        return tags.has('low-carb')
      case 'balanced':
        return tags.has('balanced')
      case 'vegetarian':
        return row.isVeg || tags.has('vegetarian')
      case 'vegan':
        return row.isVeg && tags.has('vegetarian')
      default:
        return true
    }
  })
}

function parseEnriched(value: unknown): EnrichedRecipePayload | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  if (typeof o.name !== 'string' || !o.name.trim()) return null
  if (typeof o.description !== 'string' || !o.description.trim()) return null
  if (typeof o.instructions !== 'string' || !o.instructions.trim()) return null
  return value as EnrichedRecipePayload
}

export type CatalogPick = RawMealSuggestion & { catalogRecipeId: number }

function defaultSuggestCount(mealType: MealType): number {
  return mealType === 'dinner' ? WEEK_DINNER_SUGGEST_COUNT : PICKER_CATALOG_SUGGEST_COUNT
}

export async function pickCatalogMeals(
  mealType: MealType,
  mealFocus?: MealFocusPrefs,
  userId?: string,
  count?: number
): Promise<CatalogPick[]> {
  const limit = count ?? defaultSuggestCount(mealType)
  const cooldownBefore = new Date()
  cooldownBefore.setDate(cooldownBefore.getDate() - COOLDOWN_DAYS)

  const libraryConditions = [isNotNull(meals.catalogRecipeId), isNull(meals.deletedAt)]
  if (userId) libraryConditions.push(eq(meals.userId, userId))

  const inLibrary = await db
    .select({ catalogRecipeId: meals.catalogRecipeId })
    .from(meals)
    .where(and(...libraryConditions))

  const excludeIds = [
    ...new Set(inLibrary.map(r => r.catalogRecipeId).filter((id): id is number => id != null)),
  ]

  const conditions = [
    eq(curatedRecipes.active, true),
    eq(curatedRecipes.mealType, mealType),
    sql`${curatedRecipes.enriched} IS NOT NULL`,
    or(isNull(curatedRecipes.lastSuggestedAt), lt(curatedRecipes.lastSuggestedAt, cooldownBefore)),
  ]

  if (excludeIds.length > 0) {
    conditions.push(notInArray(curatedRecipes.id, excludeIds))
  }

  const rows = await db
    .select()
    .from(curatedRecipes)
    .where(and(...conditions))

  const presets = mealFocus?.presets ?? []
  const eligible = rows.filter(row => {
    const enriched = parseEnriched(row.enriched)
    if (!enriched) return false
    return matchesMealFocus(
      { tags: row.tags ?? [], isVeg: row.isVeg },
      presets
    )
  })

  const picked = shuffle(eligible).slice(0, limit)

  const suggestions: CatalogPick[] = []
  for (const row of picked) {
    const enriched = parseEnriched(row.enriched)!
    suggestions.push({
      name: enriched.name || row.name,
      emoji: enriched.emoji || row.emoji,
      tags: enriched.tags?.length ? enriched.tags : row.tags ?? [],
      isVeg: enriched.isVeg ?? row.isVeg,
      proteinG: enriched.proteinG ?? 0,
      carbsG: enriched.carbsG ?? 0,
      fatG: enriched.fatG ?? 0,
      notes: enriched.notes ?? '',
      servingSize: enriched.servingSize ?? '',
      servingWeight: enriched.servingWeight ?? '',
      description: enriched.description,
      instructions: enriched.instructions,
      ingredients: enriched.ingredients ?? [],
      samItems: enriched.samItems ?? [],
      htItems: enriched.htItems ?? [],
      imageUrl: null,
      sourceUrl: enriched.sourceUrl || row.sourceUrl,
      catalogRecipeId: row.id,
    })
  }

  return suggestions
}

/** @deprecated Use pickCatalogMeals('dinner', ...) */
export async function pickCatalogDinners(
  mealFocus?: MealFocusPrefs,
  userId?: string
): Promise<CatalogPick[]> {
  return pickCatalogMeals('dinner', mealFocus, userId)
}

export async function markCatalogSuggested(catalogRecipeIds: number[]) {
  const now = new Date()
  for (const id of catalogRecipeIds) {
    await db
      .update(curatedRecipes)
      .set({ lastSuggestedAt: now, updatedAt: now })
      .where(eq(curatedRecipes.id, id))
  }
}
