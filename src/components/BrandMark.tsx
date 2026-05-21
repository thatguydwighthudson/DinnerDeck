import Image from 'next/image'
import iconSrc from '@/app/icon.png'
import styles from './BrandMark.module.css'

type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export default function BrandMark({ size = 'sm', showName = true, className }: BrandMarkProps) {
  const iconSize = size === 'lg' ? 56 : size === 'md' ? 40 : 28

  return (
    <div className={[styles.mark, styles[size], className].filter(Boolean).join(' ')}>
      <Image
        src={iconSrc}
        alt=""
        width={iconSize}
        height={iconSize}
        className={styles.icon}
        priority={size === 'lg'}
      />
      {showName && <span className={styles.name}>DinnerDeck</span>}
    </div>
  )
}
