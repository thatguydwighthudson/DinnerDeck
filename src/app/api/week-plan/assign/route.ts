import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { meals, weekPlans } from '@/db/schema'
import { normalizeMealSuggestion, type RawMealSuggestion } from '@/lib/normalizeMeal'
import type { MealType } from '@/lib/mealTypes'
import { MEAL_TYPES } from '@/lib/mealTypes'

type AssignBody = {
  weekStart: string
  dayOfWeek: string
  mealType: MealType
  mode: 'leftover' | 'eat_out' | 'library' | 'suggestion'
  mealId?: number
  meal?: RawMealSuggestion
  saveToLibrary?: boolean
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AssignBody
  const { weekStart, dayOfWeek, mealType, mode, mealId, meal, saveToLibrary } = body

  if (!weekStart || !dayOfWeek || !MEAL_TYPES.includes(mealType)) {
    return NextResponse.json({ error: 'Invalid assignment' }, { status: 400 })
  }

  const weekStartDate = new Date(weekStart)
  let adultMealId: number | null = null
  let plannedMeal: ReturnType<typeof normalizeMealSuggestion> | null = null
  let isLeftover = false
  let isEatOut = false

  if (mode === 'leftover') {
    isLeftover = true
  } else if (mode === 'eat_out') {
    isEatOut = true
  } else if (mode === 'library' && mealId) {
    adultMealId = mealId
  } else if (mode === 'suggestion' && meal) {
    const normalized = normalizeMealSuggestion(meal)
    if (saveToLibrary) {
      const [saved] = await db
        .insert(meals)
        .values({
          ...normalized,
          mealType,
          alternateRecipes: normalized.alternateRecipes ?? null,
        })
        .returning()
      adultMealId = saved.id
    } else {
      plannedMeal = normalized
    }
  } else {
    return NextResponse.json({ error: 'Invalid assignment payload' }, { status: 400 })
  }

  const [plan] = await db
    .insert(weekPlans)
    .values({
      weekStart: weekStartDate,
      dayOfWeek,
      mealType,
      isLeftover,
      isEatOut,
      plannedMeal,
      adultMealId,
      kidsMealId: null,
      servings: 4,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [weekPlans.weekStart, weekPlans.dayOfWeek, weekPlans.mealType],
      set: {
        isLeftover,
        isEatOut,
        plannedMeal: plannedMeal ?? null,
        adultMealId,
        kidsMealId: null,
        servings: 4,
        updatedAt: new Date(),
      },
    })
    .returning()

  const full = await db.query.weekPlans.findFirst({
    where: eq(weekPlans.id, plan.id),
    with: { adultMeal: true, kidsMeal: true },
  })

  return NextResponse.json(full)
}
