import { useState } from 'react'
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui'
import { BracketCanvas } from '../../../features/sports/components/BracketCanvas'
import type { Tournament } from '../../../features/sports/types'
import { useCreateBracketRound, useCreateBracketSlot, useLinkSlotMatch, useRemoveBracketSlot, useScheduleMatch, useSetSlotWinner, useTournamentTeamsQuery, useUpdateBracketSlot } from '../../../features/sports/queries'
import { useIsOrgAdmin } from '../../../features/sports/useIsOrgAdmin'
import { useBracketView } from '../../../features/sports/useBracketView'
import s from './BracketTab.module.css'

export function BracketTab({ tournament }: { tournament: Tournament }) {
  const isOrgAdmin = useIsOrgAdmin()
  const { rounds, slots, teams: options, isPending, isError, refetch } = useBracketView(tournament.id)
  const { data: tournamentTeams = [] } = useTournamentTeamsQuery(tournament.id)
  const createSlot = useCreateBracketSlot()
  const createRound = useCreateBracketRound()
  const updateSlot = useUpdateBracketSlot()
  const setWinner = useSetSlotWinner()
  const linkMatch = useLinkSlotMatch()
  const removeSlot = useRemoveBracketSlot()
  const scheduleMatch = useScheduleMatch()
  const [errorMessage, setErrorMessage] = useState('')

  const fail = (error: unknown) => {
    const message = error instanceof Error ? error.message : ''
    setErrorMessage(message === 'Winner must be one of the slot sides' ? 'O vencedor precisa ser uma das equipes da vaga.' : message === 'Cannot remove a slot whose match is finished' ? 'Esta vaga tem um jogo finalizado. Cancele o resultado antes de remover a vaga.' : message)
  }

  if (isPending) return <Skeleton width="100%" height={240} />
  if (isError) return <ErrorState title="Não foi possível carregar o chaveamento." onRetry={refetch} />

  const teamIdOf = (tournamentTeamId: string) => tournamentTeams.find((entry) => entry.id === tournamentTeamId)?.teamId
  const handleSchedule = async (slotId: string, scheduledAt: string) => {
    const slot = slots.find((entry) => entry.id === slotId)
    if (!slot?.homeTournamentTeamId || !slot.awayTournamentTeamId) return
    const homeTeamId = teamIdOf(slot.homeTournamentTeamId)
    const awayTeamId = teamIdOf(slot.awayTournamentTeamId)
    if (!homeTeamId || !awayTeamId) return
    try {
      const match = await scheduleMatch.mutateAsync({ tournamentId: tournament.id, homeTeamId, awayTeamId, scheduledAt })
      await linkMatch.mutateAsync({ slotId, matchId: match.id })
      setErrorMessage('')
    } catch (error) { fail(error) }
  }

  return <div className={s.tab}>
    {slots.length === 0 && <EmptyState title="Nenhuma vaga de chaveamento criada ainda." description="Crie a primeira rodada e monte o mata-mata." />}
    <BracketCanvas rounds={rounds} slots={slots} teams={options} isOrgAdmin={isOrgAdmin}
      onFillSide={async (id, side, tournamentTeamId) => { try { await updateSlot.mutateAsync({ id, input: side === 'home' ? { homeTournamentTeamId: tournamentTeamId } : { awayTournamentTeamId: tournamentTeamId } }); setErrorMessage('') } catch (error) { fail(error) } }}
      onSetWinner={async (slotId, winnerTournamentTeamId) => { try { await setWinner.mutateAsync({ slotId, winnerTournamentTeamId }); setErrorMessage('') } catch (error) { fail(error) } }}
      onRenameSlot={async (id, label) => { try { await updateSlot.mutateAsync({ id, input: { label } }) } catch (error) { fail(error) } }}
      onSchedule={handleSchedule}
      onCreateSlot={async (roundId) => { try { await createSlot.mutateAsync({ tournamentId: tournament.id, roundId }) } catch (error) { fail(error) } }}
      onCreateRound={async () => { try { await createRound.mutateAsync({ tournamentId: tournament.id }) } catch (error) { fail(error) } }}
      onRemoveSlot={async (id) => { try { await removeSlot.mutateAsync(id); setErrorMessage('') } catch (error) { fail(error) } }} errorMessage={errorMessage} />
  </div>
}
