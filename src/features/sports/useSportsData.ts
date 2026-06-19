/**
 * Sports domain — thin React hooks that simulate the async shape of a future API.
 *
 * ⚠️ MOCK: today these resolve local data from `mockSportsData.ts` behind a tiny
 * artificial delay so the screens exercise their loading / error / empty states.
 * Replace the bodies with real `fetch` / react-query calls when the API exists —
 * the returned shape (`{ data, isLoading, isError, refetch }`) is intentionally
 * close to what a query hook would expose.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  getAthleteById,
  getAthleteChampionshipStats,
  getAthleteMatches,
  getAthleteSummaryById,
  getChampionshipById,
  getChampionships,
  getAllMatches,
  getMatchDetailById,
  getMatchesByChampionship,
} from './mockSportsData'
import type {
  Athlete,
  AthleteChampionshipStatsRow,
  AthleteMatchStatsRow,
  AthleteStatTotals,
  Championship,
  Match,
  MatchDetail,
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

export function useChampionships(): QueryState<Championship[]> {
  return useMockQuery(() => getChampionships(), [])
}

export function useChampionship(id: string | undefined): QueryState<Championship | undefined> {
  return useMockQuery(() => (id ? getChampionshipById(id) : undefined), [id])
}

export function useChampionshipMatches(id: string | undefined): QueryState<Match[]> {
  return useMockQuery(() => (id ? getMatchesByChampionship(id) : []), [id])
}

export function useMatches(): QueryState<Match[]> {
  return useMockQuery(() => getAllMatches(), [])
}

export function useMatch(id: string | undefined): QueryState<MatchDetail | undefined> {
  return useMockQuery(() => (id ? getMatchDetailById(id) : undefined), [id])
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

export function useAthleteChampionshipStats(id: string | undefined): QueryState<AthleteChampionshipStatsRow[]> {
  return useMockQuery(() => (id ? getAthleteChampionshipStats(id) : []), [id])
}
