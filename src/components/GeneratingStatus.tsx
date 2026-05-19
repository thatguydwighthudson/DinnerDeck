'use client'

import styles from './GeneratingStatus.module.css'

type Props = {
  message: string | null
  className?: string
}

export default function GeneratingStatus({ message, className }: Props) {
  if (!message) return null

  return (
    <p className={`${styles.status} ${className ?? ''}`} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden />
      {message}
    </p>
  )
}
