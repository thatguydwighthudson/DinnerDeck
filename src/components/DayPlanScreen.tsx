'use client'

import { DAY_LABELS, DayPlan, Meal, KidsMeal, PlannedMeal, type DayOfWeek } from '@/lib/types'
import { MEAL_TYPE_LABELS, type MealType } from '@/lib/mealTypes'
import { resolveSlotMeal, slotEmoji, slotIsFilled, slotTitle } from '@/lib/slotDisplay'
import { formatMacroLine, sumDayMacros } from '@/lib/macros'
import MealThumbnail from '@/components/MealThumbnail'
import styles from './DayPlanScreen.module.css'

type Props = {
  day: DayOfWeek
  activeMealTypes: MealType[]
  weekPlan: DayPlan[]
  meals: Meal[]
  kidsMeals: KidsMeal[]
  onBack: () => void
  onSelectMealType: (mealType: MealType) => void
  onViewSlotMeal: (mealType: MealType, meal: Meal | PlannedMeal) => void
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
  onViewSlotMeal,
  onKidsPicker,
}: Props) {
  const getSlot = (mealType: MealType) =>
    weekPlan.find(p => p.dayOfWeek === day && p.mealType === mealType)

  const dinnerPlan = getSlot('dinner')
  const kids = dinnerPlan?.kidsMealId ? kidsMeals.find(k => k.id === dinnerPlan.kidsMealId) : null
  const dayMacros = sumDayMacros(day, activeMealTypes, weekPlan, meals)

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
          const slotMeal = plan ? resolveSlotMeal(plan, meals) : null
          const hasRecipe = Boolean(slotMeal)

          const handleCardClick = () => {
            if (hasRecipe && slotMeal) onViewSlotMeal(mealType, slotMeal)
            else onSelectMealType(mealType)
          }

          return (
            <div
              key={mealType}
              className={`${styles.typeCardRow} ${filled ? styles.typeCardRowFilled : ''}`}
            >
              <button
                type="button"
                className={`${styles.typeCard} ${filled ? styles.typeCardFilled : ''}`}
                onClick={handleCardClick}
              >
                {filled && plan && (
                  <MealThumbnail
                    emoji={slotEmoji(plan, meals)}
                    size="sm"
                    className={styles.typeThumb}
                  />
                )}
                <div className={styles.typeCardText}>
                  <span className={styles.typeLabel}>{MEAL_TYPE_LABELS[mealType]}</span>
                  <span className={styles.typeValue}>{title ?? 'Not planned'}</span>
                </div>
              </button>
              {filled && (
                <button
                  type="button"
                  className={styles.swapBtn}
                  onClick={() => onSelectMealType(mealType)}
                  aria-label={`Swap ${MEAL_TYPE_LABELS[mealType]}`}
                >
                  Swap
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.macroBlock} aria-live="polite">
        <span className={styles.macroLabel}>Day macros</span>
        <p className={styles.macroLine}>{formatMacroLine(dayMacros)}</p>
        {dayMacros.mealCount > 0 && (
          <p className={styles.macroHint}>
            {dayMacros.mealCount} meal{dayMacros.mealCount === 1 ? '' : 's'} · per serving estimates
          </p>
        )}
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
