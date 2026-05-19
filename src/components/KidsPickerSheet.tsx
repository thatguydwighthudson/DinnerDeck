'use client'

import { Meal, KidsMeal, DayPlan } from '@/lib/types'
import styles from './sheets.module.css'

type KidsPickerSheetProps = {
  day: string
  dayPlan: DayPlan | undefined
  kidsMeals: KidsMeal[]
  meals: Meal[]
  onClose: () => void
  onSelectSameAsAdults: () => void
  onSelectKidsMeal: (kidsMealId: number) => void
}

export default function KidsPickerSheet({
  day,
  dayPlan,
  kidsMeals,
  meals,
  onClose,
  onSelectSameAsAdults,
  onSelectKidsMeal,
}: KidsPickerSheetProps) {
  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.sheet} onClick={e => e.stopPropagation()} role="dialog" aria-label={`${day} kids meal picker`}>
        <div className={styles.sheetHandle} />
        <h2 className={styles.sheetTitle}>{day} — kids&apos; meal</h2>

        <div className={styles.sheetItem} onClick={onSelectSameAsAdults} role="button" tabIndex={0}>
          <span className={styles.sEmoji} aria-hidden>👨‍👩‍👧</span>
          <div><div className={styles.sName}>Same as adults</div></div>
          {!dayPlan?.kidsMealId && <span className={styles.sCheck} aria-hidden>✓</span>}
        </div>

        {kidsMeals.map(k => {
          const selected = dayPlan?.kidsMealId === k.id
          return (
            <div
              key={k.id}
              className={`${styles.sheetItem} ${selected ? styles.sheetSelected : ''}`}
              onClick={() => onSelectKidsMeal(k.id)}
              role="button"
              tabIndex={0}
            >
              <span className={styles.sEmoji} aria-hidden>{k.emoji}</span>
              <div>
                <div className={styles.sName}>{k.name}{k.liked ? ' ⭐' : ''}</div>
                <div className={styles.sSub}>{k.note}</div>
              </div>
              {selected && <span className={styles.sCheck} aria-hidden>✓</span>}
            </div>
          )
        })}

        <p className={styles.sheetTitle} style={{ fontSize: 13, padding: '12px 16px 8px', borderTop: '1px solid var(--border)' }}>
          Kids options from library
        </p>
        {meals.map(m => (
          <div key={m.id} className={styles.sheetItem} onClick={onSelectSameAsAdults} role="button" tabIndex={0}>
            <span className={styles.sEmoji} aria-hidden>{m.emoji}</span>
            <div>
              <div className={styles.sName}>{m.name}</div>
              <div className={styles.sSub}>From adult library</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
