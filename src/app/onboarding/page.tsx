import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import styles from '../(auth)/auth.module.css'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  return (
    <main className={styles.wrap}>
      <div className={styles.brand}>DinnerDeck</div>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome, {user.name}!</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
          Let&apos;s set up your first meal plan for your household of {user.householdSize}.
          {user.dietaryPreferences.length > 0
            ? ` We'll keep in mind: ${user.dietaryPreferences.join(', ')}.`
            : ''}
        </p>
        <Link
          href="/dashboard"
          className={styles.submit}
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          Continue to your week
        </Link>
      </div>
    </main>
  )
}
