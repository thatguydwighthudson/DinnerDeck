'use client'

import { Meal, DayPlan } from '@/lib/types'
import { MEAL_TYPE_LABELS, type MealType } from '@/lib/mealTypes'
import MealThumbnail from '@/components/MealThumbnail'
import styles from './sheets.module.css'

type MealPickerSheetProps = {
  day: string
  mealType?: MealType
  meals: Meal[]
  dayPlan: DayPlan | undefined
  usedDays: (mealId: number) => string[]
  onClose: () => void
  onSelectLeftovers: () => void
  onSelectMeal: (mealId: number) => void
  onViewMeal: (meal: Meal) => void
}

function sortedMeals(meals: Meal[]) {
  return [...meals].sort(
    (a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.name.localeCompare(b.name)
  )
}

export default function MealPickerSheet({
  day,
  mealType = 'dinner',
  meals,
  dayPlan,
  usedDays,
  onClose,
  onSelectLeftovers,
  onSelectMeal,
  onViewMeal,
}: MealPickerSheetProps) {
  const isSwap = Boolean(dayPlan?.adultMealId || dayPlan?.isLeftover)

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.sheet} onClick={e => e.stopPropagation()} role="dialog" aria-label={`${day} meal picker`}>
        <div className={styles.sheetHandle} />
        <h2 className={styles.sheetTitle}>
          {day} · {MEAL_TYPE_LABELS[mealType]} — {isSwap ? 'swap' : 'choose'}
        </h2>

        {mealType === 'dinner' && (
          <div className={styles.sheetItem} onClick={onSelectLeftovers} role="button" tabIndex={0}>
            <span className={styles.sEmoji} aria-hidden>↩</span>
            <div>
              <div className={styles.sName} style={{ fontStyle: 'italic' }}>Leftovers</div>
              <div className={styles.sSub}>Same as a previous night</div>
            </div>
            {dayPlan?.isLeftover && <span className={styles.sCheck} aria-hidden>✓</span>}
          </div>
        )}

        {sortedMeals(meals).map(m => {
          const selected = dayPlan?.adultMealId === m.id
          const otherDays = usedDays(m.id).filter(d => d !== day)

          return (
            <div
              key={m.id}
              className={`${styles.sheetItem} ${selected ? styles.sheetSelected : ''} ${m.isFavorite ? styles.sheetFav : ''}`}
              onClick={() => onSelectMeal(m.id)}
              role="button"
              tabIndex={0}
            >
              <MealThumbnail emoji={m.emoji} size="md" className={styles.sEmoji} />
              <div className={styles.sInfo}>
                <div className={styles.sName}>
                  {m.name}
                  {m.isFavorite && <span className={styles.sheetFavBadge} title="Favorite">★</span>}
                </div>
                <div className={styles.sSub}>
                  {m.isFavorite && <span className={styles.sheetFavLabel}>Favorite · </span>}
                  {m.proteinG}g protein
                  {otherDays.length > 0 ? ` · also on ${otherDays.join(', ')}` : ''}
                </div>
              </div>
              <button
                type="button"
                className={styles.infoBtn}
                onClick={e => { e.stopPropagation(); onViewMeal(m) }}
                aria-label={`View details for ${m.name}`}
              >
                ⓘ
              </button>
              {selected && <span className={styles.sCheck} aria-hidden>✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
