import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getTournamentById } from '../../../features/sports/mock-sports-data'
import type { TournamentLeader, TournamentLeaders } from '../../../features/sports/types'
import * as sportsApi from '../../../services/sportsApi'
import { StatsTab } from './StatsTab'

const makeLeader = (
  athleteId: number,
  athleteName: string,
  tournamentTeamId: number,
  value: number,
  gamesPlayed: number,
  teamName = `Snapshot Team ${tournamentTeamId}`,
): TournamentLeader => ({
  athleteId,
  athleteName,
  tournamentTeamId,
  teamId: tournamentTeamId,
  teamName,
  value,
  gamesPlayed,
})

const topFive = [
  makeLeader(165, 'Historical Athlete', 41, 24.125, 4, 'Historical Team'),
  makeLeader(166, 'Transfer New', 43, 23, 3),
  makeLeader(166, 'Transfer Old', 42, 23, 3),
  makeLeader(168, 'Fourth Athlete', 44, 21, 2),
  makeLeader(169, 'Fifth Athlete', 45, 20, 1),
]

const leaderPayload: TournamentLeaders = {
  perGame: { ppg: topFive, rpg: [], apg: [], stg: [], bpg: [] },
  totals: {
    pts: [makeLeader(165, 'Historical Athlete', 41, 24.125, 4, 'Historical Team')],
    reb: [], ast: [], stl: [], blk: [],
  },
}

const emptyLeaders: TournamentLeaders = {
  perGame: { ppg: [], rpg: [], apg: [], stg: [], bpg: [] },
  totals: { pts: [], reb: [], ast: [], stl: [], blk: [] },
}

function renderStats() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <StatsTab tournament={getTournamentById(1)!} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTournamentLeaders').mockResolvedValue(leaderPayload)
})

afterEach(() => vi.restoreAllMocks())

describe('StatsTab', () => {
  it('keeps a pending request distinct from empty statistics', () => {
    vi.mocked(sportsApi.getTournamentLeaders)
      .mockReturnValueOnce(new Promise<TournamentLeaders>(() => undefined))
    renderStats()
    expect(screen.queryByText('Sem estatísticas disponíveis.')).not.toBeInTheDocument()
  })

  it('retries a local failure', async () => {
    vi.mocked(sportsApi.getTournamentLeaders)
      .mockRejectedValueOnce(new Error('leaders unavailable'))
      .mockResolvedValueOnce(leaderPayload)
    const user = userEvent.setup()
    renderStats()

    expect(await screen.findByText('Não foi possível carregar os líderes.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect((await screen.findAllByText('Historical Athlete')).length).toBe(2)
  })

  it('renders the tab-level empty state only when all ten lists are empty', async () => {
    vi.mocked(sportsApi.getTournamentLeaders).mockResolvedValueOnce(emptyLeaders)
    renderStats()
    expect(await screen.findByText('Sem estatísticas disponíveis.')).toBeInTheDocument()
    expect(screen.queryByTestId('leader-card')).not.toBeInTheDocument()
  })

  it('renders all ten cards, all five server rows and local partial empty states', async () => {
    renderStats()

    expect(await screen.findByRole('heading', { name: 'Médias por jogo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Totais' })).toBeInTheDocument()
    const cards = screen.getAllByTestId('leader-card')
    expect(cards).toHaveLength(10)
    expect(within(cards[0]).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Historical Athlete',
      'Transfer New',
      'Transfer Old',
      'Fourth Athlete',
      'Fifth Athlete',
    ])
    expect(screen.getAllByText('Historical Athlete')).toHaveLength(2)
    expect(screen.getAllByText('Historical Team')).toHaveLength(2)
    expect(screen.getAllByText('em 4 jogos medidos')).toHaveLength(2)
    expect(screen.getAllByText('24.125')).toHaveLength(2)
    expect(screen.getAllByText('Sem dados medidos.')).toHaveLength(8)
  })
})
