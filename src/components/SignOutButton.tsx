import { signOut } from '@/app/actions/auth'
import styles from '@/app/dashboard/page.module.css'

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className={styles.fabSecondary}>
        Sign out
      </button>
    </form>
  )
}
