import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import * as sportsApi from '../../services/sportsApi'
import { apiErrorCode } from '../../services/apiError'
import { collectPages } from '../../services/sportsApi/pagination'
import type {
  CreateMatchInput,
  ListAthleteMatchesParams,
  ListAthleteTournamentsParams,
  ListMatchesParams,
  ListTournamentMatchesParams,
  SaveMatchDraftInput,
  SubmitMatchResultInput,
  UpdateMatchInput,
} from '../../services/sportsApi'
import type { EntityStatus, PaginatedResponse } from '../../types/admin'
import type {
  AthleteMatchHistoryRow,
  AthleteTournamentHistoryRow,
  MatchDetail,
  MatchSummary,
  SeasonStatus,
  TournamentStatus,
} from './types'
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
  CreateTournamentRosterInput,
  EnrollTeamInput,
  ReopenTournamentInput,
  SetTiebreakOrderInput,
  UpdateGroupInput,
  UpdateTournamentInput,
  UpdateBracketRoundInput,
  UpdateBracketSlotInput,
  UpdateTournamentRosterInput,
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
  roster: (tournamentTeamId: number) => [...tournamentKeys.all, 'roster', tournamentTeamId] as const,
  championSuggestion: (id: number) => [...tournamentKeys.all, 'champion-suggestion', id] as const,
}

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (params: Omit<ListMatchesParams, 'page' | 'limit'>) => [...matchKeys.lists(), params] as const,
  tournamentLists: (tournamentId: number) => [...matchKeys.all, 'tournament', tournamentId, 'list'] as const,
  tournamentList: (tournamentId: number, params: ListTournamentMatchesParams) =>
    [...matchKeys.tournamentLists(tournamentId), params] as const,
  detail: (id: number) => [...matchKeys.all, 'detail', id] as const,
}

export const teamKeys = {
  all: ['teams'] as const,
  list: () => [...teamKeys.all, 'list'] as const,
}

export type AthleteMatchFilters = Omit<ListAthleteMatchesParams, 'page' | 'limit'>
export type AthleteTournamentFilters = Omit<ListAthleteTournamentsParams, 'page' | 'limit'>

export const athleteKeys = {
  all: ['athletes'] as const,
  list: () => [...athleteKeys.all, 'list'] as const,
  detail: (id: number) => [...athleteKeys.all, 'detail', id] as const,
  statistics: (id: number) => [...athleteKeys.all, 'statistics', id] as const,
  matches: (id: number, filters: AthleteMatchFilters) =>
    [...athleteKeys.all, 'matches', id, 20, filters] as const,
  tournaments: (id: number, filters: AthleteTournamentFilters) =>
    [...athleteKeys.all, 'tournaments', id, 20, filters] as const,
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

export function useSeasonsQuery(params: { status?: SeasonStatus } = {}, enabled = true) {
  return useQuery({
    queryKey: seasonKeys.list(params.status),
    queryFn: () => sportsApi.getSeasons(params),
    enabled,
  })
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

export function useRosterQuery(tournamentTeamId: number | undefined) {
  return useQuery({
    queryKey: tournamentKeys.roster(tournamentTeamId ?? -1),
    queryFn: () => sportsApi.getTournamentRoster(tournamentTeamId!),
    enabled: tournamentTeamId != null,
  })
}

const isConcurrent = (error: Error) => apiErrorCode(error) === 'CONCURRENT_MODIFICATION'

const retryConcurrentOnce = (failureCount: number, error: Error) => isConcurrent(error) && failureCount < 1

/**
 * Only a losing concurrency race means our cache is behind the server. Every other
 * refusal leaves the server unchanged, so refetching would be pure noise.
 */
const onConcurrentFailure = (error: Error, invalidate: () => void) => {
  if (isConcurrent(error)) invalidate()
}

export function useMatchesInfiniteQuery(
  filters: Omit<ListMatchesParams, 'page' | 'limit'>,
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse<MatchSummary>>> {
  return useInfiniteQuery({
    queryKey: matchKeys.list(filters),
    queryFn: ({ pageParam }) => sportsApi.listMatchesPage({ ...filters, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<MatchSummary>) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages ? lastPage.meta.currentPage + 1 : undefined,
  })
}

export function useTournamentMatchesQuery(tournamentId: number | undefined) {
  return useQuery({
    queryKey: tournamentId === undefined ? matchKeys.tournamentLists(0) : matchKeys.tournamentList(tournamentId, {}),
    queryFn: () => collectPages((page) => sportsApi.listTournamentMatchesPage(tournamentId!, { page, limit: 100 })),
    enabled: tournamentId !== undefined,
  })
}

export function useMatchDetailQuery(id: number | undefined) {
  return useQuery({
    queryKey: matchKeys.detail(id ?? 0),
    queryFn: () => sportsApi.getMatch(id!),
    enabled: id !== undefined,
  })
}

export function useTeamsQuery() {
  return useQuery({ queryKey: teamKeys.list(), queryFn: () => sportsApi.getTeams() })
}

export function useAthletesQuery() {
  return useQuery({ queryKey: athleteKeys.list(), queryFn: () => sportsApi.getAthletes() })
}

export function useAthleteQuery(id: number | undefined) {
  return useQuery({
    queryKey: athleteKeys.detail(id ?? -1),
    queryFn: () => sportsApi.getAthlete(id!),
    enabled: id != null,
  })
}

export function useAthleteStatisticsQuery(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: athleteKeys.statistics(id ?? -1),
    queryFn: () => sportsApi.getAthleteStatistics(id!),
    enabled: id != null && enabled,
  })
}

export function useAthleteMatchesInfiniteQuery(
  id: number | undefined,
  filters: AthleteMatchFilters = {},
  enabled = true,
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse<AthleteMatchHistoryRow>>> {
  return useInfiniteQuery({
    queryKey: athleteKeys.matches(id ?? -1, filters),
    queryFn: ({ pageParam }) =>
      sportsApi.listAthleteMatchesPage(id!, { ...filters, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: id != null && enabled,
  })
}

export function useAthleteTournamentsInfiniteQuery(
  id: number | undefined,
  filters: AthleteTournamentFilters = {},
  enabled = true,
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse<AthleteTournamentHistoryRow>>> {
  return useInfiniteQuery({
    queryKey: athleteKeys.tournaments(id ?? -1, filters),
    queryFn: ({ pageParam }) =>
      sportsApi.listAthleteTournamentsPage(id!, { ...filters, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
    enabled: id != null && enabled,
  })
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
export function useStandingsQuery(tournamentId: number | undefined) {
  return useQuery({
    queryKey: standingsKeys.list(tournamentId ?? -1),
    queryFn: () => sportsApi.listStandings(tournamentId!),
    enabled: tournamentId != null,
  })
}

/** One route, one query: the API answers rounds and slots together, already ordered. */
export function useBracketQuery(tournamentId: number | undefined) {
  return useQuery({
    queryKey: bracketKeys.list(tournamentId ?? -1),
    queryFn: () => sportsApi.getBracket(tournamentId!),
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

export function useRemoveBracketSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sportsApi.removeBracketSlot(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bracketKeys.all }),
  })
}

function invalidateBracketMatchLink(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: { tournamentId: number; matchId: number },
) {
  queryClient.invalidateQueries({ queryKey: bracketKeys.list(variables.tournamentId) })
  queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
  queryClient.invalidateQueries({ queryKey: matchKeys.detail(variables.matchId) })
  queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(variables.tournamentId) })
}

export function useLinkBracketSlotMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slotId, matchId }: { tournamentId: number; slotId: number; matchId: number }) =>
      sportsApi.linkBracketSlotMatch(slotId, { matchId }),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (_data, variables) => invalidateBracketMatchLink(queryClient, variables),
    onError: (error, variables) => onConcurrentFailure(error, () => invalidateBracketMatchLink(queryClient, variables)),
  })
}

export function useUnlinkBracketSlotMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slotId }: { tournamentId: number; slotId: number; matchId: number }) =>
      sportsApi.unlinkBracketSlotMatch(slotId),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (_data, variables) => invalidateBracketMatchLink(queryClient, variables),
    onError: (error, variables) => onConcurrentFailure(error, () => invalidateBracketMatchLink(queryClient, variables)),
  })
}

function invalidateBracketWinner(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: { tournamentId: number; matchId: number | null },
) {
  queryClient.invalidateQueries({ queryKey: bracketKeys.list(variables.tournamentId) })
  queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(variables.tournamentId) })
  if (variables.matchId !== null) queryClient.invalidateQueries({ queryKey: matchKeys.detail(variables.matchId) })
}

export function useSetBracketSlotWinner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slotId, winnerTournamentTeamId }: {
      tournamentId: number
      slotId: number
      matchId: number | null
      winnerTournamentTeamId: number | null
    }) => sportsApi.setBracketSlotWinner(slotId, { winnerTournamentTeamId }),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (_data, variables) => invalidateBracketWinner(queryClient, variables),
    onError: (error, variables) => onConcurrentFailure(error, () => invalidateBracketWinner(queryClient, variables)),
  })
}

export function useAddRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTournamentRosterInput) => sportsApi.addTournamentRoster(input),
    onSuccess: (_data, input) =>
      queryClient.invalidateQueries({ queryKey: tournamentKeys.roster(input.tournamentTeamId) }),
  })
}

export function useUpdateRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; tournamentTeamId: number; input: UpdateTournamentRosterInput }) =>
      sportsApi.updateTournamentRoster(id, input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: tournamentKeys.roster(variables.tournamentTeamId) }),
  })
}

export function useRemoveRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: number; tournamentTeamId: number }) => sportsApi.removeTournamentRoster(id),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: tournamentKeys.roster(variables.tournamentTeamId) }),
  })
}

function invalidateMatchReads(queryClient: ReturnType<typeof useQueryClient>, data: MatchDetail) {
  queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
  queryClient.invalidateQueries({ queryKey: matchKeys.tournamentLists(data.tournamentId) })
  queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(data.tournamentId) })
  queryClient.invalidateQueries({ queryKey: standingsKeys.list(data.tournamentId) })
  queryClient.invalidateQueries({ queryKey: bracketKeys.list(data.tournamentId) })
}

function updateMatchReads(
  queryClient: ReturnType<typeof useQueryClient>,
  data: MatchDetail,
) {
  queryClient.setQueryData(matchKeys.detail(data.id), data)
  invalidateMatchReads(queryClient, data)
}

function invalidateFailedMatchWrite(
  queryClient: ReturnType<typeof useQueryClient>,
  id: number,
) {
  queryClient.invalidateQueries({ queryKey: matchKeys.detail(id) })
  queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
}

export function useCreateMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMatchInput) => sportsApi.createMatch(input),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
      queryClient.invalidateQueries({ queryKey: matchKeys.tournamentLists(data.tournamentId) })
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(data.tournamentId) })
      queryClient.invalidateQueries({ queryKey: standingsKeys.list(data.tournamentId) })
    },
    onError: (error) => onConcurrentFailure(error, () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
    }),
  })
}

export function useUpdateMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateMatchInput }) => sportsApi.updateMatch(id, input),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (data) => updateMatchReads(queryClient, data),
    onError: (error, variables) =>
      onConcurrentFailure(error, () => invalidateFailedMatchWrite(queryClient, variables.id)),
  })
}

export function usePostponeMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sportsApi.postponeMatch(id),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (data) => updateMatchReads(queryClient, data),
    onError: (error, id) => onConcurrentFailure(error, () => invalidateFailedMatchWrite(queryClient, id)),
  })
}

export function useCancelMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sportsApi.cancelMatch(id),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (data) => updateMatchReads(queryClient, data),
    onError: (error, id) => onConcurrentFailure(error, () => invalidateFailedMatchWrite(queryClient, id)),
  })
}

export function useSaveMatchDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: SaveMatchDraftInput }) =>
      sportsApi.saveMatchDraft(id, input),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (data) => updateMatchReads(queryClient, data),
    onError: (error, variables) =>
      onConcurrentFailure(error, () =>
        invalidateFailedMatchWrite(queryClient, variables.id),
      ),
  })
}

export function useSubmitMatchResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: SubmitMatchResultInput }) =>
      sportsApi.submitMatchResult(id, input),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (data) => updateMatchReads(queryClient, data),
    onError: (error, variables) =>
      onConcurrentFailure(error, () =>
        invalidateFailedMatchWrite(queryClient, variables.id),
      ),
  })
}

export function useReopenMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sportsApi.reopenMatch(id),
    retry: retryConcurrentOnce,
    retryDelay: 0,
    onSuccess: (data) => updateMatchReads(queryClient, data),
    onError: (error, id) =>
      onConcurrentFailure(error, () =>
        invalidateFailedMatchWrite(queryClient, id),
      ),
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

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateGroupInput }) => sportsApi.updateGroup(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
      queryClient.invalidateQueries({ queryKey: standingsKeys.all })
    },
  })
}

export function useRemoveGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sportsApi.removeGroup(id),
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
    // The API answers with the recomputed tables, so there is nothing left to read.
    onSuccess: (envelopes, variables) => {
      queryClient.setQueryData(standingsKeys.list(variables.tournamentId), envelopes)
    },
  })
}

export function useClearTiebreakOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ClearTiebreakOrderInput) => sportsApi.clearTiebreakOrder(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: standingsKeys.list(variables.tournamentId) })
    },
  })
}
