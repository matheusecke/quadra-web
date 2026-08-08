import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import type { MatchSummary, Tournament } from '../../../features/sports/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as sportsApi from '../../../services/sportsApi'
import { getTeams as getMockTeams } from '../../../features/sports/mock-sports-data'
import { SEED_TOURNAMENT, tournamentTeamId } from '../../../features/sports/seedIds'

import { BracketTab } from './BracketTab'

const isOrgAdmin = vi.hoisted(() => ({ value: false }))
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => isOrgAdmin.value }))

const GERAL_TEAMS = getMockTeams()
const GERAL_TOURNAMENT_TEAMS = GERAL_TEAMS.map((team) => ({
  id: tournamentTeamId(SEED_TOURNAMENT.GERAL, team.id),
  tournamentId: SEED_TOURNAMENT.GERAL,
  teamId: team.id,
  displayNameSnapshot: team.name,
  seed: null,
  tiebreakOrder: null,
  tiebreakBlockKey: null,
}))

const DEMO_BRACKET: sportsApi.BracketRead = {
  rounds: [
    { id: 1, tournamentId: SEED_TOURNAMENT.GERAL, number: 1, label: 'Quartas de final' },
    { id: 2, tournamentId: SEED_TOURNAMENT.GERAL, number: 2, label: 'Semifinais' },
    { id: 3, tournamentId: SEED_TOURNAMENT.GERAL, number: 3, label: 'Final' },
  ],
  slots: [
    { id: 101, roundId: 1, position: 1, label: null, homeTeam: null, awayTeam: null, match: null, winnerTournamentTeamId: null },
  ],
}

const emptyMatchesPage = {
  data: [],
  meta: { totalItems: 0, itemCount: 0, itemsPerPage: 100, totalPages: 1, currentPage: 1 },
  links: { first: '', previous: null, next: null, last: '' },
  statusCode: 200,
}

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTeams').mockResolvedValue(GERAL_TEAMS)
  vi.spyOn(sportsApi, 'getTournamentTeams').mockImplementation(async (id) =>
    id === SEED_TOURNAMENT.GERAL ? GERAL_TOURNAMENT_TEAMS : [])
  vi.spyOn(sportsApi, 'getBracket').mockImplementation(async (id) =>
    id === SEED_TOURNAMENT.GERAL ? DEMO_BRACKET : { rounds: [], slots: [] })
  vi.spyOn(sportsApi, 'listTournamentMatchesPage').mockResolvedValue(emptyMatchesPage)
})

const empty = { id: 999, name: 'Copa', format: 'KNOCKOUT', status: 'IN_PROGRESS', teamIds: [] } as unknown as Tournament
const demo = { id: 1, name: 'Geral', format: 'KNOCKOUT', status: 'IN_PROGRESS', teamIds: [] } as unknown as Tournament
const knockout = { id: 12, name: 'Copa', format: 'KNOCKOUT', status: 'IN_PROGRESS', teamIds: [] } as unknown as Tournament
const completed = { ...knockout, status: 'COMPLETED' } as Tournament
const league = { ...knockout, format: 'LEAGUE' } as Tournament

const renderTab = (tournament: Tournament, onRefetchTournament = vi.fn().mockResolvedValue(undefined)) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <BracketTab tournament={tournament} onRefetchTournament={onRefetchTournament} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('BracketTab', () => {
  it('shows an empty state before any slot exists', async () => {
    isOrgAdmin.value = false
    renderTab(empty)
    await waitFor(() =>
      expect(screen.getByText('Chaveamento ainda não montado.')).toBeInTheDocument(),
    )
  })

  it('renders no control that writes for a reader', async () => {
    isOrgAdmin.value = false
    renderTab(demo)
    await waitFor(() => expect(screen.getByText('Quartas de final')).toBeInTheDocument())
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers the round control to an admin', async () => {
    isOrgAdmin.value = true
    renderTab(demo)
    await waitFor(() => expect(screen.getByRole('button', { name: /nova rodada/i })).toBeInTheDocument())
  })

  it('hides the editing canvas on a completed knockout', async () => {
    isOrgAdmin.value = true
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({
      rounds: [{ id: 10, tournamentId: 12, number: 1, label: 'Final' }],
      slots: [{ id: 101, roundId: 10, position: 1, label: null, homeTeam: null, awayTeam: null, match: null, winnerTournamentTeamId: null }],
    })
    renderTab(completed)
    await waitFor(() => expect(screen.getByText('Final')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: '+ Nova rodada' })).not.toBeInTheDocument()
  })

  it('hides the editing canvas on a league tournament', async () => {
    isOrgAdmin.value = true
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({ rounds: [], slots: [] })
    renderTab(league)
    await waitFor(() => expect(screen.getByText('Chaveamento ainda não montado.')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: '+ Nova rodada' })).not.toBeInTheDocument()
  })

  it('creates the first round as number 1', async () => {
    isOrgAdmin.value = true
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({ rounds: [], slots: [] })
    const createBracketRound = vi.spyOn(sportsApi, 'createBracketRound').mockResolvedValue({ id: 10, tournamentId: 12, number: 1, label: null })
    renderTab(knockout)
    await userEvent.click(await screen.findByRole('button', { name: '+ Nova rodada' }))
    expect(createBracketRound).toHaveBeenCalledWith({ tournamentId: 12, number: 1 })
  })

  it('creates the next round after the highest loaded number', async () => {
    isOrgAdmin.value = true
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({
      rounds: [{ id: 10, tournamentId: 12, number: 1, label: 'Semifinais' }, { id: 11, tournamentId: 12, number: 2, label: 'Final' }],
      slots: [],
    })
    const createBracketRound = vi.spyOn(sportsApi, 'createBracketRound').mockResolvedValue({ id: 12, tournamentId: 12, number: 3, label: null })
    renderTab(knockout)
    await userEvent.click(await screen.findByRole('button', { name: '+ Nova rodada' }))
    expect(createBracketRound).toHaveBeenCalledWith({ tournamentId: 12, number: 3 })
  })

  it('explains a round that still holds slots', async () => {
    isOrgAdmin.value = true
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({
      rounds: [{ id: 10, tournamentId: 12, number: 1, label: 'Semifinais' }],
      slots: [{ id: 101, roundId: 10, position: 1, label: null, homeTeam: null, awayTeam: null, match: null, winnerTournamentTeamId: null }],
    })
    vi.spyOn(sportsApi, 'removeBracketRound').mockRejectedValue(
      new AxiosError('conflict', undefined, undefined, undefined, {
        status: 409, data: { error: { code: 'ROUND_NOT_EMPTY' } },
      } as never),
    )
    renderTab(knockout)
    await userEvent.click(await screen.findByRole('button', { name: 'Remover Semifinais' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Remova as vagas desta rodada antes de excluí-la.')
  })

  describe('linking and unlinking matches', () => {
    const bracketWithSlot = (slotOverrides: Partial<sportsApi.BracketRead['slots'][number]> = {}): sportsApi.BracketRead => ({
      rounds: [{ id: 10, tournamentId: 12, number: 1, label: 'Final' }],
      slots: [{
        id: 101, roundId: 10, position: 1, label: null,
        homeTeam: { tournamentTeamId: 41, teamId: 8, name: 'Águias', shortName: 'AGU' },
        awayTeam: { tournamentTeamId: 52, teamId: 9, name: 'Falcões', shortName: 'FAL' },
        match: null, winnerTournamentTeamId: null,
        ...slotOverrides,
      }],
    })

    const matchesPage = (data: MatchSummary[]) => ({
      data,
      meta: { totalItems: data.length, itemCount: data.length, itemsPerPage: 100, totalPages: 1, currentPage: 1 },
      links: { first: '', previous: null, next: null, last: '' },
      statusCode: 200,
    })

    const candidateMatch = (over: Partial<MatchSummary> = {}): MatchSummary => ({
      id: 501, tournamentId: 12, tournamentGroupId: null, matchNumber: null,
      status: 'SCHEDULED', scheduledAt: '2026-08-01T22:00:00.000Z', startedAt: null, endedAt: null,
      venueName: null, bracketRound: null, scoreSource: null,
      homeTeam: { tournamentTeamId: 41, teamId: 8, teamName: 'Águias', score: null, result: null, lossType: null, isWinner: null },
      awayTeam: { tournamentTeamId: 52, teamId: 9, teamName: 'Falcões', score: null, result: null, lossType: null, isWinner: null },
      ...over,
    })

    it('searches the tournament matches with the slot participants and the trimmed query', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithSlot())
      const listMatches = vi.spyOn(sportsApi, 'listTournamentMatchesPage').mockResolvedValue(matchesPage([candidateMatch()]))
      renderTab(knockout)
      await userEvent.type(await screen.findByPlaceholderText('Buscar partida…'), '  Águias  ')
      await waitFor(() => expect(listMatches).toHaveBeenCalledWith(12, { page: 1, limit: 100, q: 'Águias', tournamentTeamIds: [41, 52] }))
    })

    it('hides matches already placed in a group stage or bracket, and cancelled ones', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithSlot())
      vi.spyOn(sportsApi, 'listTournamentMatchesPage').mockResolvedValue(matchesPage([
        candidateMatch({ id: 501 }),
        candidateMatch({ id: 502, bracketRound: { id: 1, number: 1, label: null } }),
        candidateMatch({ id: 503, tournamentGroupId: 9 }),
        candidateMatch({ id: 504, status: 'CANCELLED' }),
      ]))
      renderTab(knockout)
      await userEvent.type(await screen.findByPlaceholderText('Buscar partida…'), 'Águias')
      await screen.findByRole('option', { name: /Águias × Falcões/ })
      expect(screen.getAllByRole('option')).toHaveLength(1)
    })

    it('links the selected match to the slot', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithSlot())
      vi.spyOn(sportsApi, 'listTournamentMatchesPage').mockResolvedValue(matchesPage([candidateMatch()]))
      const linkMatch = vi.spyOn(sportsApi, 'linkBracketSlotMatch').mockResolvedValue({
        id: 101, tournamentId: 12, roundId: 10, position: 1, label: null,
        homeTournamentTeamId: 41, awayTournamentTeamId: 52, matchId: 501, winnerTournamentTeamId: null,
      })
      renderTab(knockout)
      await userEvent.type(await screen.findByPlaceholderText('Buscar partida…'), 'Águias')
      await userEvent.click(await screen.findByRole('option', { name: /Águias × Falcões/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Vincular partida' }))
      expect(linkMatch).toHaveBeenCalledWith(101, { matchId: 501 })
    })

    it('shows the finished-match guard with no unlink control', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithSlot({
        match: { id: 501, status: 'FINISHED', date: '2026-08-01T22:00:00.000Z', homeScore: 78, awayScore: 65 },
      }))
      renderTab(knockout)
      expect(await screen.findByText('Partida finalizada não pode ser desvinculada.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /desvincular/i })).not.toBeInTheDocument()
    })

    it('confirms cancelling a scheduled match before unlinking', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithSlot({
        match: { id: 501, status: 'SCHEDULED', date: null, homeScore: null, awayScore: null },
      }))
      const unlinkMatch = vi.spyOn(sportsApi, 'unlinkBracketSlotMatch').mockResolvedValue(undefined)
      renderTab(knockout)
      await userEvent.click(await screen.findByRole('button', { name: 'Desvincular partida' }))
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Desvincular cancelará a partida e ela não poderá ser reativada nesta fase.')
      await userEvent.click(screen.getByRole('button', { name: 'Confirmar desvínculo' }))
      await waitFor(() => expect(unlinkMatch).toHaveBeenCalledWith(101))
    })

    it('confirms with the lighter copy when unlinking an already cancelled match', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithSlot({
        match: { id: 501, status: 'CANCELLED', date: null, homeScore: null, awayScore: null },
      }))
      renderTab(knockout)
      await userEvent.click(await screen.findByRole('button', { name: 'Desvincular partida' }))
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Desvincular removerá a partida desta vaga.')
    })
  })

  describe('setting the slot winner', () => {
    const bracketWithParticipants = (slotOverrides: Partial<sportsApi.BracketRead['slots'][number]> = {}): sportsApi.BracketRead => ({
      rounds: [{ id: 10, tournamentId: 12, number: 1, label: 'Final' }],
      slots: [{
        id: 101, roundId: 10, position: 1, label: null,
        homeTeam: { tournamentTeamId: 41, teamId: 8, name: 'Águias', shortName: 'AGU' },
        awayTeam: { tournamentTeamId: 52, teamId: 9, name: 'Falcões', shortName: 'FAL' },
        match: null, winnerTournamentTeamId: null,
        ...slotOverrides,
      }],
    })

    it('offers the winner control even on a completed tournament, once structure editing is closed', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithParticipants())
      renderTab(completed)
      expect(await screen.findByRole('button', { name: /vencedor/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /nova rodada/i })).not.toBeInTheDocument()
    })

    it('hides the winner control on a cancelled tournament', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithParticipants())
      renderTab({ ...knockout, status: 'CANCELLED' } as Tournament)
      await waitFor(() => expect(screen.getByText('Final')).toBeInTheDocument())
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('writes the winner and refreshes the tournament so the confirmation flow sees it', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithParticipants())
      const setWinner = vi.spyOn(sportsApi, 'setBracketSlotWinner').mockResolvedValue({
        id: 101, tournamentId: 12, roundId: 10, position: 1, label: null,
        homeTournamentTeamId: 41, awayTournamentTeamId: 52, matchId: null, winnerTournamentTeamId: 41,
      })
      const onRefetchTournament = vi.fn().mockResolvedValue(undefined)
      renderTab(knockout, onRefetchTournament)
      await userEvent.click(await screen.findByRole('button', { name: /vencedor/i }))
      await userEvent.click(screen.getByRole('option', { name: 'Águias' }))
      await waitFor(() => expect(setWinner).toHaveBeenCalledWith(101, { winnerTournamentTeamId: 41 }))
      await waitFor(() => expect(onRefetchTournament).toHaveBeenCalled())
    })

    it('blocks replacing the winning side until the winner is cleared', async () => {
      isOrgAdmin.value = true
      vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracketWithParticipants({ winnerTournamentTeamId: 41 }))
      const updateSlot = vi.spyOn(sportsApi, 'updateBracketSlot')
      renderTab(knockout)
      await userEvent.click(await screen.findByRole('button', { name: /mandante/i }))
      await userEvent.click(screen.getByRole('option', { name: 'Remover equipe' }))
      expect(updateSlot).not.toHaveBeenCalled()
      expect(await screen.findByRole('alert')).toHaveTextContent('Limpe o vencedor antes de substituir esta equipe')
    })
  })
})
