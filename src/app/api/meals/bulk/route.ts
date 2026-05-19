import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { meals, weekPlans } from '@/db/schema'
import { DAYS } from '@/lib/types'
import { MEAL_TYPES, type MealType } from '@/lib/mealTypes'
import { normalizeMealSuggestion, type RawMealSuggestion } from '@/lib/normalizeMeal'

type BulkSelection = {
  mealType: MealType
  meals: RawMealSuggestion[]
}

function orderDinnerMeals<T extends { isVeg?: boolean }>(items: T[]): T[] {
  const veg = items.filter(m => m.isVeg)
  const nonVeg = items.filter(m => !m.isVeg)
  const ordered = [...veg.slice(0, 2), ...nonVeg].slice(0, 5)
  while (ordered.length < 5 && items.length > ordered.length) {
    ordered.push(items[ordered.length])
  }
  return ordered
}

async function upsertWeekSlot(
  weekStart: Date,
  dayOfWeek: string,
  mealType: MealType,
  data: { isLeftover: boolean; servings: number; adultMealId: number | null }
) {
  await db
    .insert(weekPlans)
    .values({
      weekStart,
      dayOfWeek,
      mealType,
      isLeftover: data.isLeftover,
      isEatOut: false,
      plannedMeal: null,
      servings: data.servings,
      adultMealId: data.adultMealId,
      kidsMealId: null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [weekPlans.weekStart, weekPlans.dayOfWeek, weekPlans.mealType],
      set: {
        isLeftover: data.isLeftover,
        isEatOut: false,
        plannedMeal: null,
        servings: data.servings,
        adultMealId: data.adultMealId,
        updatedAt: new Date(),
      },
    })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { weekStart, selections = [] } = body as {
    weekStart: string
    selections: BulkSelection[]
  }

  if (!weekStart) {
    return NextResponse.json({ error: 'weekStart required' }, { status: 400 })
  }

  const validSelections = selections.filter(
    s => MEAL_TYPES.includes(s.mealType) && Array.isArray(s.meals) && s.meals.length > 0
  )

  if (!validSelections.length) {
    return NextResponse.json({ error: 'No meals to save' }, { status: 400 })
  }

  try {
    const weekStartDate = new Date(weekStart)
    const allSaved: (typeof meals.$inferSelect)[] = []

    for (const { mealType, meals: rawMeals } of validSelections) {
      const toInsert =
        mealType === 'dinner' ? orderDinnerMeals(rawMeals.map(normalizeMealSuggestion)) : rawMeals.map(normalizeMealSuggestion)

      const saved = await db
        .insert(meals)
        .values(toInsert.map(row => ({ ...row, mealType })))
        .returning()
      allSaved.push(...saved)

      const mealIds = saved.map(m => m.id)

      if (mealType === 'dinner') {
        const assignments: { day: string; mealId: number | null; leftover?: boolean }[] = [
          { day: 'Mon', mealId: mealIds[0] ?? null },
          { day: 'Tue', mealId: null, leftover: true },
          { day: 'Wed', mealId: mealIds[1] ?? null },
          { day: 'Thu', mealId: mealIds[2] ?? null },
          { day: 'Fri', mealId: null, leftover: true },
          { day: 'Sat', mealId: mealIds[3] ?? null },
          { day: 'Sun', mealId: mealIds[4] ?? null },
        ]

        for (const a of assignments) {
          if (a.leftover) {
            await upsertWeekSlot(weekStartDate, a.day, mealType, {
              isLeftover: true,
              servings: 4,
              adultMealId: null,
            })
          } else {
            await upsertWeekSlot(weekStartDate, a.day, mealType, {
              isLeftover: false,
              servings: 4,
              adultMealId: a.mealId,
            })
          }
        }
      } else {
        for (let i = 0; i < DAYS.length; i++) {
          const day = DAYS[i]
          const mealId = mealIds[i % mealIds.length] ?? null
          await upsertWeekSlot(weekStartDate, day, mealType, {
            isLeftover: false,
            servings: 4,
            adultMealId: mealId,
          })
        }
      }
    }

    return NextResponse.json({ meals: allSaved })
  } catch (err) {
    console.error('Bulk meals error:', err)
    return NextResponse.json({ error: 'Failed to save meals' }, { status: 500 })
  }
}
