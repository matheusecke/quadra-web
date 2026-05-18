import type { InputHTMLAttributes } from 'react'
import { cn } from '../cn'
import styles from './Input.module.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  fullWidth?: boolean
}

export function Input({ error = false, fullWidth = false, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        styles.input,
        error && styles['input--error'],
        fullWidth && styles['input--full'],
        className,
      )}
      {...props}
    />
  )
}
