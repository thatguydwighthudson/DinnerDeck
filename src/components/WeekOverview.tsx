'use client'

import { DAYS, DAY_LABELS, DayPlan, Meal, type DayOfWeek } from '@/lib/types'
import { MEAL_TYPE_LABELS, type MealType } from '@/lib/mealTypes'
import { slotEmoji, slotImageUrl, slotIsFilled, slotTitle } from '@/lib/slotDisplay'
import MealThumbnail from '@/components/MealThumbnail'
import styles from './WeekOverview.module.css'

type Props = {
  weekPlan: DayPlan[]
  meals: Meal[]
  activeMealTypes: MealType[]
  onSelectDay: (day: DayOfWeek) => void
  onGoGrocery?: () => void
  groceryMealCount?: number
}

export default function WeekOverview({
  weekPlan,
  meals,
  activeMealTypes,
  onSelectDay,
  onGoGrocery,
  groceryMealCount = 0,
}: Props) {
  const getSlot = (day: string, mealType: MealType) =>
    weekPlan.find(p => p.dayOfWeek === day && p.mealType === mealType)

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>Tap a day to plan breakfast, lunch, dinner, and more.</p>
      {DAYS.map(day => {
        const filled = activeMealTypes
          .map(mt => ({ mealType: mt, plan: getSlot(day, mt) }))
          .filter((s): s is { mealType: MealType; plan: DayPlan } => Boolean(s.plan && slotIsFilled(s.plan)))

        return (
          <button key={day} type="button" className={styles.dayCard} onClick={() => onSelectDay(day)}>
            <div className={styles.dayHead}>
              <span className={styles.dayName}>{DAY_LABELS[day]}</span>
              <span className={styles.dayAbbr}>{day}</span>
            </div>
            {filled.length === 0 ? (
              <span className={styles.empty}>Plan this day</span>
            ) : (
              <ul className={styles.mealList}>
                {filled.map(({ mealType, plan }) => {
                  const title = slotTitle(plan, meals)
                  if (!title) return null
                  return (
                    <li key={mealType} className={styles.mealLine}>
                      <MealThumbnail
                        emoji={slotEmoji(plan, meals)}
                        imageUrl={slotImageUrl(plan, meals)}
                        size="sm"
                      />
                      <span className={styles.mealType}>{MEAL_TYPE_LABELS[mealType]}</span>
                      <span className={styles.mealTitle}>{title}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </button>
        )
      })}
      {groceryMealCount > 0 && onGoGrocery && (
        <button type="button" className={styles.groceryBtn} onClick={onGoGrocery}>
          🛒 Build grocery list
        </button>
      )}
    </div>
  )
}
