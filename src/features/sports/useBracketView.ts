import { getTeams } from './mock-sports-data'
import { useBracketRoundsQuery, useBracketSlotsQuery, useMatchesQuery, useTournamentTeamsQuery } from './queries'

import type { BracketRound, MatchStatus } from './types'

export interface BracketTeamOption {
  tournamentTeamId: number
  name: string
  shortName: string
}

export interface BracketSlotView {
  id: number
  roundId: number
  position: number
  label: string | null
  homeTournamentTeamId: number | null
  awayTournamentTeamId: number | null
  matchId: number | null
  winnerTournamentTeamId: number | null
  match: { id: number; status: MatchStatus; date: string; homeScore: number | null; awayScore: number | null } | null
}

export interface BracketView {
  rounds: BracketRound[]
  slots: BracketSlotView[]
  teams: BracketTeamOption[]
  isPending: boolean
  isError: boolean
  refetch: () => void
}

export function useBracketView(tournamentId: number): BracketView {
  const roundsQuery = useBracketRoundsQuery(tournamentId)
  const slotsQuery = useBracketSlotsQuery(tournamentId)
  const { data: matches = [] } = useMatchesQuery({ tournamentId })
  const { data: tournamentTeams = [] } = useTournamentTeamsQuery(tournamentId)

  const teamsById = new Map(getTeams().map((team) => [team.id, team]))
  const matchesById = new Map(matches.map((match) => [match.id, match]))

  return {
    rounds: roundsQuery.data ?? [],
    slots: (slotsQuery.data ?? []).map((slot) => ({ ...slot, match: slot.matchId ? matchesById.get(slot.matchId) ?? null : null })),
    teams: tournamentTeams.map((entry) => {
      const team = teamsById.get(entry.teamId)
      return { tournamentTeamId: entry.id, name: team?.name ?? entry.displayNameSnapshot, shortName: team?.shortName ?? String(entry.teamId) }
    }),
    isPending: roundsQuery.isPending || slotsQuery.isPending,
    isError: roundsQuery.isError || slotsQuery.isError,
    refetch: () => { void roundsQuery.refetch(); void slotsQuery.refetch() },
  }
}
