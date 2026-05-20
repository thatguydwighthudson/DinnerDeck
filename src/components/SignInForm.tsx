'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signIn, type AuthFormState } from '@/app/actions/auth'
import PasswordField from '@/components/PasswordField'
import styles from '@/app/(auth)/auth.module.css'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? 'Signing in…' : label}
    </button>
  )
}

export default function SignInForm() {
  const [state, action] = useFormState(signIn, undefined as AuthFormState)

  return (
    <main className={styles.wrap}>
      <div className={styles.brand}>DinnerDeck</div>
      <p className={styles.sub}>Sign in to your meal plan</p>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <form action={action}>
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
            autoComplete="current-password"
            required
            labelClassName={styles.label}
            fieldClassName={styles.field}
            errorClassName={styles.error}
            error={state?.errors?.password}
          />
          <SubmitButton label="Sign in" />
        </form>
        <p className={styles.footer}>
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </main>
  )
}
