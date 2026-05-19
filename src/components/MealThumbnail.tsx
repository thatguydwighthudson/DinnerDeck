import styles from './MealThumbnail.module.css'

type Props = {
  emoji: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function MealThumbnail({ emoji, size = 'md', className = '' }: Props) {
  return (
    <span className={`${styles.wrap} ${styles[size]} ${className}`} aria-hidden>
      <span className={styles.emoji}>{emoji || '🍽'}</span>
    </span>
  )
}
