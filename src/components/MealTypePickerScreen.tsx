'use client'

import { useState } from 'react'
import {
  DAY_LABELS,
  Meal,
  MealSuggestion,
  type AlternateRecipe,
  type DayOfWeek,
} from '@/lib/types'
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
  assigning: boolean
  onBack: () => void
  onAssignLeftover: () => void
  onAssignEatOut: () => void
  onAssign: (pick: PickableMeal) => void
  onViewDetails: (meal: MealSuggestion | Meal) => void
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
  assigning,
  onBack,
  onAssignLeftover,
  onAssignEatOut,
  onAssign,
  onViewDetails,
}: Props) {
  const [selected, setSelected] = useState<PickableMeal | null>(null)
  const [altPick, setAltPick] = useState<AlternateRecipe | null>(null)

  const selectPick = (pick: PickableMeal) => {
    setSelected(pick)
    setAltPick(null)
  }

  const applyAlternate = (alt: AlternateRecipe) => {
    if (!selected) return
    const base = selected.meal
    setAltPick(alt)
    setSelected({
      ...selected,
      meal: {
        ...base,
        name: `${base.name} (${alt.siteName})`,
        imageUrl: alt.imageUrl ?? base.imageUrl,
        sourceUrl: alt.url,
      },
    })
  }

  const handleAddToWeek = () => {
    if (!selected) return
    onAssign(selected)
  }

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
              selected={selected}
              onSelect={selectPick}
              onViewDetails={onViewDetails}
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
              selected={selected}
              onSelect={selectPick}
              onViewDetails={onViewDetails}
            />
          ))}
        </section>
      )}

      {selected && (selected.meal.alternateRecipes?.length ?? 0) > 0 && (
        <section className={styles.altSection}>
          <h3 className={styles.sectionTitle}>Other versions</h3>
          <div className={styles.altRow}>
            {selected.meal.alternateRecipes!.map(alt => (
              <button
                key={alt.url}
                type="button"
                className={`${styles.altCard} ${altPick?.url === alt.url ? styles.altCardOn : ''}`}
                onClick={() => applyAlternate(alt)}
              >
                <MealThumbnail emoji={selected.meal.emoji} imageUrl={alt.imageUrl} size="md" />
                <span>{alt.siteName}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {selected && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={assigning}
            onClick={handleAddToWeek}
          >
            {assigning ? 'Saving…' : `Add to ${day}`}
          </button>
        </div>
      )}
    </div>
  )
}

function MealOptionCard({
  pick,
  selected,
  onSelect,
  onViewDetails,
}: {
  pick: PickableMeal
  selected: PickableMeal | null
  onSelect: (p: PickableMeal) => void
  onViewDetails: (m: MealSuggestion | Meal) => void
}) {
  const m = pick.meal
  const on = selected?.key === pick.key
  return (
    <div
      className={`${styles.card} ${on ? styles.cardOn : ''}`}
      onClick={() => onSelect(pick)}
      role="button"
      tabIndex={0}
    >
      <MealThumbnail emoji={m.emoji} imageUrl={m.imageUrl} size="md" />
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{m.name}</div>
        <div className={styles.cardMacros}>
          {m.proteinG}g protein · {m.carbsG}g carbs · {m.fatG}g fat
        </div>
      </div>
      <button
        type="button"
        className={styles.infoBtn}
        onClick={e => {
          e.stopPropagation()
          onViewDetails(m)
        }}
        aria-label="Details"
      >
        ⓘ
      </button>
    </div>
  )
}
