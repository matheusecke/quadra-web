import { useCallback, useEffect, useRef, useState } from 'react'

type ScrollChromeState = {
  fadeTop: boolean
  fadeBottom: boolean
}

const initialState: ScrollChromeState = {
  fadeTop: false,
  fadeBottom: false,
}

export function useScrollChrome() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<ScrollChromeState>(initialState)

  const refresh = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const canScroll = el.scrollHeight - el.clientHeight > 2
    setState({
      fadeTop: canScroll && el.scrollTop > 2,
      fadeBottom: canScroll && el.scrollTop + el.clientHeight < el.scrollHeight - 2,
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined

    el.addEventListener('scroll', refresh, { passive: true })
    window.addEventListener('resize', refresh)
    const animationFrame = window.requestAnimationFrame(refresh)

    return () => {
      el.removeEventListener('scroll', refresh)
      window.removeEventListener('resize', refresh)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [refresh])

  return { scrollRef, state, refresh }
}
