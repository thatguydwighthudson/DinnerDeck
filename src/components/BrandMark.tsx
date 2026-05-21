import Image from 'next/image'
import iconSrc from '@/app/icon.png'
import styles from './BrandMark.module.css'

type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  className?: string
}

export default function BrandMark({ size = 'sm', showName = true, className }: BrandMarkProps) {
  const iconSize = size === 'xl' ? 120 : size === 'lg' ? 56 : size === 'md' ? 40 : 28

  return (
    <div className={[styles.mark, styles[size], className].filter(Boolean).join(' ')}>
      <Image
        src={iconSrc}
        alt=""
        width={iconSize}
        height={iconSize}
        className={styles.icon}
        priority={size === 'lg' || size === 'xl'}
      />
      {showName && <span className={styles.name}>DinnerDeck</span>}
    </div>
  )
}
