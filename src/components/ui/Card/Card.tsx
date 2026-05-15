/* eslint-disable react-refresh/only-export-components -- compound component pattern (Card.Header, Card.Body, Card.Footer) */
import type { HTMLAttributes } from 'react'
import { cn } from '../cn'
import styles from './Card.module.css'

export type CardVariant = 'default' | 'elevated' | 'inverse'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

function CardRoot({ variant = 'default', children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(styles.card, variant !== 'default' && styles[`card--${variant}`], className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.header, className)} {...props}>
      {children}
    </div>
  )
}

function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.body, className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.footer, className)} {...props}>
      {children}
    </div>
  )
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
})
