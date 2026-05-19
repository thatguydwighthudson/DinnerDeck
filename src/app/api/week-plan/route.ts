import { NextRequest, NextResponse } from 'next/server'
import { and, asc, eq, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { mealHistory, weekPlans } from '@/db/schema'
import { getWeekStart } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart') ?? getWeekStart()
  const mealType = searchParams.get('mealType')

  const conditions = [eq(weekPlans.weekStart, new Date(weekStart))]
  if (mealType) conditions.push(eq(weekPlans.mealType, mealType))

  const plans = await db.query.weekPlans.findMany({
    where: and(...conditions),
    with: {
      adultMeal: true,
      kidsMeal: true,
    },
    orderBy: [asc(weekPlans.dayOfWeek), asc(weekPlans.mealType)],
  })

  return NextResponse.json(plans)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const {
    weekStart,
    dayOfWeek,
    mealType = 'dinner',
    isLeftover,
    isEatOut,
    plannedMeal,
    servings,
    adultMealId,
    kidsMealId,
  } = body

  const [plan] = await db
    .insert(weekPlans)
    .values({
      weekStart: new Date(weekStart),
      dayOfWeek,
      mealType,
      isLeftover: isLeftover ?? false,
      isEatOut: isEatOut ?? false,
      plannedMeal: plannedMeal ?? null,
      servings: servings ?? 4,
      adultMealId: adultMealId ?? null,
      kidsMealId: kidsMealId ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [weekPlans.weekStart, weekPlans.dayOfWeek, weekPlans.mealType],
      set: {
        isLeftover,
        isEatOut,
        plannedMeal,
        servings,
        adultMealId,
        kidsMealId,
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

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'archive') {
    const body = await req.json()
    const { weekStart } = body

    const plans = await db
      .select()
      .from(weekPlans)
      .where(
        and(
          eq(weekPlans.weekStart, new Date(weekStart)),
          eq(weekPlans.mealType, 'dinner'),
          isNotNull(weekPlans.adultMealId),
          eq(weekPlans.isLeftover, false)
        )
      )

    const historyEntries = plans.map(p => ({
      mealId: p.adultMealId!,
      cookedOn: new Date(weekStart),
      weekStart: new Date(weekStart),
      dayOfWeek: p.dayOfWeek,
      servings: p.servings,
      notes: '',
    }))

    if (historyEntries.length) {
      await db.insert(mealHistory).values(historyEntries).onConflictDoNothing()
    }

    return NextResponse.json({ archived: historyEntries.length })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
