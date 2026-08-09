import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as orgApi from '../../services/orgApi'
import { teamProfileKeys } from '../sports/queries'
import type { AffiliationStatus, OrgRole } from '../../types/admin'
import type { UpdateTeamInput } from '../../types/org'

const LIMIT = 20
const OPTIONS_LIMIT = 100

export type OrgUserListFilters = {
  q: string
  status: AffiliationStatus | ''
  role: OrgRole | ''
  teamId: number | null
}

export type OrgTeamListFilters = {
  q: string
  status: AffiliationStatus | ''
}

export const orgUserKeys = {
  all: ['org-users'] as const,
  list: (filters: OrgUserListFilters) => [...orgUserKeys.all, 'list', filters] as const,
}

export const orgTeamKeys = {
  all: ['org-teams'] as const,
  list: (filters: OrgTeamListFilters) => [...orgTeamKeys.all, 'list', filters] as const,
  options: () => [...orgTeamKeys.all, 'options'] as const,
}

export function useOrgUsersInfiniteQuery(filters: OrgUserListFilters) {
  return useInfiniteQuery({
    queryKey: orgUserKeys.list(filters),
    queryFn: ({ pageParam }) =>
      orgApi.listOrgUsers({
        page: pageParam,
        limit: LIMIT,
        q: filters.q || undefined,
        status: filters.status || undefined,
        role: filters.role || undefined,
        teamId: filters.teamId ?? undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined,
    gcTime: 0,
  })
}

export function useOrgTeamsInfiniteQuery(filters: OrgTeamListFilters) {
  return useInfiniteQuery({
    queryKey: orgTeamKeys.list(filters),
    queryFn: ({ pageParam }) =>
      orgApi.listOrgTeams({
        page: pageParam,
        limit: LIMIT,
        q: filters.q || undefined,
        status: filters.status || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined,
    gcTime: 0,
  })
}

export function useOrgTeamOptionsQuery(enabled: boolean) {
  return useQuery({
    queryKey: orgTeamKeys.options(),
    queryFn: () => orgApi.listOrgTeams({ page: 1, limit: OPTIONS_LIMIT }).then((page) => page.data),
    enabled,
    gcTime: 0,
  })
}

/**
 * Every organization write touches both lists: a user write moves the team row counts and a team
 * write cascades into user affiliations, so both roots are invalidated together.
 */
export function useOrgMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgUserKeys.all })
      void queryClient.invalidateQueries({ queryKey: orgTeamKeys.all })
    },
  })
}

export function useUpdateTeamMutation(teamId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateTeamInput) => orgApi.updateTeam(teamId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamProfileKeys.summary(teamId) })
      void queryClient.invalidateQueries({ queryKey: orgTeamKeys.all })
    },
  })
}
