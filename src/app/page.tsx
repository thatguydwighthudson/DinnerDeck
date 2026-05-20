import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import styles from './(auth)/auth.module.css'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')

  return (
    <main className={styles.wrap}>
      <div className={styles.brand}>DinnerDeck</div>
      <p className={styles.sub}>Family meal planning — one week at a time.</p>
      <div className={styles.card}>
        <h1 className={styles.title}>Plan dinners together</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
          Build your meal library, suggest a week of dinners, and generate grocery lists for your
          household.
        </p>
        <Link href="/signup" className={styles.submit} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Create account
        </Link>
        <p className={styles.footer}>
          Already have an account? <Link href="/signin">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
