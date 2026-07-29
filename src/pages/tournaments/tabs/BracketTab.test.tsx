import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import type { Tournament } from '../../../features/sports/types'
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
    { id: 101, roundId: 1, position: 1, label: null, homeTeam: null, awayTeam: null, winnerTournamentTeamId: null },
  ],
}

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTeams').mockResolvedValue(GERAL_TEAMS)
  vi.spyOn(sportsApi, 'getTournamentTeams').mockImplementation(async (id) =>
    id === SEED_TOURNAMENT.GERAL ? GERAL_TOURNAMENT_TEAMS : [])
  vi.spyOn(sportsApi, 'getBracket').mockImplementation(async (id) =>
    id === SEED_TOURNAMENT.GERAL ? DEMO_BRACKET : { rounds: [], slots: [] })
})

const empty = { id: 999, name: 'Copa', format: 'KNOCKOUT', status: 'IN_PROGRESS', teamIds: [] } as unknown as Tournament
const demo = { id: 1, name: 'Geral', format: 'KNOCKOUT', status: 'IN_PROGRESS', teamIds: [] } as unknown as Tournament
const knockout = { id: 12, name: 'Copa', format: 'KNOCKOUT', status: 'IN_PROGRESS', teamIds: [] } as unknown as Tournament
const completed = { ...knockout, status: 'COMPLETED' } as Tournament
const league = { ...knockout, format: 'LEAGUE' } as Tournament

const renderTab = (tournament: Tournament) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <BracketTab tournament={tournament} />
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
      slots: [{ id: 101, roundId: 10, position: 1, label: null, homeTeam: null, awayTeam: null, winnerTournamentTeamId: null }],
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
      slots: [{ id: 101, roundId: 10, position: 1, label: null, homeTeam: null, awayTeam: null, winnerTournamentTeamId: null }],
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
})
