'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signUp, type AuthFormState } from '@/app/actions/auth'
import BrandMark from '@/components/BrandMark'
import PasswordField from '@/components/PasswordField'
import styles from '@/app/(auth)/auth.module.css'

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Nut-free',
  'Halal',
  'Kosher',
] as const

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? 'Creating account…' : 'Create account'}
    </button>
  )
}

export default function SignUpForm() {
  const [state, action] = useFormState(signUp, undefined as AuthFormState)
  const [householdSize, setHouseholdSize] = useState(2)

  return (
    <main className={styles.wrap}>
      <BrandMark size="lg" className={styles.brand} />
      <p className={styles.sub}>Set up your household meal plan</p>
      <div className={styles.card}>
        <h1 className={styles.title}>Create account</h1>
        <form action={action}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Name
            </label>
            <input id="name" name="name" type="text" autoComplete="name" required />
            {state?.errors?.name && <p className={styles.error}>{state.errors.name}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required />
            {state?.errors?.email && <p className={styles.error}>{state.errors.email}</p>}
          </div>
          <PasswordField
            id="password"
            name="password"
            label="Password"
            autoComplete="new-password"
            minLength={8}
            required
            labelClassName={styles.label}
            fieldClassName={styles.field}
            errorClassName={styles.error}
            error={state?.errors?.password}
          />
          <div className={styles.field}>
            <span className={styles.label}>Household size</span>
            <input type="hidden" name="household_size" value={householdSize} />
            <div className={styles.householdRow}>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.householdBtn} ${householdSize === n ? styles.householdBtnOn : ''}`}
                  onClick={() => setHouseholdSize(n)}
                  aria-pressed={householdSize === n}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Dietary preferences (optional)</span>
            <div className={styles.checkGrid}>
              {DIETARY_OPTIONS.map(opt => (
                <label key={opt} className={styles.checkLabel}>
                  <input type="checkbox" name="dietary_preferences" value={opt} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <SubmitButton />
        </form>
        <p className={styles.footer}>
          Already have an account? <Link href="/signin">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
