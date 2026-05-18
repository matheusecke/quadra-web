import styles from './LoadingState.module.css'

export interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
