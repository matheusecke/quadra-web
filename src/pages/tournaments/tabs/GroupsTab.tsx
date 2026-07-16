import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { GroupsPanel } from '../../../features/sports/components/GroupsPanel'
import { StandingsCard } from '../../../features/sports/components/StandingsCard'
import { getTeams } from '../../../features/sports/mock-sports-data'
import {
  standingsKeys,
  useAssignTeamToGroup,
  useClearTiebreakOrder,
  useCreateGroup,
  useGroupsQuery,
  useGroupTeamsQuery,
  useRemoveGroupTeam,
  useSetTiebreakOrder,
  useStandingsQuery,
  useTournamentTeamsQuery,
} from '../../../features/sports/queries'
import { teamMap } from '../../../features/sports/sportsUtils'
import type { StandingRow, Team, Tournament } from '../../../features/sports/types'
import { useIsOrgAdmin } from '../../../features/sports/useIsOrgAdmin'
import s from './GroupsTab.module.css'

interface GroupsTabProps {
  tournament: Tournament
  teams: Map<string, Team>
}

const TEAM_ALREADY_ASSIGNED = 'Team already assigned to a group in this tournament'
const TIED_BLOCK_MISMATCH = 'Tied block no longer matches'

export function GroupsTab({ tournament, teams }: GroupsTabProps) {
  const isOrgAdmin = useIsOrgAdmin()
  const queryClient = useQueryClient()

  const groupsQuery = useGroupsQuery(tournament.id)
  const groupTeamsQuery = useGroupTeamsQuery(tournament.id)
  const standingsQuery = useStandingsQuery(tournament.id)
  const tournamentTeamsQuery = useTournamentTeamsQuery(tournament.id)

  const createGroup = useCreateGroup()
  const assignTeamToGroup = useAssignTeamToGroup()
  const removeGroupTeam = useRemoveGroupTeam()
  const setTiebreakOrder = useSetTiebreakOrder()
  const clearTiebreakOrder = useClearTiebreakOrder()

  const [panelError, setPanelError] = useState('')
  const [cardError, setCardError] = useState('')

  // Whether groups exist is decided from useGroupsQuery alone — it never depends on the
  // tournament having match data, so it settles (and can be judged) independently of the
  // other three queries below.
  if (groupsQuery.isPending) {
    return <Skeleton width="100%" height={240} />
  }

  if (groupsQuery.isError) {
    return <ErrorState title="Não foi possível carregar os grupos." onRetry={() => groupsQuery.refetch()} />
  }

  const groups = groupsQuery.data ?? []

  if (groups.length === 0) {
    return (
      <EmptyState
        title="Nenhum grupo criado ainda."
        description="Crie o primeiro grupo e distribua as equipes já inscritas."
      />
    )
  }

  if (groupTeamsQuery.isPending || standingsQuery.isPending || tournamentTeamsQuery.isPending) {
    return <Skeleton width="100%" height={240} />
  }

  if (groupTeamsQuery.isError || standingsQuery.isError || tournamentTeamsQuery.isError) {
    const retry = () => {
      groupTeamsQuery.refetch()
      standingsQuery.refetch()
      tournamentTeamsQuery.refetch()
    }
    return <ErrorState title="Não foi possível carregar os grupos." onRetry={retry} />
  }

  const groupTeams = groupTeamsQuery.data ?? []
  const envelopes = standingsQuery.data ?? []
  const tournamentTeams = tournamentTeamsQuery.data ?? []
  const teamNameById = teamMap(getTeams())

  const enrolledTeams = tournamentTeams.map((tournamentTeam) => ({
    id: tournamentTeam.teamId,
    name: teamNameById.get(tournamentTeam.teamId)?.name ?? tournamentTeam.displayNameSnapshot,
  }))

  const assignedTeamIds = groupTeams.map((groupTeam) => groupTeam.teamId)

  const handleCreateGroup = async (name: string) => {
    await createGroup.mutateAsync({ tournamentId: tournament.id, name })
  }

  const handleAssign = async (groupId: string, teamId: string) => {
    try {
      await assignTeamToGroup.mutateAsync({ tournamentId: tournament.id, groupId, teamId })
      setPanelError('')
    } catch (error) {
      if (error instanceof Error && error.message === TEAM_ALREADY_ASSIGNED) {
        setPanelError('Equipe já está em um grupo neste campeonato.')
        return
      }
      throw error
    }
  }

  const handleRemoveFromGroup = (groupTeamId: string) => {
    removeGroupTeam.mutate(groupTeamId)
  }

  const handleTieBreakError = (error: unknown) => {
    if (error instanceof Error && error.message === TIED_BLOCK_MISMATCH) {
      setCardError('A composição do empate mudou. Recarregue a classificação.')
      queryClient.invalidateQueries({ queryKey: standingsKeys.list(tournament.id) })
      return
    }
    // The panel already blocks an incomplete permutation; this is the safety net behind it.
    setCardError('Não foi possível registrar o sorteio. Tente novamente.')
  }

  const handleSetTiebreakOrder = async (entries: { tournamentTeamId: string; order: number }[]) => {
    try {
      await setTiebreakOrder.mutateAsync({ tournamentId: tournament.id, entries })
      setCardError('')
    } catch (error) {
      handleTieBreakError(error)
    }
  }

  const handleClearTiebreakOrder = async (blockKey: string) => {
    try {
      await clearTiebreakOrder.mutateAsync({ tournamentId: tournament.id, blockKey })
      setCardError('')
    } catch (error) {
      handleTieBreakError(error)
    }
  }

  const renderExtraRowAction = (groupId: string | undefined) => (row: StandingRow) => {
    const join = groupTeams.find((groupTeam) => groupTeam.groupId === groupId && groupTeam.teamId === row.teamId)
    if (!join) return null
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFromGroup(join.id)}>
        Remover do grupo
      </Button>
    )
  }

  return (
    <div className={s.tab}>
      {isOrgAdmin && (
        <GroupsPanel
          groups={groups}
          enrolledTeams={enrolledTeams}
          assignedTeamIds={assignedTeamIds}
          onCreateGroup={handleCreateGroup}
          onAssign={handleAssign}
          errorMessage={panelError}
        />
      )}

      <div className={s.cards}>
        {envelopes.map((envelope) => (
          <StandingsCard
            key={envelope.group?.id ?? 'consolidated'}
            envelope={envelope}
            teams={teams}
            isOrgAdmin={isOrgAdmin}
            onSetTiebreakOrder={handleSetTiebreakOrder}
            onClearTiebreakOrder={handleClearTiebreakOrder}
            errorMessage={cardError}
            renderExtraRowAction={isOrgAdmin ? renderExtraRowAction(envelope.group?.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
