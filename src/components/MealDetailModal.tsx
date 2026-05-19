'use client'

import { useState } from 'react'
import { AlternateRecipe, Meal, MealSuggestion, PlannedMeal } from '@/lib/types'
import MealThumbnail from '@/components/MealThumbnail'
import styles from './MealDetailModal.module.css'

type DetailMeal = Meal | MealSuggestion | PlannedMeal

type Props = {
  meal: DetailMeal
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onUpdate?: () => void
  updateLabel?: string
  onSelectAlternative?: (alt: AlternateRecipe) => void
  selectedAlternateUrl?: string | null
}

export default function MealDetailModal({
  meal,
  onClose,
  onEdit,
  onDelete,
  onUpdate,
  updateLabel = 'Update day',
  onSelectAlternative,
  selectedAlternateUrl,
}: Props) {
  const [showAlternatives, setShowAlternatives] = useState(false)
  const aiGenerated = 'aiGenerated' in meal && meal.aiGenerated
  const ingredients = meal.ingredients ?? []
  const hasIngredients = ingredients.length > 0
  const hasGrocery = meal.samItems.length > 0 || meal.htItems.length > 0
  const alternates = (meal.alternateRecipes ?? []).filter(
    (a): a is AlternateRecipe => Boolean(a?.url)
  )
  const canPickAlternates = Boolean(onSelectAlternative && alternates.length > 0)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-detail-title"
      >
        <div className={styles.header}>
          <MealThumbnail emoji={meal.emoji} size="lg" className={styles.emoji} />
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={styles.body}>
          <h2 id="meal-detail-title" className={styles.title}>
            {meal.name}
            {aiGenerated && <span className={styles.aiBadge}>AI</span>}
          </h2>

          <div className={styles.tags}>
            {meal.tags.includes('high-protein') && (
              <span className={`${styles.tag} ${styles.tagP}`}>high protein</span>
            )}
            {meal.isVeg && <span className={`${styles.tag} ${styles.tagV}`}>veg-friendly</span>}
            {meal.tags.includes('low-carb') && (
              <span className={`${styles.tag} ${styles.tagLc}`}>low carb</span>
            )}
          </div>

          <p className={styles.macros}>
            {meal.proteinG}g protein · {meal.carbsG}g carbs · {meal.fatG}g fat
          </p>

          {(meal.servingSize?.trim() || meal.servingWeight?.trim()) && (
            <p className={styles.servingInfo}>
              {[meal.servingSize?.trim(), meal.servingWeight?.trim()].filter(Boolean).join(' · ')}
            </p>
          )}

          {meal.notes?.trim() ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Notes</h3>
              <p className={styles.description}>{meal.notes}</p>
            </section>
          ) : null}

          {meal.description ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>About</h3>
              <p className={styles.description}>{meal.description}</p>
            </section>
          ) : (
            <p className={styles.muted}>No description yet.</p>
          )}

          {hasIngredients && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Ingredients</h3>
              <ul className={styles.list}>
                {ingredients.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {meal.instructions ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>How to cook</h3>
              <p className={styles.instructions}>{meal.instructions}</p>
            </section>
          ) : null}

          {!hasIngredients && hasGrocery && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Ingredients</h3>
              <p className={styles.mutedNote}>From your grocery list:</p>
              <ul className={styles.list}>
                {[...meal.samItems, ...meal.htItems].map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {hasGrocery && hasIngredients && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Grocery list</h3>
              {meal.samItems.length > 0 && (
                <>
                  <p className={styles.storeLabel}>Sam&apos;s Club</p>
                  <ul className={styles.list}>
                    {meal.samItems.map((item, i) => (
                      <li key={`s-${i}`}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
              {meal.htItems.length > 0 && (
                <>
                  <p className={styles.storeLabel}>Harris Teeter</p>
                  <ul className={styles.list}>
                    {meal.htItems.map((item, i) => (
                      <li key={`h-${i}`}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Source</h3>
            {meal.sourceUrl?.trim() ? (
              <a
                className={styles.sourceUrl}
                href={meal.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {meal.sourceUrl}
              </a>
            ) : (
              <p className={styles.muted}>No recipe link saved for this meal.</p>
            )}
          </section>

          {canPickAlternates && (
            <section className={styles.section}>
              <button
                type="button"
                className={styles.altToggleBtn}
                onClick={() => setShowAlternatives(v => !v)}
              >
                {showAlternatives ? 'Hide alternatives' : 'Find alternatives'}
              </button>
              {showAlternatives && (
                <div className={styles.altRow}>
                  {alternates.map(alt => (
                    <button
                      key={alt.url}
                      type="button"
                      className={`${styles.altCard} ${selectedAlternateUrl === alt.url ? styles.altCardOn : ''}`}
                      onClick={() => onSelectAlternative!(alt)}
                    >
                      <MealThumbnail emoji={meal.emoji} size="md" className={styles.altThumb} />
                      <span className={styles.altSite}>{alt.siteName}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {!canPickAlternates && alternates.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Other versions</h3>
              <div className={styles.altRow}>
                {alternates.map(alt => (
                  <a
                    key={alt.url}
                    className={styles.altCard}
                    href={alt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MealThumbnail emoji={meal.emoji} size="md" className={styles.altThumb} />
                    <span className={styles.altSite}>{alt.siteName}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {(onUpdate || onEdit || onDelete) && (
            <div className={styles.actions}>
              {onUpdate && (
                <button type="button" className={styles.updateBtn} onClick={onUpdate}>
                  {updateLabel}
                </button>
              )}
              {onEdit && (
                <button type="button" className={styles.editBtn} onClick={onEdit}>
                  Edit meal
                </button>
              )}
              {onDelete && (
                <button type="button" className={styles.deleteBtn} onClick={onDelete}>
                  Remove from library
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
