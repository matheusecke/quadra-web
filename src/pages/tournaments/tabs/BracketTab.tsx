import { useState } from 'react'
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui'
import { BracketBoard } from '../../../features/sports/components/BracketBoard'
import { BracketCanvas } from '../../../features/sports/components/BracketCanvas'
import type { Tournament, TournamentStatus } from '../../../features/sports/types'
import {
  useCreateBracketRound, useCreateBracketSlot, useRemoveBracketRound,
  useRemoveBracketSlot, useUpdateBracketRound, useUpdateBracketSlot,
} from '../../../features/sports/queries'
import { hasKnockout } from '../../../features/sports/sportsUtils'
import { useIsOrgAdmin } from '../../../features/sports/useIsOrgAdmin'
import { useBracketView } from '../../../features/sports/useBracketView'
import { apiErrorCode } from '../../../services/apiError'
import s from './BracketTab.module.css'

const EDITABLE_STATUSES: TournamentStatus[] = ['DRAFT', 'REGISTRATION', 'IN_PROGRESS']

const BRACKET_ERROR_MESSAGES: Record<string, string> = {
  ROUND_NOT_EMPTY: 'Remova as vagas desta rodada antes de excluí-la.',
  SLOT_HAS_MATCH: 'Esta vaga tem uma partida vinculada.',
  DUPLICATE_RECORD: 'Já existe uma rodada com esse número ou uma vaga nessa posição. Recarregue o chaveamento.',
  SAME_TEAM_IN_SLOT: 'A mesma equipe não pode ocupar os dois lados da vaga.',
  INACTIVE_REGISTRATION: 'Esta inscrição não está ativa no campeonato.',
  INVALID_BRACKET_ASSIGNMENT: 'Esta equipe não está inscrita neste campeonato.',
  TOURNAMENT_NOT_MUTABLE: 'O campeonato está encerrado. Reabra-o para editar o chaveamento.',
  INVALID_TOURNAMENT_FORMAT: 'Este formato não tem chaveamento.',
  RECORD_NOT_FOUND: 'Registro não encontrado. Atualize a página.',
}

export function BracketTab({ tournament }: { tournament: Tournament }) {
  const isOrgAdmin = useIsOrgAdmin()
  const { rounds, slots, teams, isPending, isError, refetch } = useBracketView(tournament.id)
  const createRound = useCreateBracketRound()
  const updateRound = useUpdateBracketRound()
  const removeRound = useRemoveBracketRound()
  const createSlot = useCreateBracketSlot()
  const updateSlot = useUpdateBracketSlot()
  const removeSlot = useRemoveBracketSlot()
  const [errorMessage, setErrorMessage] = useState('')

  const canEdit = isOrgAdmin && hasKnockout(tournament.format) && EDITABLE_STATUSES.includes(tournament.status)

  /** The API derives nothing: the client picks the next value and owns the collision. */
  const nextRoundNumber = Math.max(0, ...rounds.map((round) => round.number)) + 1
  const nextPosition = (roundId: number) =>
    Math.max(0, ...slots.filter((slot) => slot.roundId === roundId).map((slot) => slot.position)) + 1

  const run = async (write: Promise<unknown>) => {
    try {
      await write
      setErrorMessage('')
    } catch (error) {
      const code = apiErrorCode(error)
      setErrorMessage(BRACKET_ERROR_MESSAGES[code ?? ''] ?? 'Não foi possível salvar a alteração. Tente novamente.')
      // A duplicate number or position means what we loaded is stale — that staleness is
      // exactly what produced the wrong value.
      if (code === 'DUPLICATE_RECORD') refetch()
    }
  }

  if (isPending) return <Skeleton width="100%" height={240} />
  if (isError) return <ErrorState title="Não foi possível carregar o chaveamento." onRetry={refetch} />

  if (!canEdit) {
    if (slots.length === 0) return <EmptyState title="Chaveamento ainda não montado." />
    return <div className={s.tab}>
      <BracketBoard rounds={rounds} slots={slots} championTournamentTeamId={tournament.championTournamentTeamId} variant="full" />
    </div>
  }

  return <div className={s.tab}>
    {slots.length === 0 && <EmptyState title="Nenhuma vaga de chaveamento criada ainda." description="Crie a primeira rodada e monte o mata-mata." />}
    <BracketCanvas rounds={rounds} slots={slots} teams={teams} errorMessage={errorMessage}
      onCreateRound={() => run(createRound.mutateAsync({ tournamentId: tournament.id, number: nextRoundNumber }))}
      onRenameRound={(id, label) => run(updateRound.mutateAsync({ id, input: { label } }))}
      onRemoveRound={(id) => run(removeRound.mutateAsync(id))}
      onCreateSlot={(roundId) => run(createSlot.mutateAsync({ roundId, position: nextPosition(roundId) }))}
      onRenameSlot={(id, label) => run(updateSlot.mutateAsync({ id, input: { label } }))}
      onRemoveSlot={(id) => run(removeSlot.mutateAsync(id))}
      onFillSide={(id, side, tournamentTeamId) => run(updateSlot.mutateAsync({
        id,
        input: side === 'home' ? { homeTournamentTeamId: tournamentTeamId } : { awayTournamentTeamId: tournamentTeamId },
      }))} />
  </div>
}
