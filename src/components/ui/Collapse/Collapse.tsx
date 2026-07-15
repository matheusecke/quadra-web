import { useEffect, useState, type ReactNode } from 'react'
import styles from './Collapse.module.css'

const DURATION_MS = 220

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface CollapseProps {
  open: boolean
  id?: string
  role?: string
  'aria-label'?: string
  children: ReactNode
}

export function Collapse({ open, id, role, children, ...aria }: CollapseProps) {
  const [mounted, setMounted] = useState(open)
  const [settled, setSettled] = useState(open)
  const [wasOpen, setWasOpen] = useState(open)
  // Snapshot the last open children so the closing panel keeps its content
  // (and the closing team's data) mounted through the transition.
  const [lastChildren, setLastChildren] = useState<ReactNode>(open ? children : null)
  const reduced = prefersReducedMotion()

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setMounted(true)
      setSettled(reduced)
    } else {
      setSettled(false)
      if (reduced) setMounted(false)
    }
  }

  if (open && children !== lastChildren) setLastChildren(children)

  useEffect(() => {
    if (open && !reduced) {
      const timer = setTimeout(() => setSettled(true), DURATION_MS)
      return () => clearTimeout(timer)
    }

    if (!open && !reduced) {
      const timer = setTimeout(() => setMounted(false), DURATION_MS)
      return () => clearTimeout(timer)
    }
  }, [open, reduced])

  const shouldRender = open || mounted

  return (
    <div className={styles.collapse} data-open={open}>
      <div
        className={styles.inner}
        data-settled={open && settled}
        id={id}
        role={open ? role : undefined}
        aria-hidden={open ? undefined : true}
        inert={open ? undefined : true}
        {...aria}
      >
        {shouldRender ? (open ? children : lastChildren) : null}
      </div>
    </div>
  )
}
