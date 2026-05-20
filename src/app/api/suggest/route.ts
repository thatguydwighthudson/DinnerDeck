import { NextRequest, NextResponse } from 'next/server'
import {
  markCatalogSuggested,
  pickCatalogMeals,
  PICKER_CATALOG_SUGGEST_COUNT,
  WEEK_DINNER_SUGGEST_COUNT,
} from '@/lib/catalogSuggest'
import { normalizeMealSuggestion } from '@/lib/normalizeMeal'
import type { MealFocusPrefs } from '@/lib/mealFocus'
import { MEAL_TYPE_LABELS, MEAL_TYPES, type MealType } from '@/lib/mealTypes'
import { isAuthResponse, requireUser } from '@/lib/apiAuth'

function catalogShortfallMessage(mealType: MealType, needed: number): string {
  const label = MEAL_TYPE_LABELS[mealType].toLowerCase()
  return `Not enough ${label} recipes in the catalog right now (need ${needed} enriched). Add more to CuratedRecipe, adjust meal focus, or try again after two weeks.`
}

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth

  const body = await req.json()
  const { mealFocus, mealType } = body as {
    mealFocus?: MealFocusPrefs
    mealType?: MealType
  }

  const type: MealType =
    mealType && MEAL_TYPES.includes(mealType) ? mealType : 'dinner'
  const needed = type === 'dinner' && !mealType ? WEEK_DINNER_SUGGEST_COUNT : PICKER_CATALOG_SUGGEST_COUNT

  try {
    const picks = await pickCatalogMeals(type, mealFocus, auth.id, needed)

    if (picks.length < needed) {
      return NextResponse.json({ error: catalogShortfallMessage(type, needed) }, { status: 422 })
    }

    const catalogIds = picks.map(p => p.catalogRecipeId)
    await markCatalogSuggested(catalogIds)

    const items = picks.map(p => normalizeMealSuggestion(p))
    return NextResponse.json({ suggestions: { [type]: items } })
  } catch (err) {
    console.error('Suggest error:', err)
    const message = err instanceof Error ? err.message : 'Failed to load suggestions'
    return NextResponse.json({ error: message || 'Failed to load suggestions' }, { status: 500 })
  }
}
