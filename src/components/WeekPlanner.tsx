'use client'

import { DAYS, DayPlan, Meal, KidsMeal } from '@/lib/types'
import { MEAL_TYPE_LABELS, type MealType } from '@/lib/mealTypes'
import MealThumbnail from '@/components/MealThumbnail'
import styles from '@/app/dashboard/page.module.css'

type Props = {
  activeMealTypes: MealType[]
  weekPlan: DayPlan[]
  meals: Meal[]
  kidsMeals: KidsMeal[]
  expandedDay: string | null
  dinnerPlans: DayPlan[]
  groceryMealCount: number
  onExpandDay: (day: string | null) => void
  onOpenMealPicker: (day: string, mealType: MealType) => void
  onOpenKidsPicker: (day: string) => void
  onViewMeal: (meal: Meal) => void
  onUpdateSlot: (day: string, mealType: MealType, updates: Partial<DayPlan>) => void
  onGoGrocery: () => void
}

export default function WeekPlanner({
  activeMealTypes,
  weekPlan,
  meals,
  kidsMeals,
  expandedDay,
  dinnerPlans,
  groceryMealCount,
  onExpandDay,
  onOpenMealPicker,
  onOpenKidsPicker,
  onViewMeal,
  onUpdateSlot,
  onGoGrocery,
}: Props) {
  const getDayPlan = (day: string, mealType: MealType) =>
    weekPlan.find(p => p.dayOfWeek === day && p.mealType === mealType)

  return (
    <div>
      {DAYS.map(day => {
        const dinnerPlan = getDayPlan(day, 'dinner')
        const dinnerMeal = dinnerPlan?.adultMealId ? meals.find(m => m.id === dinnerPlan.adultMealId) : null
        const kids = dinnerPlan?.kidsMealId ? kidsMeals.find(k => k.id === dinnerPlan.kidsMealId) : null
        const open = expandedDay === day
        const filledCount = activeMealTypes.filter(mt => {
          const p = getDayPlan(day, mt)
          return p?.adultMealId || p?.isLeftover
        }).length
        const hasAny = filledCount > 0

        return (
          <div key={day} className={`${styles.dayCard} ${hasAny ? styles.dayCardFilled : ''}`}>
            <div className={styles.dayHeader} onClick={() => onExpandDay(open ? null : day)}>
              <span className={styles.dayName}>{day}</span>
              {hasAny && (
                <span className={styles.dayPill}>
                  {filledCount}/{activeMealTypes.length} meals
                </span>
              )}
              <span style={{ flex: 1 }} />
              {dinnerPlan?.isLeftover ? (
                <span className={styles.dayMealName}>↩ Dinner leftovers</span>
              ) : dinnerMeal ? (
                <span className={styles.dayMealName}>
                  {dinnerMeal.emoji} {dinnerMeal.name}
                </span>
              ) : hasAny ? (
                <span className={styles.dayMealName} style={{ color: 'var(--muted)' }}>Tap to plan</span>
              ) : (
                <span className={styles.dayMealName} style={{ color: 'var(--muted)' }}>+ Plan day</span>
              )}
              <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>›</span>
            </div>

            {open && (
              <div className={styles.dayBody}>
                {activeMealTypes.map(mealType => {
                  const p = getDayPlan(day, mealType)
                  const meal = p?.adultMealId ? meals.find(m => m.id === p.adultMealId) : null
                  return (
                    <div key={mealType}>
                      <div className={styles.slotRow}>
                        <span className={styles.slotLabel}>{MEAL_TYPE_LABELS[mealType]}</span>
                        <button
                          type="button"
                          className={`${styles.slotBtn} ${p?.isLeftover ? styles.slotLeftover : meal ? styles.slotFilled : ''}`}
                          onClick={() => onOpenMealPicker(day, mealType)}
                        >
                          <span className={styles.slotBtnInner}>
                            {p?.isLeftover ? (
                              '↩ Leftovers'
                            ) : meal ? (
                              <>
                                <MealThumbnail emoji={meal.emoji} size="sm" />
                                {meal.name}
                              </>
                            ) : (
                              'Choose…'
                            )}
                          </span>
                          {(meal || p?.isLeftover) && <span className={styles.swapHint}>Swap</span>}
                          {(meal || p?.isLeftover) && (
                            <span
                              className={styles.clearX}
                              onClick={e => {
                                e.stopPropagation()
                                onUpdateSlot(day, mealType, { adultMealId: null, isLeftover: false })
                              }}
                            >
                              ×
                            </span>
                          )}
                        </button>
                      </div>
                      {meal && (
                        <div className={styles.slotActions}>
                          <button type="button" className={styles.viewDetailsBtn} onClick={() => onViewMeal(meal)}>
                            View recipe
                          </button>
                          {mealType === 'dinner' && (
                            <div className={styles.servRow}>
                              <span className={styles.slotLabel}>Servings</span>
                              <div className={styles.servCtrl}>
                                <button
                                  type="button"
                                  className={styles.srvBtn}
                                  onClick={() =>
                                    onUpdateSlot(day, mealType, { servings: Math.max(1, (p?.servings ?? 4) - 1) })
                                  }
                                >
                                  −
                                </button>
                                <span className={styles.srvNum}>{p?.servings ?? 4}</span>
                                <button
                                  type="button"
                                  className={styles.srvBtn}
                                  onClick={() =>
                                    onUpdateSlot(day, mealType, { servings: Math.min(12, (p?.servings ?? 4) + 1) })
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {activeMealTypes.includes('dinner') && (
                  <div className={styles.slotRow}>
                    <span className={`${styles.slotLabel} ${styles.kidsLabel}`}>Kids</span>
                    <button
                      type="button"
                      className={`${styles.slotBtn} ${kids ? styles.slotKids : ''}`}
                      onClick={() => onOpenKidsPicker(day)}
                    >
                      <span>{kids ? `${kids.emoji} ${kids.name}` : 'Same as adults…'}</span>
                      {kids && (
                        <span
                          className={styles.clearX}
                          onClick={e => {
                            e.stopPropagation()
                            onUpdateSlot(day, 'dinner', { kidsMealId: null })
                          }}
                        >
                          ×
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {groceryMealCount > 0 && (
        <button className={styles.fabSecondary} style={{ marginTop: 8 }} onClick={onGoGrocery}>
          🛒 Build grocery list ({dinnerPlans.filter(p => p.adultMealId || p.isLeftover).length} dinners planned)
        </button>
      )}
    </div>
  )
}
