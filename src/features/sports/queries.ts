import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sportsApi from '../../services/sportsApi'
import type {
  AssignGroupTeamInput,
  ClearTiebreakOrderInput,
  CompleteTournamentInput,
  CreateBracketRoundInput,
  CreateBracketSlotInput,
  CreateCategoryInput,
  CreateGroupInput,
  CreateSeasonInput,
  CreateTournamentInput,
  EnrollTeamInput,
  LinkSlotMatchInput,
  RosterEntryInput,
  ReopenTournamentInput,
  ScheduleMatchInput,
  SetTiebreakOrderInput,
  SetSlotWinnerInput,
  SubmitMatchResultInput,
  UpdateTournamentInput,
  UpdateBracketRoundInput,
  UpdateBracketSlotInput,
  UpdateRosterEntryInput,
} from '../../services/sportsApi/types'

export const seasonKeys = {
  all: ['seasons'] as const,
  list: () => [...seasonKeys.all, 'list'] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
}

export const tournamentKeys = {
  all: ['tournaments'] as const,
  list: () => [...tournamentKeys.all, 'list'] as const,
  detail: (id: string) => [...tournamentKeys.all, 'detail', id] as const,
  teams: (id: string) => [...tournamentKeys.all, 'teams', id] as const,
  roster: (tournamentId: string, teamId: string) => [...tournamentKeys.all, 'roster', tournamentId, teamId] as const,
  championSuggestion: (id: string) => [...tournamentKeys.all, 'champion-suggestion', id] as const,
}

export const matchKeys = {
  all: ['matches'] as const,
  list: (tournamentId?: string) => [...matchKeys.all, 'list', tournamentId ?? 'all'] as const,
  detail: (id: string) => [...matchKeys.all, 'detail', id] as const,
}

export const athleteKeys = {
  all: ['athletes'] as const,
  detail: (id: string) => [...athleteKeys.all, 'detail', id] as const,
  summary: (id: string) => [...athleteKeys.all, 'summary', id] as const,
  matches: (id: string) => [...athleteKeys.all, 'matches', id] as const,
  tournaments: (id: string) => [...athleteKeys.all, 'tournaments', id] as const,
}

export const groupKeys = {
  all: ['groups'] as const,
  list: (tournamentId: string) => ['groups', tournamentId] as const,
  teams: (tournamentId: string) => ['groups', tournamentId, 'teams'] as const,
}

export const standingsKeys = {
  all: ['standings'] as const,
  list: (tournamentId: string) => ['standings', tournamentId] as const,
}

export const bracketKeys = {
  all: ['bracket'] as const,
  list: (tournamentId: string) => ['bracket', tournamentId] as const,
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function useSeasonsQuery() {
  return useQuery({ queryKey: seasonKeys.list(), queryFn: () => sportsApi.getSeasons() })
}

export function useCategoriesQuery() {
  return useQuery({ queryKey: categoryKeys.list(), queryFn: () => sportsApi.getCategories() })
}

export function useTournamentsQuery() {
  return useQuery({ queryKey: tournamentKeys.list(), queryFn: () => sportsApi.getTournaments() })
}

export function useTournamentQuery(id: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.detail(id ?? ''),
    queryFn: () => sportsApi.getTournament(id as string),
    enabled: Boolean(id),
  })
}

export function useTournamentTeamsQuery(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.teams(tournamentId ?? ''),
    queryFn: () => sportsApi.getTournamentTeams(tournamentId as string),
    enabled: Boolean(tournamentId),
  })
}

export function useRosterQuery(tournamentId: string | undefined, teamId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.roster(tournamentId ?? '', teamId ?? ''),
    queryFn: () => sportsApi.getRoster(tournamentId as string, teamId as string),
    enabled: Boolean(tournamentId && teamId),
  })
}

export function useMatchesQuery(filter?: { tournamentId?: string }) {
  return useQuery({
    queryKey: matchKeys.list(filter?.tournamentId),
    queryFn: () => sportsApi.getMatches(filter),
  })
}

export function useMatchDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: matchKeys.detail(id ?? ''),
    queryFn: () => sportsApi.getMatchDetail(id as string),
    enabled: Boolean(id),
  })
}

export function useAthleteQuery(id: string | undefined) {
  return useQuery({ queryKey: athleteKeys.detail(id ?? ''), queryFn: () => sportsApi.getAthlete(id as string), enabled: Boolean(id) })
}

export function useAthleteSummaryQuery(id: string | undefined) {
  return useQuery({ queryKey: athleteKeys.summary(id ?? ''), queryFn: () => sportsApi.getAthleteSummary(id as string), enabled: Boolean(id) })
}

export function useAthleteMatchesQuery(id: string | undefined) {
  return useQuery({ queryKey: athleteKeys.matches(id ?? ''), queryFn: () => sportsApi.getAthleteMatches(id as string), enabled: Boolean(id) })
}

export function useAthleteTournamentStatsQuery(id: string | undefined) {
  return useQuery({ queryKey: athleteKeys.tournaments(id ?? ''), queryFn: () => sportsApi.getAthleteTournamentStats(id as string), enabled: Boolean(id) })
}

export function useGroupsQuery(tournamentId: string | undefined) {
  return useQuery({
    queryKey: groupKeys.list(tournamentId ?? ''),
    queryFn: () => sportsApi.getGroups(tournamentId as string),
    enabled: Boolean(tournamentId),
  })
}

export function useGroupTeamsQuery(tournamentId: string | undefined) {
  return useQuery({
    queryKey: groupKeys.teams(tournamentId ?? ''),
    queryFn: () => sportsApi.getGroupTeams(tournamentId as string),
    enabled: Boolean(tournamentId),
  })
}

/** One request, N tables. The rows arrive ranked — nothing here sorts. */
export function useStandingsQuery(tournamentId: string | undefined) {
  return useQuery({
    queryKey: standingsKeys.list(tournamentId ?? ''),
    queryFn: () => sportsApi.listStandings(tournamentId as string),
    enabled: Boolean(tournamentId),
  })
}

export function useBracketSlotsQuery(tournamentId: string | undefined) {
  return useQuery({
    queryKey: bracketKeys.list(tournamentId ?? ''),
    queryFn: () => sportsApi.getBracketSlots(tournamentId!),
    enabled: Boolean(tournamentId),
  })
}

export function useBracketRoundsQuery(tournamentId: string | undefined) {
  return useQuery({
    queryKey: [...bracketKeys.list(tournamentId ?? ''), 'rounds'] as const,
    queryFn: () => sportsApi.getBracketRounds(tournamentId!),
    enabled: Boolean(tournamentId),
  })
}

export function useChampionSuggestionQuery(tournamentId: string | undefined) {
  return useQuery({ queryKey: tournamentKeys.championSuggestion(tournamentId ?? ''), queryFn: () => sportsApi.getChampionSuggestion(tournamentId!), enabled: Boolean(tournamentId) })
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useCreateSeason() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSeasonInput) => sportsApi.createSeason(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: seasonKeys.all }),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => sportsApi.createCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

export function useCreateTournament() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTournamentInput) => sportsApi.createTournament(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tournamentKeys.all }),
  })
}

export function useUpdateTournament() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTournamentInput }) => sportsApi.updateTournament(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tournamentKeys.all }),
  })
}

export function useCompleteTournament() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: CompleteTournamentInput) => sportsApi.completeTournament(input), onSuccess: () => { queryClient.invalidateQueries({ queryKey: tournamentKeys.all }); queryClient.invalidateQueries({ queryKey: bracketKeys.all }) } })
}

export function useReopenTournament() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: ReopenTournamentInput) => sportsApi.reopenTournament(input), onSuccess: () => { queryClient.invalidateQueries({ queryKey: tournamentKeys.all }); queryClient.invalidateQueries({ queryKey: bracketKeys.all }) } })
}

export function useEnrollTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EnrollTeamInput) => sportsApi.enrollTeam(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tournamentKeys.all }),
  })
}

export function useRemoveTournamentTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sportsApi.removeTournamentTeam(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tournamentKeys.all }),
  })
}

export function useCreateBracketSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBracketSlotInput) => sportsApi.createBracketSlot(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bracketKeys.all }),
  })
}

export function useCreateBracketRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBracketRoundInput) => sportsApi.createBracketRound(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bracketKeys.all }),
  })
}

export function useUpdateBracketRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBracketRoundInput }) => sportsApi.updateBracketRound(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bracketKeys.all }),
  })
}

export function useRemoveBracketRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sportsApi.removeBracketRound(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bracketKeys.all }),
  })
}

export function useUpdateBracketSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBracketSlotInput }) => sportsApi.updateBracketSlot(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bracketKeys.all }),
  })
}

export function useLinkSlotMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LinkSlotMatchInput) => sportsApi.linkSlotMatch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bracketKeys.all })
      queryClient.invalidateQueries({ queryKey: matchKeys.all })
    },
  })
}

export function useSetSlotWinner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SetSlotWinnerInput) => sportsApi.setSlotWinner(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bracketKeys.all }),
  })
}

export function useRemoveBracketSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sportsApi.removeBracketSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bracketKeys.all })
      queryClient.invalidateQueries({ queryKey: matchKeys.all })
    },
  })
}

export function useAddRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RosterEntryInput) => sportsApi.addRosterEntry(input),
    onSuccess: (_data, input) =>
      queryClient.invalidateQueries({ queryKey: tournamentKeys.roster(input.tournamentId, input.teamId) }),
  })
}

export function useUpdateRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; tournamentId: string; teamId: string; input: UpdateRosterEntryInput }) =>
      sportsApi.updateRosterEntry(id, input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: tournamentKeys.roster(variables.tournamentId, variables.teamId) }),
  })
}

export function useRemoveRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tournamentId: string; teamId: string }) => sportsApi.removeRosterEntry(id),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: tournamentKeys.roster(variables.tournamentId, variables.teamId) }),
  })
}

export function useScheduleMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ScheduleMatchInput) => sportsApi.scheduleMatch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.all })
      queryClient.invalidateQueries({ queryKey: standingsKeys.all })
    },
  })
}

export function useSubmitMatchResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitMatchResultInput) => sportsApi.submitMatchResult(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.all })
      queryClient.invalidateQueries({ queryKey: standingsKeys.all })
    },
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGroupInput) => sportsApi.createGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
      queryClient.invalidateQueries({ queryKey: standingsKeys.all })
    },
  })
}

export function useAssignTeamToGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignGroupTeamInput) => sportsApi.assignTeamToGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
      queryClient.invalidateQueries({ queryKey: standingsKeys.all })
    },
  })
}

export function useRemoveGroupTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sportsApi.removeGroupTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
      queryClient.invalidateQueries({ queryKey: standingsKeys.all })
    },
  })
}

export function useSetTiebreakOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SetTiebreakOrderInput) => sportsApi.setTiebreakOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
      queryClient.invalidateQueries({ queryKey: standingsKeys.all })
    },
  })
}

export function useClearTiebreakOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ClearTiebreakOrderInput) => sportsApi.clearTiebreakOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
      queryClient.invalidateQueries({ queryKey: standingsKeys.all })
    },
  })
}
