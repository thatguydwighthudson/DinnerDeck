import { NextRequest, NextResponse } from 'next/server'
import { pickCatalogDinners } from '@/lib/catalogSuggest'
import { normalizeMealSuggestion } from '@/lib/normalizeMeal'
import type { MealFocusPrefs } from '@/lib/mealFocus'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { mealFocus } = body as { mealFocus?: MealFocusPrefs }

  try {
    const picks = await pickCatalogDinners(mealFocus)

    if (picks.length < 5) {
      return NextResponse.json(
        {
          error:
            'Not enough recipes in the catalog right now. Enrich more dinners, adjust meal focus, or try again after two weeks.',
        },
        { status: 422 }
      )
    }

    const items = picks.map(p => normalizeMealSuggestion(p))

    return NextResponse.json({ suggestions: { dinner: items } })
  } catch (err) {
    console.error('Suggest error:', err)
    const message = err instanceof Error ? err.message : 'Failed to load suggestions'
    return NextResponse.json({ error: message || 'Failed to load suggestions' }, { status: 500 })
  }
}
