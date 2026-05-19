import { NextRequest, NextResponse } from 'next/server'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { kidsMeals } from '@/db/schema'

export async function GET() {
  const rows = await db
    .select()
    .from(kidsMeals)
    .orderBy(desc(kidsMeals.liked), asc(kidsMeals.name))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const [km] = await db
    .insert(kidsMeals)
    .values({
      name: body.name,
      emoji: body.emoji ?? '🍽',
      note: body.note ?? '',
      liked: body.liked ?? false,
    })
    .returning()

  return NextResponse.json(km, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  const [km] = await db
    .update(kidsMeals)
    .set(data)
    .where(eq(kidsMeals.id, id))
    .returning()

  return NextResponse.json(km)
}
