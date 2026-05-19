import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { meals } from '@/db/schema'
import { findMealImageUrl } from '@/lib/findMealImage'

/** Fire-and-forget: Claude web search for image, then update meal row. */
export function attachMealImageAsync(mealId: number, mealName: string) {
  void (async () => {
    const imageUrl = await findMealImageUrl(mealName)
    if (!imageUrl) return
    await db.update(meals).set({ imageUrl, updatedAt: new Date() }).where(eq(meals.id, mealId))
  })().catch(err => console.error('attachMealImageAsync:', err))
}
