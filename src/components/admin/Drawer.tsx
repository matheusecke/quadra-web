import { useEffect, type ReactNode } from 'react'
import { cn } from '../ui/cn'
import s from './Drawer.module.css'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      {open && (
        <div
          className={s.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(s.drawer, open && s.open)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={s.header}>
          <h2 className={s.title}>{title}</h2>
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Fechar painel"
          >
            ✕
          </button>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </>
  )
}
