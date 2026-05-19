import styles from './MealThumbnail.module.css'

type Props = {
  emoji: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function MealThumbnail({ emoji, imageUrl, size = 'md', className = '' }: Props) {
  return (
    <span className={`${styles.wrap} ${styles[size]} ${className}`} aria-hidden>
      {imageUrl ? (
        <img src={imageUrl} alt="" className={styles.img} />
      ) : null}
      <span className={styles.emoji}>{emoji}</span>
    </span>
  )
}
