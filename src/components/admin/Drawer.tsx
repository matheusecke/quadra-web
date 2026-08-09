import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../ui/cn'
import s from './Drawer.module.css'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Keyed on `open` alone: `onClose` is an inline arrow at every call site and would
  // otherwise re-run the focus restore on every render.
  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => trigger?.focus()
  }, [open])

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
        ref={panelRef}
        tabIndex={-1}
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
