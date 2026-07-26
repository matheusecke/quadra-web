import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as sportsApi from '../../services/sportsApi'
import type { EntityStatus } from '../../types/admin'
import type { SeasonStatus, TournamentFormat, TournamentStatus } from './types'
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
  list: (status?: SeasonStatus) => [...seasonKeys.all, 'list', status ?? 'all'] as const,
  infinite: (q: string, status: SeasonStatus | '') => [...seasonKeys.all, 'infinite', q, status] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
  list: (status?: EntityStatus) => [...categoryKeys.all, 'list', status ?? 'all'] as const,
  infinite: (q: string, status: EntityStatus | '') => [...categoryKeys.all, 'infinite', q, status] as const,
}

export const tournamentKeys = {
  all: ['tournaments'] as const,
  list: () => [...tournamentKeys.all, 'list'] as const,
  detail: (id: number) => [...tournamentKeys.all, 'detail', id] as const,
  teams: (id: number) => [...tournamentKeys.all, 'teams', id] as const,
  allTeams: () => [...tournamentKeys.all, 'teams', 'all'] as const,
  roster: (tournamentId: number, tournamentTeamId: number) => [...tournamentKeys.all, 'roster', tournamentId, tournamentTeamId] as const,
  championSuggestion: (id: number) => [...tournamentKeys.all, 'champion-suggestion', id] as const,
}

export const matchKeys = {
  all: ['matches'] as const,
  list: (tournamentId?: number) => [...matchKeys.all, 'list', tournamentId ?? 'all'] as const,
  detail: (id: number) => [...matchKeys.all, 'detail', id] as const,
}

export const teamKeys = {
  all: ['teams'] as const,
  list: () => [...teamKeys.all, 'list'] as const,
}

export const athleteKeys = {
  all: ['athletes'] as const,
  list: () => [...athleteKeys.all, 'list'] as const,
  detail: (id: number) => [...athleteKeys.all, 'detail', id] as const,
  summary: (id: number) => [...athleteKeys.all, 'summary', id] as const,
  matches: (id: number) => [...athleteKeys.all, 'matches', id] as const,
  tournaments: (id: number) => [...athleteKeys.all, 'tournaments', id] as const,
}

export const groupKeys = {
  all: ['groups'] as const,
  list: (tournamentId: number) => ['groups', tournamentId] as const,
  teams: (tournamentId: number) => ['groups', tournamentId, 'teams'] as const,
}

export const standingsKeys = {
  all: ['standings'] as const,
  list: (tournamentId: number) => ['standings', tournamentId] as const,
}

export const bracketKeys = {
  all: ['bracket'] as const,
  list: (tournamentId: number) => ['bracket', tournamentId] as const,
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function useSeasonsQuery(params: { status?: SeasonStatus } = {}) {
  return useQuery({ queryKey: seasonKeys.list(params.status), queryFn: () => sportsApi.getSeasons(params) })
}

export function useCategoriesQuery(params: { status?: EntityStatus } = {}) {
  return useQuery({ queryKey: categoryKeys.list(params.status), queryFn: () => sportsApi.getCategories(params) })
}

/** Tela de gestão: uma página por vez, com busca e filtro server-side. */
export function useSeasonsInfiniteQuery({ q, status }: { q: string; status: SeasonStatus | '' }) {
  return useInfiniteQuery({
    queryKey: seasonKeys.infinite(q, status),
    queryFn: ({ pageParam }) => sportsApi.listSeasonsPage({ page: pageParam, limit: 20, q: q || undefined, status: status || undefined }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined),
  })
}

export function useCategoriesInfiniteQuery({ q, status }: { q: string; status: EntityStatus | '' }) {
  return useInfiniteQuery({
    queryKey: categoryKeys.infinite(q, status),
    queryFn: ({ pageParam }) => sportsApi.listCategoriesPage({ page: pageParam, limit: 20, q: q || undefined, status: status || undefined }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined),
  })
}

export function useTournamentsQuery() {
  return useQuery({ queryKey: tournamentKeys.list(), queryFn: () => sportsApi.getTournaments() })
}

export const tournamentInfiniteKey = (
  q: string,
  seasonId: number | null,
  categoryId: number | null,
  status: TournamentStatus | '',
) => [...tournamentKeys.all, 'infinite', q, seasonId ?? 'all', categoryId ?? 'all', status] as const

/** Tela de gestão: uma página por vez, com busca e filtros server-side. */
export function useTournamentsInfiniteQuery({
  q, seasonId, categoryId, status,
}: { q: string; seasonId: number | null; categoryId: number | null; status: TournamentStatus | '' }) {
  return useInfiniteQuery({
    queryKey: tournamentInfiniteKey(q, seasonId, categoryId, status),
    queryFn: ({ pageParam }) =>
      sportsApi.listTournamentsPage({
        page: pageParam,
        limit: 20,
        q: q || undefined,
        seasonId: seasonId ?? undefined,
        categoryId: categoryId ?? undefined,
        status: status || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined),
  })
}

export function useTournamentQuery(id: number | undefined) {
  return useQuery({
    queryKey: tournamentKeys.detail(id ?? -1),
    queryFn: () => sportsApi.getTournament(id!),
    enabled: id != null,
  })
}

export function useTournamentLeadersQuery(tournamentId: number | undefined) {
  return useQuery({
    queryKey: [...tournamentKeys.all, 'leaders', tournamentId ?? -1] as const,
    queryFn: () => sportsApi.getTournamentLeaders(tournamentId!),
    enabled: tournamentId != null,
  })
}

export function useTournamentTeamsQuery(tournamentId: number | undefined) {
  return useQuery({
    queryKey: tournamentKeys.teams(tournamentId ?? -1),
    queryFn: () => sportsApi.getTournamentTeams(tournamentId!),
    enabled: tournamentId != null,
  })
}

/** Cross-tournament team names, e.g. for the all-tournaments matches list. */
export function useAllTournamentTeamsQuery() {
  return useQuery({
    queryKey: tournamentKeys.allTeams(),
    queryFn: () => sportsApi.getAllTournamentTeams(),
  })
}

export function useRosterQuery(tournamentId: number | undefined, tournamentTeamId: number | undefined) {
  return useQuery({
    queryKey: tournamentKeys.roster(tournamentId ?? -1, tournamentTeamId ?? -1),
    queryFn: () => sportsApi.getRoster(tournamentId!, tournamentTeamId!),
    enabled: tournamentId != null && tournamentTeamId != null,
  })
}

export function useMatchesQuery(filter?: { tournamentId?: number }) {
  return useQuery({
    queryKey: matchKeys.list(filter?.tournamentId),
    queryFn: () => sportsApi.getMatches(filter),
  })
}

export function useMatchDetailQuery(id: number | undefined) {
  return useQuery({
    queryKey: matchKeys.detail(id ?? -1),
    queryFn: () => sportsApi.getMatchDetail(id!),
    enabled: id != null,
  })
}

export function useTeamsQuery() {
  return useQuery({ queryKey: teamKeys.list(), queryFn: () => sportsApi.getTeams() })
}

export function useAthletesQuery() {
  return useQuery({ queryKey: athleteKeys.list(), queryFn: () => sportsApi.getAthletes() })
}

export function useAthleteQuery(id: number | undefined) {
  return useQuery({ queryKey: athleteKeys.detail(id ?? -1), queryFn: () => sportsApi.getAthlete(id!), enabled: id != null })
}

export function useAthleteSummaryQuery(id: number | undefined) {
  return useQuery({ queryKey: athleteKeys.summary(id ?? -1), queryFn: () => sportsApi.getAthleteSummary(id!), enabled: id != null })
}

export function useAthleteMatchesQuery(id: number | undefined) {
  return useQuery({ queryKey: athleteKeys.matches(id ?? -1), queryFn: () => sportsApi.getAthleteMatches(id!), enabled: id != null })
}

export function useAthleteTournamentStatsQuery(id: number | undefined) {
  return useQuery({ queryKey: athleteKeys.tournaments(id ?? -1), queryFn: () => sportsApi.getAthleteTournamentStats(id!), enabled: id != null })
}

export function useGroupsQuery(tournamentId: number | undefined) {
  return useQuery({
    queryKey: groupKeys.list(tournamentId ?? -1),
    queryFn: () => sportsApi.getGroups(tournamentId!),
    enabled: tournamentId != null,
  })
}

export function useGroupTeamsQuery(tournamentId: number | undefined) {
  return useQuery({
    queryKey: groupKeys.teams(tournamentId ?? -1),
    queryFn: () => sportsApi.getGroupTeams(tournamentId!),
    enabled: tournamentId != null,
  })
}

/** One request, N tables. The rows arrive ranked — nothing here sorts. */
export function useStandingsQuery(tournamentId: number | undefined, format: TournamentFormat | undefined) {
  return useQuery({
    queryKey: standingsKeys.list(tournamentId ?? -1),
    queryFn: () => sportsApi.listStandings(tournamentId!, format!),
    enabled: tournamentId != null && format != null,
  })
}

export function useBracketSlotsQuery(tournamentId: number | undefined) {
  return useQuery({
    queryKey: bracketKeys.list(tournamentId ?? -1),
    queryFn: () => sportsApi.getBracketSlots(tournamentId!),
    enabled: tournamentId != null,
  })
}

export function useBracketRoundsQuery(tournamentId: number | undefined) {
  return useQuery({
    queryKey: [...bracketKeys.list(tournamentId ?? -1), 'rounds'] as const,
    queryFn: () => sportsApi.getBracketRounds(tournamentId!),
    enabled: tournamentId != null,
  })
}

export function useChampionSuggestionQuery(tournamentId: number | undefined) {
  return useQuery({ queryKey: tournamentKeys.championSuggestion(tournamentId ?? -1), queryFn: () => sportsApi.getChampionSuggestion(tournamentId!), enabled: tournamentId != null })
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
    mutationFn: ({ id, input }: { id: number; input: UpdateTournamentInput }) => sportsApi.updateTournament(id, input),
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
    mutationFn: (id: number) => sportsApi.removeTournamentTeam(id),
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
    mutationFn: ({ id, input }: { id: number; input: UpdateBracketRoundInput }) => sportsApi.updateBracketRound(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bracketKeys.all }),
  })
}

export function useRemoveBracketRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sportsApi.removeBracketRound(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bracketKeys.all }),
  })
}

export function useUpdateBracketSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateBracketSlotInput }) => sportsApi.updateBracketSlot(id, input),
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
    mutationFn: (id: number) => sportsApi.removeBracketSlot(id),
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
      queryClient.invalidateQueries({ queryKey: tournamentKeys.roster(input.tournamentId, input.tournamentTeamId) }),
  })
}

export function useUpdateRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; tournamentId: number; tournamentTeamId: number; input: UpdateRosterEntryInput }) =>
      sportsApi.updateRosterEntry(id, input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: tournamentKeys.roster(variables.tournamentId, variables.tournamentTeamId) }),
  })
}

export function useRemoveRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: number; tournamentId: number; tournamentTeamId: number }) => sportsApi.removeRosterEntry(id),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: tournamentKeys.roster(variables.tournamentId, variables.tournamentTeamId) }),
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
    mutationFn: (id: number) => sportsApi.removeGroupTeam(id),
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
