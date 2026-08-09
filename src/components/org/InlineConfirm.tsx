import { useEffect, useId, useRef } from 'react'
import { Button } from '../ui/Button/Button'
import type { ButtonVariant } from '../ui/Button/Button'
import s from './InlineConfirm.module.css'

type Props = {
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
  errorMessage?: string | null
  variant?: Extract<ButtonVariant, 'primary' | 'danger'>
}

export function InlineConfirm({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending = false,
  errorMessage = null,
  variant = 'danger',
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const messageId = useId()

  useEffect(() => {
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [])

  return (
    <div ref={panelRef} className={s.panel} role="group" aria-label="Confirmação da ação" aria-describedby={messageId}>
      <p id={messageId} className={s.message}>{message}</p>
      {errorMessage && (
        <p className={s.error} role="alert">
          {errorMessage}
        </p>
      )}
      <div className={s.actions}>
        <Button type="button" variant={variant} size="sm" onClick={onConfirm} loading={isPending}>
          {confirmLabel}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
