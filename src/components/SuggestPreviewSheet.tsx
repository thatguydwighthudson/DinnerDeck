'use client'

import { useMemo, useState } from 'react'
import type { GroupedSuggestions, MealSuggestion } from '@/lib/types'
import { MEAL_TYPE_LABELS, type MealType } from '@/lib/mealTypes'
import MealThumbnail from '@/components/MealThumbnail'
import styles from './sheets.module.css'
import previewStyles from './SuggestPreviewSheet.module.css'

type Props = {
  suggestions: GroupedSuggestions
  mealTypes: MealType[]
  saving: boolean
  onClose: () => void
  onConfirm: (selections: { mealType: MealType; meals: MealSuggestion[] }[]) => void
}

function selectionKey(mealType: MealType, meal: MealSuggestion, index: number) {
  return `${mealType}:${meal.name}-${index}`
}

export default function SuggestPreviewSheet({
  suggestions,
  mealTypes,
  saving,
  onClose,
  onConfirm,
}: Props) {
  const entries = useMemo(
    () =>
      mealTypes
        .filter(t => (suggestions[t]?.length ?? 0) > 0)
        .map(t => ({ mealType: t, meals: suggestions[t]! })),
    [suggestions, mealTypes]
  )

  const [selected, setSelected] = useState<Set<string>>(() => {
    const set = new Set<string>()
    for (const { mealType, meals } of entries) {
      meals.forEach((m, i) => set.add(selectionKey(mealType, m, i)))
    }
    return set
  })

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleConfirm = () => {
    const selections = entries
      .map(({ mealType, meals }) => ({
        mealType,
        meals: meals.filter((m, i) => selected.has(selectionKey(mealType, m, i))),
      }))
      .filter(s => s.meals.length > 0)
    onConfirm(selections)
  }

  const selectedCount = selected.size

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={`${styles.sheet} ${previewStyles.sheetTall}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Review meal suggestions"
      >
        <div className={styles.sheetHandle} />
        <h2 className={styles.sheetTitle}>Review suggestions</h2>
        <p className={previewStyles.hint}>
          Toggle off anything you don&apos;t want. Nothing is saved until you confirm.
        </p>

        <div className={previewStyles.scroll}>
          {entries.map(({ mealType, meals }) => (
            <section key={mealType} className={previewStyles.section}>
              <h3 className={previewStyles.sectionTitle}>{MEAL_TYPE_LABELS[mealType]}</h3>
              {meals.map((m, i) => {
                const key = selectionKey(mealType, m, i)
                const on = selected.has(key)
                return (
                  <div
                    key={key}
                    className={`${previewStyles.card} ${on ? previewStyles.cardOn : ''}`}
                    onClick={() => toggle(key)}
                    role="button"
                    tabIndex={0}
                  >
                    <MealThumbnail emoji={m.emoji} imageUrl={m.imageUrl} size="md" />
                    <div className={previewStyles.cardBody}>
                      <div className={previewStyles.cardName}>{m.name}</div>
                      <div className={previewStyles.cardMacros}>
                        {m.proteinG}g protein · {m.carbsG}g carbs · {m.fatG}g fat
                      </div>
                      <div className={previewStyles.cardTags}>
                        {m.tags.includes('high-protein') && (
                          <span className={previewStyles.tagP}>high protein</span>
                        )}
                        {m.isVeg && <span className={previewStyles.tagV}>veg</span>}
                        {m.tags.includes('low-carb') && (
                          <span className={previewStyles.tagLc}>low carb</span>
                        )}
                      </div>
                    </div>
                    <label className={previewStyles.toggle} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={on} onChange={() => toggle(key)} />
                    </label>
                  </div>
                )
              })}
            </section>
          ))}
        </div>

        <div className={previewStyles.footer}>
          <button
            type="button"
            className={previewStyles.confirmBtn}
            disabled={saving || selectedCount === 0}
            onClick={handleConfirm}
          >
            {saving ? 'Saving…' : `Add selected to library & plan week (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  )
}
