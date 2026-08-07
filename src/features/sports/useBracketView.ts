import { useBracketQuery, useTeamsQuery, useTournamentTeamsQuery } from './queries'

import type { BracketRound, BracketSlotView } from './types'

export interface BracketTeamOption {
  tournamentTeamId: number
  name: string
  shortName: string
}

export interface BracketView {
  rounds: BracketRound[]
  slots: BracketSlotView[]
  teams: BracketTeamOption[]
  isPending: boolean
  isError: boolean
  refetch: () => Promise<void>
}

/**
 * Display data comes off the bracket itself — the API embeds the registration's name
 * snapshot and the catalogue's live short name. The team list is a separate concern:
 * the picker needs every active registration, including the ones not placed yet.
 */
export function useBracketView(tournamentId: number): BracketView {
  const bracketQuery = useBracketQuery(tournamentId)
  const teamsQuery = useTeamsQuery()
  const { data: tournamentTeams = [] } = useTournamentTeamsQuery(tournamentId)

  const teamsById = new Map((teamsQuery.data ?? []).map((team) => [team.id, team]))

  return {
    rounds: bracketQuery.data?.rounds ?? [],
    slots: bracketQuery.data?.slots ?? [],
    teams: tournamentTeams.map((entry) => ({
      tournamentTeamId: entry.id,
      name: entry.displayNameSnapshot,
      shortName: teamsById.get(entry.teamId)?.shortName ?? String(entry.teamId),
    })),
    isPending: bracketQuery.isPending,
    isError: bracketQuery.isError,
    refetch: async () => { await bracketQuery.refetch() },
  }
}
