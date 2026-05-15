import type { ReactNode } from 'react'
import { useId } from 'react'
import { Input } from '../Input'
import type { InputProps } from '../Input'
import styles from './Field.module.css'

export interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  inputProps?: InputProps
  children?: ReactNode
  id?: string
}

export function Field({ label, hint, error, required, inputProps, children, id }: FieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      {children ?? <Input id={fieldId} error={!!error} fullWidth {...inputProps} />}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
