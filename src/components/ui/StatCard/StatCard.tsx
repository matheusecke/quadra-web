import type { ReactNode } from 'react'
import { cn } from '../cn'
import styles from './StatCard.module.css'

export type Trend = 'up' | 'down' | 'neutral'

export interface StatCardProps {
  label: string
  value: ReactNode
  delta?: string
  trend?: Trend
  className?: string
}

const trendArrow: Record<Trend, string> = {
  up: '↑',
  down: '↓',
  neutral: '→',
}

export function StatCard({ label, value, delta, trend = 'neutral', className }: StatCardProps) {
  return (
    <div className={cn(styles.card, className)}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {delta && (
        <p className={cn(styles.delta, styles[`delta--${trend}`])}>
          <span className={styles.arrow} aria-hidden="true">
            {trendArrow[trend]}
          </span>
          {delta}
        </p>
      )}
    </div>
  )
}
