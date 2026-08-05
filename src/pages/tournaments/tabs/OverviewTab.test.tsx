import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getTournamentById, getTeams } from '../../../features/sports/mock-sports-data'
import * as sportsApi from '../../../services/sportsApi'
import { OverviewTab } from './OverviewTab'
import type { MatchSummary, StandingsEnvelope, TournamentLeaders } from '../../../features/sports/types'

const teams = new Map(getTeams().map((team) => [team.id, team]))

const { isOrgAdmin } = vi.hoisted(() => ({ isOrgAdmin: { value: false } }))
vi.mock('../../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => isOrgAdmin.value }))

const groupTable = (id: number, name: string): StandingsEnvelope => ({
  group: { id, name },
  standingsState: 'EMPTY',
  pendingMatches: 0,
  rows: [],
})

const matches: MatchSummary[] = [
  {
    id: 101,
    tournamentId: 1,
    tournamentGroupId: null,
    matchNumber: null,
    status: 'FINISHED',
    scheduledAt: '2026-06-07T21:00:00.000Z',
    startedAt: null,
    endedAt: null,
    venueName: 'Ginásio Central',
    bracketRound: null,
    scoreSource: 'PERIODS',
    homeTeam: { tournamentTeamId: 1, teamName: 'Abutres', score: 77, result: 'WIN', lossType: null, isWinner: true },
    awayTeam: { tournamentTeamId: 2, teamName: 'Águias Douradas', score: 74, result: 'LOSS', lossType: 'NORMAL', isWinner: false },
  },
]

const leader = (
  athleteId: number,
  athleteName: string,
  tournamentTeamId: number,
  value: number,
  gamesPlayed: number,
) => ({
  athleteId,
  athleteName,
  tournamentTeamId,
  teamId: tournamentTeamId,
  teamName: `Snapshot Team ${tournamentTeamId}`,
  value,
  gamesPlayed,
})

const leaderPayload: TournamentLeaders = {
  perGame: {
    ppg: [
      { ...leader(165, 'Historical Athlete', 41, 24.125, 4), teamName: 'Historical Team' },
      leader(166, 'Second Athlete', 42, 22, 3),
      leader(167, 'Third Athlete', 43, 20, 2),
      leader(168, 'Fourth Athlete', 44, 18, 1),
    ],
    rpg: [leader(169, 'Rebound Athlete', 45, 12, 3)],
    apg: [],
    stg: [],
    bpg: [],
  },
  totals: { pts: [], reb: [], ast: [], stl: [], blk: [] },
}

const renderGeral = (tournament = getTournamentById(1)!, props: Partial<Parameters<typeof OverviewTab>[0]> = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <OverviewTab
          tournament={tournament}
          matches={matches}
          matchesPending={false}
          matchesError={false}
          onRetryMatches={vi.fn()}
          teams={teams}
          onSeeBracket={vi.fn()}
          {...props}
        />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTournamentLeaders').mockResolvedValue(leaderPayload)
})

afterEach(() => {
  vi.restoreAllMocks()
  isOrgAdmin.value = false
})

describe('OverviewTab', () => {
  it('renders overview sections in the required order', () => {
    renderGeral()

    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Grupos',
      'Chaveamento',
      'Líderes',
      'Partidas',
      'Regulamento',
    ])
  })

  it('shows the bracket section in a knockout', async () => {
    renderGeral({ ...getTournamentById(1)!, format: 'KNOCKOUT' })

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chaveamento' })).toBeInTheDocument())
  })

  it('shows the bracket section in a group stage followed by a knockout', async () => {
    renderGeral({ ...getTournamentById(1)!, format: 'GROUP_STAGE_KNOCKOUT' })

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chaveamento' })).toBeInTheDocument())
  })

  it('hides the bracket section in a league', () => {
    renderGeral({ ...getTournamentById(1)!, format: 'LEAGUE' })

    expect(screen.queryByRole('heading', { name: 'Chaveamento' })).not.toBeInTheDocument()
  })

  it('hides the bracket section in a group stage with no knockout', () => {
    renderGeral({ ...getTournamentById(1)!, format: 'GROUP_STAGE' })

    expect(screen.queryByRole('heading', { name: 'Chaveamento' })).not.toBeInTheDocument()
  })

  it('renders no bracket control that writes, even for an org admin', async () => {
    isOrgAdmin.value = true
    renderGeral({ ...getTournamentById(1)!, format: 'KNOCKOUT' })

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chaveamento' })).toBeInTheDocument())
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('shows one classification table per group the api returns', async () => {
    vi.spyOn(sportsApi, 'listStandings').mockResolvedValueOnce([groupTable(701, 'Grupo A'), groupTable(704, 'Grupo D')])
    renderGeral()

    await waitFor(() => expect(screen.getByText('Grupo A')).toBeInTheDocument())
    expect(screen.getByText('Grupo D')).toBeInTheDocument()
  })

  // A failed request must not read as "this tournament has no groups".
  it('says the classification failed to load instead of claiming there are no groups', async () => {
    vi.spyOn(sportsApi, 'listStandings').mockRejectedValueOnce(new Error('network down'))
    renderGeral()

    await waitFor(() => expect(screen.getByText(/não foi possível carregar a classificação/i)).toBeInTheDocument())
    expect(screen.queryByText(/grupos ainda não definidos/i)).not.toBeInTheDocument()
  })

  it('shows a matches skeleton while the tournament match collection loads', () => {
    renderGeral(getTournamentById(1)!, { matchesPending: true })

    expect(screen.queryByLabelText('Abutres 77 - 74 Águias Douradas')).not.toBeInTheDocument()
  })

  it('shows a matches error state with retry instead of an empty list', async () => {
    const onRetryMatches = vi.fn()
    renderGeral(getTournamentById(1)!, { matchesError: true, onRetryMatches })

    expect(await screen.findByText('Não foi possível carregar as partidas.')).toBeInTheDocument()
  })

  it('renders the tournament matches without a client-side resort', () => {
    renderGeral()

    expect(screen.getByLabelText('Abutres 77 - 74 Águias Douradas')).toBeInTheDocument()
  })

  it('shows an independent leaders skeleton before the request settles', () => {
    vi.mocked(sportsApi.getTournamentLeaders).mockReturnValueOnce(new Promise(() => undefined))
    renderGeral()
    const leadersSection = screen.getByRole('heading', { name: 'Líderes' }).closest('section')!
    expect(screen.queryByText('Sem líderes estatísticos ainda.')).not.toBeInTheDocument()
    expect(leadersSection.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('retries a leaders failure without refetching standings or matches', async () => {
    vi.mocked(sportsApi.getTournamentLeaders)
      .mockRejectedValueOnce(new Error('leaders unavailable'))
      .mockResolvedValueOnce(leaderPayload)
    const listStandings = vi.spyOn(sportsApi, 'listStandings').mockResolvedValue([])
    const user = userEvent.setup()
    renderGeral()

    expect(await screen.findByText('Não foi possível carregar os líderes.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Historical Athlete')).toBeInTheDocument()
    expect(listStandings).toHaveBeenCalledTimes(1)
  })

  it('shows only the first three per-game rows and preserves snapshot order and values', async () => {
    renderGeral()
    expect(await screen.findByText('Historical Athlete')).toBeInTheDocument()
    expect(screen.getByText('Historical Team')).toBeInTheDocument()
    expect(screen.getByText('24.125')).toBeInTheDocument()
    expect(screen.getByText('em 4 jogos medidos')).toBeInTheDocument()
    expect(screen.queryByText('Fourth Athlete')).not.toBeInTheDocument()
    expect(screen.getAllByText('Sem dados medidos.')).toHaveLength(3)
  })

  it('uses the section-level empty state when all five per-game lists are empty', async () => {
    vi.mocked(sportsApi.getTournamentLeaders).mockResolvedValueOnce({
      perGame: { ppg: [], rpg: [], apg: [], stg: [], bpg: [] },
      totals: { pts: [], reb: [], ast: [], stl: [], blk: [] },
    })
    renderGeral()
    expect(await screen.findByText('Sem líderes estatísticos ainda.')).toBeInTheDocument()
    expect(screen.queryByTestId('leader-card')).not.toBeInTheDocument()
  })
})
