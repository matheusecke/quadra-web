import { useEffect, useRef, type RefObject } from 'react'

export function useInfiniteScroll(
  onIntersect: () => void,
  enabled: boolean,
): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) onIntersect() },
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect, enabled])

  return sentinelRef
}
