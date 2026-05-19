'use client'

import { DAY_LABELS, DayPlan, Meal, KidsMeal, type DayOfWeek } from '@/lib/types'
import { MEAL_TYPE_LABELS, type MealType } from '@/lib/mealTypes'
import { slotIsFilled, slotTitle } from '@/lib/slotDisplay'
import styles from './DayPlanScreen.module.css'

type Props = {
  day: DayOfWeek
  activeMealTypes: MealType[]
  weekPlan: DayPlan[]
  meals: Meal[]
  kidsMeals: KidsMeal[]
  onBack: () => void
  onSelectMealType: (mealType: MealType) => void
  onKidsPicker: () => void
}

export default function DayPlanScreen({
  day,
  activeMealTypes,
  weekPlan,
  meals,
  kidsMeals,
  onBack,
  onSelectMealType,
  onKidsPicker,
}: Props) {
  const getSlot = (mealType: MealType) =>
    weekPlan.find(p => p.dayOfWeek === day && p.mealType === mealType)

  const dinnerPlan = getSlot('dinner')
  const kids = dinnerPlan?.kidsMealId ? kidsMeals.find(k => k.id === dinnerPlan.kidsMealId) : null

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.back} onClick={onBack}>
        ← Week
      </button>
      <h2 className={styles.title}>{DAY_LABELS[day]}</h2>
      <p className={styles.sub}>Choose a meal type to plan</p>

      <div className={styles.grid}>
        {activeMealTypes.map(mealType => {
          const plan = getSlot(mealType)
          const filled = plan && slotIsFilled(plan)
          const title = plan ? slotTitle(plan, meals) : null
          return (
            <button
              key={mealType}
              type="button"
              className={`${styles.typeCard} ${filled ? styles.typeCardFilled : ''}`}
              onClick={() => onSelectMealType(mealType)}
            >
              <span className={styles.typeLabel}>{MEAL_TYPE_LABELS[mealType]}</span>
              <span className={styles.typeValue}>{title ?? 'Not planned'}</span>
            </button>
          )
        })}
      </div>

      {activeMealTypes.includes('dinner') && (
        <div className={styles.kidsBlock}>
          <span className={styles.kidsLabel}>Kids dinner</span>
          <button type="button" className={styles.kidsBtn} onClick={onKidsPicker}>
            {kids ? `${kids.emoji} ${kids.name}` : 'Same as adults…'}
          </button>
        </div>
      )}
    </div>
  )
}
