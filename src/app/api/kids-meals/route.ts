import { NextRequest, NextResponse } from 'next/server'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { kidsMeals } from '@/db/schema'
import { isAuthResponse, requireUser } from '@/lib/apiAuth'

export async function GET() {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth

  const rows = await db
    .select()
    .from(kidsMeals)
    .where(eq(kidsMeals.userId, auth.id))
    .orderBy(desc(kidsMeals.liked), asc(kidsMeals.name))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth

  const body = await req.json()

  const [km] = await db
    .insert(kidsMeals)
    .values({
      userId: auth.id,
      name: body.name,
      emoji: body.emoji ?? '🍽',
      note: body.note ?? '',
      liked: body.liked ?? false,
    })
    .returning()

  return NextResponse.json(km, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth

  const body = await req.json()
  const { id, ...data } = body

  const [km] = await db
    .update(kidsMeals)
    .set(data)
    .where(and(eq(kidsMeals.id, id), eq(kidsMeals.userId, auth.id)))
    .returning()

  return NextResponse.json(km)
}
