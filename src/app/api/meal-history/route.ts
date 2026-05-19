import { NextRequest, NextResponse } from 'next/server'
import { count, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { mealHistory } from '@/db/schema'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const [history, [{ total }]] = await Promise.all([
    db.query.mealHistory.findMany({
      with: { meal: true },
      orderBy: desc(mealHistory.cookedOn),
      limit,
      offset,
    }),
    db.select({ total: count() }).from(mealHistory),
  ])

  return NextResponse.json({ history, total })
}
