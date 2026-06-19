import { useEffect, useRef, type RefObject } from 'react'

export function useInfiniteScroll(
  onIntersect: () => void,
  enabled: boolean,
): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const callbackRef = useRef(onIntersect)

  // Keep callbackRef current on every render without recreating the observer
  useEffect(() => {
    callbackRef.current = onIntersect
  })

  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) callbackRef.current() },
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled])

  return sentinelRef
}
