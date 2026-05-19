'use client'

import { DAY_LABELS, Meal, MealSuggestion, type DayOfWeek } from '@/lib/types'
import { MEAL_TYPE_LABELS, type MealType } from '@/lib/mealTypes'
import MealThumbnail from '@/components/MealThumbnail'
import styles from './MealTypePickerScreen.module.css'

export type PickableMeal = {
  key: string
  source: 'suggestion' | 'library'
  meal: MealSuggestion | Meal
  libraryId?: number
}

type Props = {
  day: DayOfWeek
  mealType: MealType
  suggestions: MealSuggestion[]
  libraryMeals: Meal[]
  assignedMealId: number | null
  assigning: boolean
  onBack: () => void
  onAssignLeftover: () => void
  onAssignEatOut: () => void
  onSwap: (pick: PickableMeal) => void
  onViewDetails: (pick: PickableMeal) => void
}

function toSuggestion(m: Meal): MealSuggestion {
  return {
    name: m.name,
    emoji: m.emoji,
    tags: m.tags,
    isVeg: m.isVeg,
    proteinG: m.proteinG,
    carbsG: m.carbsG,
    fatG: m.fatG,
    description: m.description,
    instructions: m.instructions,
    ingredients: m.ingredients,
    samItems: m.samItems,
    htItems: m.htItems,
    imageUrl: m.imageUrl,
    sourceUrl: m.sourceUrl,
    alternateRecipes: m.alternateRecipes,
  }
}

export default function MealTypePickerScreen({
  day,
  mealType,
  suggestions,
  libraryMeals,
  assignedMealId,
  assigning,
  onBack,
  onAssignLeftover,
  onAssignEatOut,
  onSwap,
  onViewDetails,
}: Props) {
  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.back} onClick={onBack}>
        ← {DAY_LABELS[day]}
      </button>
      <h2 className={styles.title}>{MEAL_TYPE_LABELS[mealType]}</h2>

      <section className={styles.quick}>
        <button type="button" className={styles.quickBtn} onClick={onAssignLeftover} disabled={assigning}>
          ↩ Leftovers
        </button>
        <button type="button" className={styles.quickBtn} onClick={onAssignEatOut} disabled={assigning}>
          🍽 Eat out
        </button>
      </section>

      {suggestions.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>This week&apos;s suggestions</h3>
          {suggestions.map((m, i) => (
            <MealOptionCard
              key={`s-${i}-${m.name}`}
              pick={{ key: `s-${i}`, source: 'suggestion', meal: m }}
              isAssigned={false}
              assigning={assigning}
              onViewDetails={onViewDetails}
              onSwap={onSwap}
            />
          ))}
        </section>
      )}

      {libraryMeals.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>Your library</h3>
          {libraryMeals.map(m => (
            <MealOptionCard
              key={`lib-${m.id}`}
              pick={{ key: `lib-${m.id}`, source: 'library', meal: toSuggestion(m), libraryId: m.id }}
              isAssigned={assignedMealId === m.id}
              assigning={assigning}
              onViewDetails={onViewDetails}
              onSwap={onSwap}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function MealOptionCard({
  pick,
  isAssigned,
  assigning,
  onViewDetails,
  onSwap,
}: {
  pick: PickableMeal
  isAssigned: boolean
  assigning: boolean
  onViewDetails: (p: PickableMeal) => void
  onSwap: (p: PickableMeal) => void
}) {
  const m = pick.meal
  return (
    <div
      className={`${styles.card} ${isAssigned ? styles.cardAssigned : ''}`}
      onClick={() => onViewDetails(pick)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewDetails(pick)
        }
      }}
    >
      <MealThumbnail emoji={m.emoji} size="md" />
      <div className={styles.cardBody}>
        <div className={styles.cardName}>
          {m.name}
          {isAssigned && <span className={styles.plannedBadge}>Planned</span>}
        </div>
        <div className={styles.cardMacros}>
          {m.proteinG}g protein · {m.carbsG}g carbs · {m.fatG}g fat
        </div>
      </div>
      <button
        type="button"
        className={styles.swapBtn}
        disabled={assigning}
        onClick={e => {
          e.stopPropagation()
          onSwap(pick)
        }}
        aria-label={isAssigned ? 'Currently planned' : 'Swap to this meal'}
      >
        {isAssigned ? '✓' : 'Swap'}
      </button>
    </div>
  )
}
