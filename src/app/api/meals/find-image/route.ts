import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { meals } from '@/db/schema'
import { findMealImageUrl } from '@/lib/findMealImage'

export async function POST(req: NextRequest) {
  const { name, mealId } = await req.json()

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  try {
    const imageUrl = await findMealImageUrl(name)

    if (mealId && imageUrl) {
      await db
        .update(meals)
        .set({ imageUrl, updatedAt: new Date() })
        .where(eq(meals.id, mealId))
    }

    return NextResponse.json({ imageUrl })
  } catch (err) {
    console.error('find-image error:', err)
    return NextResponse.json({ error: 'Failed to find image' }, { status: 500 })
  }
}
