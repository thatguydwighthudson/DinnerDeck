import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { importedUrls, meals } from '@/db/schema'
import { userMealPlanContext } from '@/lib/auth-shared'
import { isAuthResponse, requireUser } from '@/lib/apiAuth'
import { normalizeMealType } from '@/lib/mealTypes'
import { buildEnrichedPayload } from '@/lib/importRecipeFromUrl'
import {
  IMPORT_RECIPE_UNSUPPORTED_MESSAGE,
  importRecipeFromJsonLd,
} from '@/lib/importRecipeFromJsonLd'

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return IMPORT_RECIPE_UNSUPPORTED_MESSAGE
}

function isUnsupportedImport(err: unknown): boolean {
  return err instanceof Error && err.message === IMPORT_RECIPE_UNSUPPORTED_MESSAGE
}

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth
  const user = auth

  const body = await req.json()
  const { url: rawUrl, mealType: requestedMealType } = body as { url?: string; mealType?: string }
  if (!rawUrl?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const url = rawUrl.trim()
  const householdContext = userMealPlanContext(user)

  const [existing] = await db
    .select()
    .from(importedUrls)
    .where(and(eq(importedUrls.url, url), eq(importedUrls.userId, user.id)))
    .limit(1)

  if (existing?.mealId) {
    const [meal] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, existing.mealId), eq(meals.userId, user.id)))
      .limit(1)
    if (meal) return NextResponse.json({ meal, cached: true })
  }

  try {
    const imported = await importRecipeFromJsonLd(url)
    const payload = buildEnrichedPayload(imported, url)
    const mealType = normalizeMealType(requestedMealType)

    const [meal] = await db
      .insert(meals)
      .values({
        userId: user.id,
        name: payload.name,
        emoji: payload.emoji,
        tags: payload.tags,
        isVeg: payload.isVeg,
        proteinG: payload.proteinG,
        carbsG: payload.carbsG,
        fatG: payload.fatG,
        notes: payload.notes,
        servingSize: payload.servingSize,
        servingWeight: payload.servingWeight,
        description: payload.description,
        instructions: payload.instructions,
        ingredients: payload.ingredients,
        samItems: payload.samItems,
        htItems: payload.htItems,
        sourceUrl: payload.sourceUrl,
        imageUrl: payload.imageUrl,
        alternateRecipes: null,
        mealType,
        aiGenerated: false,
      })
      .returning()

    await db
      .insert(importedUrls)
      .values({
        url,
        userId: user.id,
        mealId: meal.id,
        rawJson: { meal: imported, source: 'json-ld', householdContext },
      })
      .onConflictDoUpdate({
        target: importedUrls.url,
        set: {
          userId: user.id,
          mealId: meal.id,
          rawJson: { meal: imported, source: 'json-ld', householdContext },
        },
      })

    return NextResponse.json({ meal })
  } catch (err) {
    console.error('Import error:', err)
    const message = errorMessage(err)
    return NextResponse.json(
      { error: message },
      { status: isUnsupportedImport(err) ? 422 : 500 }
    )
  }
}
