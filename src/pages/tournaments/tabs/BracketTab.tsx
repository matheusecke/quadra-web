import { useState } from 'react'
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui'
import { BracketCanvas } from '../../../features/sports/components/BracketCanvas'
import type { Tournament } from '../../../features/sports/types'
import { getTeams } from '../../../features/sports/mock-sports-data'
import { useBracketSlotsQuery, useCreateBracketSlot, useLinkSlotMatch, useMatchesQuery, useRemoveBracketSlot, useScheduleMatch, useSetSlotWinner, useTournamentTeamsQuery, useUpdateBracketSlot } from '../../../features/sports/queries'
import { useIsOrgAdmin } from '../../../features/sports/useIsOrgAdmin'
import s from './BracketTab.module.css'

export function BracketTab({ tournament }: { tournament: Tournament }) {
  const isOrgAdmin = useIsOrgAdmin()
  const slotsQuery = useBracketSlotsQuery(tournament.id)
  const { data: matches = [] } = useMatchesQuery({ tournamentId: tournament.id })
  const { data: tournamentTeams = [] } = useTournamentTeamsQuery(tournament.id)
  const createSlot = useCreateBracketSlot()
  const updateSlot = useUpdateBracketSlot()
  const setWinner = useSetSlotWinner()
  const linkMatch = useLinkSlotMatch()
  const removeSlot = useRemoveBracketSlot()
  const scheduleMatch = useScheduleMatch()
  const [errorMessage, setErrorMessage] = useState('')
  const teamsById = new Map(getTeams().map((team) => [team.id, team]))
  const matchesById = new Map(matches.map((match) => [match.id, match]))

  const fail = (error: unknown) => {
    const message = error instanceof Error ? error.message : ''
    setErrorMessage(message === 'Winner must be one of the slot sides' ? 'O vencedor precisa ser uma das equipes da vaga.' : message === 'Cannot remove a slot whose match is finished' ? 'Esta vaga tem um jogo finalizado. Cancele o resultado antes de remover a vaga.' : message)
  }

  if (slotsQuery.isPending) return <Skeleton width="100%" height={240} />
  if (slotsQuery.isError) return <ErrorState title="Não foi possível carregar o chaveamento." onRetry={slotsQuery.refetch} />

  const slots = slotsQuery.data ?? []
  const options = tournamentTeams.map((entry) => {
    const team = teamsById.get(entry.teamId)
    return { tournamentTeamId: entry.id, name: team?.name ?? entry.displayNameSnapshot, shortName: team?.shortName ?? entry.teamId }
  })
  const views = slots.map((slot) => ({ ...slot, match: slot.matchId ? matchesById.get(slot.matchId) ?? null : null }))
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
    <BracketCanvas slots={views} teams={options} isOrgAdmin={isOrgAdmin}
      onFillSide={async (id, side, tournamentTeamId) => { try { await updateSlot.mutateAsync({ id, input: side === 'home' ? { homeTournamentTeamId: tournamentTeamId } : { awayTournamentTeamId: tournamentTeamId } }); setErrorMessage('') } catch (error) { fail(error) } }}
      onSetWinner={async (slotId, winnerTournamentTeamId) => { try { await setWinner.mutateAsync({ slotId, winnerTournamentTeamId }); setErrorMessage('') } catch (error) { fail(error) } }}
      onRenameSlot={async (id, label) => { try { await updateSlot.mutateAsync({ id, input: { label } }) } catch (error) { fail(error) } }}
      onSchedule={handleSchedule}
      onCreateSlot={async (roundNumber) => { try { await createSlot.mutateAsync({ tournamentId: tournament.id, roundNumber }) } catch (error) { fail(error) } }}
      onCreateRound={async () => { try { await createSlot.mutateAsync({ tournamentId: tournament.id, roundNumber: Math.max(0, ...slots.map((slot) => slot.roundNumber)) + 1 }) } catch (error) { fail(error) } }}
      onRemoveSlot={async (id) => { try { await removeSlot.mutateAsync(id); setErrorMessage('') } catch (error) { fail(error) } }} errorMessage={errorMessage} />
  </div>
}
