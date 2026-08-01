import { useState } from 'react'
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui'
import { BracketBoard } from '../../../features/sports/components/BracketBoard'
import { BracketCanvas } from '../../../features/sports/components/BracketCanvas'
import type { BracketSlotView, Tournament, TournamentStatus } from '../../../features/sports/types'
import {
  useCreateBracketRound, useCreateBracketSlot, useLinkBracketSlotMatch, useRemoveBracketRound,
  useRemoveBracketSlot, useUnlinkBracketSlotMatch, useUpdateBracketRound, useUpdateBracketSlot,
} from '../../../features/sports/queries'
import { formatDateTime, hasKnockout } from '../../../features/sports/sportsUtils'
import { useIsOrgAdmin } from '../../../features/sports/useIsOrgAdmin'
import { useBracketView } from '../../../features/sports/useBracketView'
import { apiErrorCode, apiErrorMessage } from '../../../services/apiError'
import { collectPages } from '../../../services/sportsApi/pagination'
import * as sportsApi from '../../../services/sportsApi'
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

/** Codes for which the loaded bracket is stale — the client refetches it before the admin tries again. */
const BRACKET_REFETCH_CODES = new Set([
  'DUPLICATE_RECORD',
  'RECORD_NOT_FOUND',
  'SLOT_HAS_NO_MATCH',
  'SLOT_HAS_MATCH',
  'MATCH_ALREADY_LINKED',
  'CONCURRENT_MODIFICATION',
])

const MATCH_LINK_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Não foi possível validar esta ação.',
  SLOT_HAS_NO_MATCH: 'A vaga já não possui partida vinculada.',
  MATCH_ALREADY_LINKED: 'Esta partida já está vinculada a outra vaga.',
  MATCH_ALREADY_FINISHED: 'Partida finalizada não pode ser desvinculada.',
  CONCURRENT_MODIFICATION: 'A vaga foi alterada por outra pessoa. Atualize e tente novamente.',
  INVALID_BRACKET_ASSIGNMENT: 'Selecione uma partida deste campeonato.',
  MATCH_IN_GROUP_STAGE: 'Partidas da fase de grupos não podem ser vinculadas ao chaveamento.',
  MATCH_CANCELLED: 'Partidas canceladas não podem ser vinculadas.',
  MATCH_TEAMS_MISMATCH: 'Selecione uma partida com os mesmos participantes da vaga.',
}

function matchLinkErrorMessage(error: unknown): string {
  const code = apiErrorCode(error)
  const message = apiErrorMessage(error)
  if (code === 'RECORD_NOT_FOUND' && message === 'Match not found') return 'A partida selecionada não existe mais.'
  if (code === 'SLOT_HAS_MATCH' && message === 'This bracket slot is linked to a different match.') return 'A vaga está vinculada a outra partida.'
  if (code === 'SLOT_HAS_MATCH') return 'Desvincule a partida atual antes de vincular outra.'
  return MATCH_LINK_ERROR_MESSAGES[code ?? ''] ?? BRACKET_ERROR_MESSAGES[code ?? ''] ?? 'Não foi possível salvar a alteração. Tente novamente.'
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
  const linkMatch = useLinkBracketSlotMatch()
  const unlinkMatch = useUnlinkBracketSlotMatch()
  const [errorMessage, setErrorMessage] = useState('')

  const canEditStructure = isOrgAdmin && hasKnockout(tournament.format) && EDITABLE_STATUSES.includes(tournament.status)

  const busySlotId = linkMatch.isPending
    ? (linkMatch.variables?.slotId ?? null)
    : unlinkMatch.isPending
      ? (unlinkMatch.variables?.slotId ?? null)
      : null

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

  const runMatchLink = async (write: Promise<unknown>) => {
    try {
      await write
      setErrorMessage('')
    } catch (error) {
      const code = apiErrorCode(error)
      setErrorMessage(matchLinkErrorMessage(error))
      if (BRACKET_REFETCH_CODES.has(code ?? '')) refetch()
    }
  }

  const searchMatches = async (slot: BracketSlotView, query: string) => {
    const tournamentTeamIds = [slot.homeTeam?.tournamentTeamId, slot.awayTeam?.tournamentTeamId]
      .filter((id): id is number => id !== undefined)
    const matches = await collectPages((page) => sportsApi.listTournamentMatchesPage(tournament.id, {
      page,
      limit: 100,
      q: query.trim() || undefined,
      tournamentTeamIds: tournamentTeamIds.length ? tournamentTeamIds : undefined,
    }))
    return matches
      .filter((match) => match.bracketRound === null && match.tournamentGroupId === null && match.status !== 'CANCELLED')
      .map((match) => ({
        id: match.id,
        label: `${match.homeTeam.teamName} × ${match.awayTeam.teamName}`,
        secondary: `${formatDateTime(match.scheduledAt)} · ${match.status}`,
      }))
  }

  if (isPending) return <Skeleton width="100%" height={240} />
  if (isError) return <ErrorState title="Não foi possível carregar o chaveamento." onRetry={refetch} />

  if (!canEditStructure) {
    if (slots.length === 0) return <EmptyState title="Chaveamento ainda não montado." />
    return <div className={s.tab}>
      <BracketBoard rounds={rounds} slots={slots} championTournamentTeamId={tournament.championTournamentTeamId} variant="full" />
    </div>
  }

  return <div className={s.tab}>
    {slots.length === 0 && <EmptyState title="Nenhuma vaga de chaveamento criada ainda." description="Crie a primeira rodada e monte o mata-mata." />}
    <BracketCanvas rounds={rounds} slots={slots} teams={teams} tournamentId={tournament.id}
      canEditStructure={canEditStructure} busySlotId={busySlotId} errorMessage={errorMessage}
      onCreateRound={() => run(createRound.mutateAsync({ tournamentId: tournament.id, number: nextRoundNumber }))}
      onRenameRound={(id, label) => run(updateRound.mutateAsync({ id, input: { label } }))}
      onRemoveRound={(id) => run(removeRound.mutateAsync(id))}
      onCreateSlot={(roundId) => run(createSlot.mutateAsync({ roundId, position: nextPosition(roundId) }))}
      onRenameSlot={(id, label) => run(updateSlot.mutateAsync({ id, input: { label } }))}
      onRemoveSlot={(id) => run(removeSlot.mutateAsync(id))}
      onFillSide={(id, side, tournamentTeamId) => run(updateSlot.mutateAsync({
        id,
        input: side === 'home' ? { homeTournamentTeamId: tournamentTeamId } : { awayTournamentTeamId: tournamentTeamId },
      }))}
      onSearchMatches={searchMatches}
      onLinkMatch={(slotId, matchId) => runMatchLink(linkMatch.mutateAsync({ tournamentId: tournament.id, slotId, matchId }))}
      onUnlinkMatch={(slot) => slot.match
        ? runMatchLink(unlinkMatch.mutateAsync({ tournamentId: tournament.id, slotId: slot.id, matchId: slot.match.id }))
        : Promise.resolve()} />
  </div>
}
