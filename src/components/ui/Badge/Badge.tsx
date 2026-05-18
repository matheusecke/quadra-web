import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../cn'
import styles from './Badge.module.css'

export type BadgeVariant = 'default' | 'accent' | 'live' | 'success' | 'warning' | 'danger' | 'ghost'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
  children: ReactNode
}

export function Badge({ variant = 'default', dot = false, children, className, ...props }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[`badge--${variant}`], className)} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}
