import { NextRequest, NextResponse } from 'next/server'
import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { mealHistory } from '@/db/schema'
import { isAuthResponse, requireUser } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = await requireUser()
  if (isAuthResponse(auth)) return auth

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const [history, [{ total }]] = await Promise.all([
    db.query.mealHistory.findMany({
      where: eq(mealHistory.userId, auth.id),
      with: { meal: true },
      orderBy: desc(mealHistory.cookedOn),
      limit,
      offset,
    }),
    db.select({ total: count() }).from(mealHistory).where(eq(mealHistory.userId, auth.id)),
  ])

  return NextResponse.json({ history, total })
}
