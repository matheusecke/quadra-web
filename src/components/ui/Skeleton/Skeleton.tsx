import type { CSSProperties, ReactNode } from 'react'
import s from './Skeleton.module.css'

type SkeletonProps = {
  loading?: boolean
  children?: ReactNode
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({ loading = true, children, width, height, className }: SkeletonProps) {
  if (!loading) return <>{children}</>

  const style: CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={[s.root, className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
    />
  )
}
