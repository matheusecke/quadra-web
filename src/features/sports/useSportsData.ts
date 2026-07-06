/**
 * Sports domain — athlete read hooks that simulate the async shape of a future API.
 *
 * ⚠️ MOCK: these resolve local athlete data from `mock-sports-data.ts` behind a tiny
 * artificial delay so the screens exercise their loading / error / empty states.
 * Tournament/match/season data has moved to the `sportsApi` seam + React Query hooks
 * (`queries.ts`); athlete aggregates still read reference mock data here.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  getAthleteById,
  getAthleteMatches,
  getAthleteSummaryById,
  getAthleteTournamentStats,
} from './mock-sports-data'
import type {
  Athlete,
  AthleteMatchStatsRow,
  AthleteStatTotals,
  AthleteTournamentStatsRow,
} from './types'

const MOCK_DELAY = 350

interface QueryState<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

function useMockQuery<T>(resolver: () => T, deps: unknown[]): QueryState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [nonce, setNonce] = useState(0)

  const refetch = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    setIsLoading(true)
    setIsError(false)
    const timer = setTimeout(() => {
      if (!alive) return
      try {
        setData(resolver())
        setIsLoading(false)
      } catch {
        setIsError(true)
        setIsLoading(false)
      }
    }, MOCK_DELAY)
    return () => {
      alive = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, isLoading, isError, refetch }
}

export function useAthlete(id: string | undefined): QueryState<Athlete | undefined> {
  return useMockQuery(() => (id ? getAthleteById(id) : undefined), [id])
}

export function useAthleteSummary(id: string | undefined): QueryState<AthleteStatTotals | undefined> {
  return useMockQuery(() => (id ? getAthleteSummaryById(id) : undefined), [id])
}

export function useAthleteMatches(id: string | undefined): QueryState<AthleteMatchStatsRow[]> {
  return useMockQuery(() => (id ? getAthleteMatches(id) : []), [id])
}

export function useAthleteTournamentStats(id: string | undefined): QueryState<AthleteTournamentStatsRow[]> {
  return useMockQuery(() => (id ? getAthleteTournamentStats(id) : []), [id])
}
