import { useCallback, useEffect, useRef, useState } from 'react'

type ScrollChromeState = {
  canScroll: boolean
  isScrolling: boolean
  fadeTop: boolean
  fadeBottom: boolean
  thumbHeight: number
  thumbTop: number
}

const initialState: ScrollChromeState = {
  canScroll: false,
  isScrolling: false,
  fadeTop: false,
  fadeBottom: false,
  thumbHeight: 0,
  thumbTop: 0,
}

export function useScrollChrome() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<number | null>(null)
  const [state, setState] = useState<ScrollChromeState>(initialState)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const refresh = useCallback(
    (showScrollbar = false) => {
      const el = scrollRef.current
      if (!el) return

      const maxScrollTop = el.scrollHeight - el.clientHeight
      const canScroll = maxScrollTop > 2
      const atTop = el.scrollTop <= 2
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
      const thumbHeight = canScroll
        ? Math.max(32, (el.clientHeight / el.scrollHeight) * el.clientHeight)
        : 0
      const thumbTop =
        canScroll && maxScrollTop > 0
          ? (el.scrollTop / maxScrollTop) * (el.clientHeight - thumbHeight)
          : 0

      clearHideTimer()
      setState({
        canScroll,
        isScrolling: canScroll && showScrollbar,
        fadeTop: canScroll && !atTop,
        fadeBottom: canScroll && !atBottom,
        thumbHeight,
        thumbTop,
      })

      if (canScroll && showScrollbar) {
        hideTimerRef.current = window.setTimeout(() => {
          setState((current) => ({ ...current, isScrolling: false }))
          hideTimerRef.current = null
        }, 900)
      }
    },
    [clearHideTimer],
  )

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined

    const handleScroll = () => refresh(true)
    const handleResize = () => refresh(false)

    el.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    refresh(false)

    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      clearHideTimer()
    }
  }, [clearHideTimer, refresh])

  return { scrollRef, state, refresh }
}
