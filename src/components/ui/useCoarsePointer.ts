import { useEffect, useState } from 'react'

export function useCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(pointer: coarse)')
    const sync = () => setIsCoarse(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return isCoarse
}
