import { NextRequest, NextResponse } from 'next/server'
import { and, arrayContains, asc, desc, eq, isNull } from 'drizzle-orm'
import { normalizeMealType } from '@/lib/mealTypes'
import { db } from '@/lib/db'
import { meals, weekPlans } from '@/db/schema'
import { isAuthResponse, requireUser } from '@/lib/apiAuth'

const mealFields = [
  'name',
  'emoji',
  'tags',
  'isVeg',
  'isFavorite',
  'proteinG',
  'carbsG',
  'fatG',
  'notes',
  'servingSize',
  'servingWeight',
  'description',
  'instructions',
  'ingredients',
  'samItems',
  'htItems',
  'sourceUrl',
  'mealType',
] as const

function pickMealFields(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const key of mealFields) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  return data
}

export async function GET(req: NextRequest) {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter')

  const conditions = [isNull(meals.deletedAt), eq(meals.userId, auth.id)]
  if (filter === 'fav') conditions.push(eq(meals.isFavorite, true))
  if (filter === 'veg') conditions.push(eq(meals.isVeg, true))
  if (filter === 'hp') conditions.push(arrayContains(meals.tags, ['high-protein']))
  if (filter === 'lc') conditions.push(arrayContains(meals.tags, ['low-carb']))

  try {
    const rows = await db
      .select()
      .from(meals)
      .where(and(...conditions))
      .orderBy(asc(meals.mealType), desc(meals.isFavorite), desc(meals.createdAt))

    return NextResponse.json(rows)
  } catch (err) {
    console.error('GET /api/meals error:', err)
    const message = err instanceof Error ? err.message : 'Failed to load meals'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth

  const body = await req.json()

  const mealType = normalizeMealType(body.mealType as string | undefined)

  const [meal] = await db
    .insert(meals)
    .values({
      userId: auth.id,
      name: body.name,
      mealType,
      emoji: body.emoji ?? '🍽',
      tags: body.tags ?? [],
      isVeg: body.isVeg ?? false,
      proteinG: body.proteinG ?? 0,
      carbsG: body.carbsG ?? 0,
      fatG: body.fatG ?? 0,
      notes: body.notes ?? '',
      servingSize: body.servingSize ?? '',
      servingWeight: body.servingWeight ?? '',
      description: body.description ?? '',
      instructions: body.instructions ?? '',
      ingredients: body.ingredients ?? [],
      samItems: body.samItems ?? [],
      htItems: body.htItems ?? [],
      sourceUrl: body.sourceUrl ?? null,
      imageUrl: null,
      alternateRecipes: body.alternateRecipes ?? null,
      aiGenerated: body.aiGenerated ?? false,
    })
    .returning()

  return NextResponse.json(meal, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth

  const body = await req.json()
  const { id, ...rest } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const data = pickMealFields(rest)
  if (data.mealType !== undefined) {
    data.mealType = normalizeMealType(data.mealType as string)
  }

  const [meal] = await db
    .update(meals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(meals.id, id), eq(meals.userId, auth.id), isNull(meals.deletedAt)))
    .returning()

  if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 })

  return NextResponse.json(meal)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') ?? '', 10)

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const [meal] = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, auth.id), isNull(meals.deletedAt)))
    .limit(1)

  if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 })

  await db.update(weekPlans).set({ adultMealId: null }).where(eq(weekPlans.adultMealId, id))
  await db.update(weekPlans).set({ kidsAdultId: null }).where(eq(weekPlans.kidsAdultId, id))

  await db
    .update(meals)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(meals.id, id))

  return NextResponse.json({ ok: true })
}
