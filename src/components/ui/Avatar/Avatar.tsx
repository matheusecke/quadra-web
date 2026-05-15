import { cn } from '../cn'
import styles from './Avatar.module.css'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps {
  initials: string
  src?: string
  size?: AvatarSize
  alt?: string
  className?: string
}

export function Avatar({ initials, src, size = 'md', alt, className }: AvatarProps) {
  const label = alt ?? initials

  return (
    <div
      className={cn(styles.avatar, styles[`avatar--${size}`], className)}
      aria-label={label}
      role="img"
    >
      {src ? (
        <img src={src} alt={label} className={styles.img} />
      ) : (
        <span className={styles.initials} aria-hidden="true">
          {initials.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}
