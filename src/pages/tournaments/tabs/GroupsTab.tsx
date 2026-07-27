import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { GroupsPanel } from '../../../features/sports/components/GroupsPanel'
import { StandingsCard } from '../../../features/sports/components/StandingsCard'
import {
  standingsKeys,
  useAssignTeamToGroup,
  useClearTiebreakOrder,
  useCreateGroup,
  useGroupsQuery,
  useGroupTeamsQuery,
  useRemoveGroup,
  useRemoveGroupTeam,
  useSetTiebreakOrder,
  useStandingsQuery,
  useTournamentTeamsQuery,
  useUpdateGroup,
} from '../../../features/sports/queries'
import type { Team, Tournament } from '../../../features/sports/types'
import { useIsOrgAdmin } from '../../../features/sports/useIsOrgAdmin'
import { apiErrorCode } from '../../../services/apiError'
import s from './GroupsTab.module.css'

interface GroupsTabProps {
  tournament: Tournament
  teams: Map<number, Team>
}

const TIED_BLOCK_MISMATCH = 'Tied block no longer matches'

const GROUP_ERROR_MESSAGES: Record<string, string> = {
  DUPLICATE_RECORD: 'Já existe um grupo com esse nome neste campeonato.',
  TEAM_ALREADY_ASSIGNED: 'Esta equipe já está em um grupo deste campeonato.',
  GROUP_NOT_EMPTY: 'Remova as equipes do grupo antes de excluí-lo.',
  TOURNAMENT_NOT_MUTABLE: 'Este campeonato não permite mais alterações.',
  INVALID_TOURNAMENT_FORMAT: 'Este campeonato não tem fase de grupos.',
  INACTIVE_REGISTRATION: 'A inscrição desta equipe não está ativa.',
  INVALID_GROUP_ASSIGNMENT: 'Grupo e equipe são de campeonatos diferentes.',
  RECORD_NOT_FOUND: 'Registro não encontrado. Atualize a página.',
}

const describeGroupError = (error: unknown, fallback: string) => GROUP_ERROR_MESSAGES[apiErrorCode(error) ?? ''] ?? fallback

export function GroupsTab({ tournament, teams }: GroupsTabProps) {
  const isOrgAdmin = useIsOrgAdmin()
  const queryClient = useQueryClient()

  const groupsQuery = useGroupsQuery(tournament.id)
  const groupTeamsQuery = useGroupTeamsQuery(tournament.id)
  const standingsQuery = useStandingsQuery(tournament.id, tournament.format)
  const tournamentTeamsQuery = useTournamentTeamsQuery(tournament.id)

  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()
  const removeGroup = useRemoveGroup()
  const assignTeamToGroup = useAssignTeamToGroup()
  const removeGroupTeam = useRemoveGroupTeam()
  const setTiebreakOrder = useSetTiebreakOrder()
  const clearTiebreakOrder = useClearTiebreakOrder()

  const [panelError, setPanelError] = useState('')
  const [cardError, setCardError] = useState('')

  // Whether groups exist is decided from useGroupsQuery alone — it never depends on the
  // tournament having match data, so it settles (and can be judged) independently of the
  // other three queries below. An admin must be able to create the first group while those
  // still-mocked standings queries resolve.
  if (groupsQuery.isPending) {
    return <Skeleton width="100%" height={240} />
  }

  if (groupsQuery.isError) {
    return <ErrorState title="Não foi possível carregar os grupos." onRetry={() => groupsQuery.refetch()} />
  }

  const groups = groupsQuery.data ?? []
  const groupTeams = groupTeamsQuery.data ?? []
  const tournamentTeams = tournamentTeamsQuery.data ?? []
  const envelopes = standingsQuery.data ?? []

  const nameByRegistration = new Map(tournamentTeams.map((t) => [t.id, t.displayNameSnapshot]))
  const members = groupTeams.map((groupTeam) => ({
    id: groupTeam.id,
    tournamentGroupId: groupTeam.tournamentGroupId,
    name: nameByRegistration.get(groupTeam.tournamentTeamId) ?? String(groupTeam.tournamentTeamId),
  }))
  const enrolledTeams = tournamentTeams.map((tournamentTeam) => ({
    id: tournamentTeam.id,
    name: tournamentTeam.displayNameSnapshot,
  }))

  const handleCreateGroup = async (name: string) => {
    try {
      await createGroup.mutateAsync({ tournamentId: tournament.id, name })
      setPanelError('')
    } catch (error) {
      setPanelError(describeGroupError(error, 'Não foi possível criar o grupo.'))
      throw error
    }
  }

  const handleRenameGroup = async (id: number, name: string) => {
    try {
      await updateGroup.mutateAsync({ id, input: { name } })
      setPanelError('')
    } catch (error) {
      setPanelError(describeGroupError(error, 'Não foi possível renomear o grupo.'))
      throw error
    }
  }

  const handleRemoveGroup = async (id: number) => {
    try {
      await removeGroup.mutateAsync(id)
      setPanelError('')
    } catch (error) {
      setPanelError(describeGroupError(error, 'Não foi possível excluir o grupo.'))
      throw error
    }
  }

  const handleAssign = async (tournamentGroupId: number, tournamentTeamId: number) => {
    try {
      await assignTeamToGroup.mutateAsync({ tournamentGroupId, tournamentTeamId })
      setPanelError('')
    } catch (error) {
      setPanelError(describeGroupError(error, 'Não foi possível adicionar a equipe ao grupo.'))
      throw error
    }
  }

  const handleRemoveMember = async (id: number) => {
    try {
      await removeGroupTeam.mutateAsync(id)
      setPanelError('')
    } catch (error) {
      setPanelError(describeGroupError(error, 'Não foi possível remover a equipe do grupo.'))
      throw error
    }
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

  const handleSetTiebreakOrder = async (entries: { tournamentTeamId: number; order: number }[]) => {
    try {
      await setTiebreakOrder.mutateAsync({ tournamentId: tournament.id, format: tournament.format, entries })
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

  const standingsLoading = groupTeamsQuery.isPending || standingsQuery.isPending || tournamentTeamsQuery.isPending
  const standingsFailed = groupTeamsQuery.isError || standingsQuery.isError || tournamentTeamsQuery.isError
  const retryStandings = () => {
    groupTeamsQuery.refetch()
    standingsQuery.refetch()
    tournamentTeamsQuery.refetch()
  }

  return (
    <div className={s.tab}>
      <GroupsPanel
        groups={groups}
        members={members}
        enrolledTeams={enrolledTeams}
        canManage={isOrgAdmin}
        onCreateGroup={handleCreateGroup}
        onRenameGroup={handleRenameGroup}
        onRemoveGroup={handleRemoveGroup}
        onAssign={handleAssign}
        onRemoveMember={handleRemoveMember}
        errorMessage={panelError}
      />

      {groups.length === 0 ? (
        <EmptyState
          title="Nenhum grupo criado ainda."
          description="Crie o primeiro grupo e distribua as equipes já inscritas."
        />
      ) : standingsLoading ? (
        <Skeleton width="100%" height={240} />
      ) : standingsFailed ? (
        <ErrorState title="Não foi possível carregar a classificação." onRetry={retryStandings} />
      ) : (
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
