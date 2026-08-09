import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as sportsApi from '../../../services/sportsApi'
import { groupKeys } from '../../../features/sports/queries'
import type { MatchSummary, Tournament } from '../../../features/sports/types'
import type { PaginatedResponse } from '../../../types/admin'
import { MatchesTab } from './MatchesTab'

const tournament: Tournament = {
  id: 1,
  name: 'Supercopa Nacional',
  seasonId: 1,
  categoryId: 2,
  regulation: 'Todos contra todos.',
  format: 'GROUP_STAGE_KNOCKOUT',
  status: 'IN_PROGRESS',
  startsAt: '2026-06-01T00:00:00.000Z',
  endsAt: '2026-06-30T00:00:00.000Z',
  registrationStartsAt: null,
  registrationEndsAt: null,
  isRegistrationOpen: false,
  championTournamentTeamId: null,
  enrolledTeamCount: 4,
  matchCount: 2,
  finishedMatchCount: 1,
  updatedAt: '2026-06-10T12:00:00.000Z',
}

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
    bracketRound: { id: 11, number: 1, label: 'Oitavas de final' },
    scoreSource: 'PERIODS',
    homeTeam: { tournamentTeamId: 1001, teamId: 1, teamName: 'Abutres', score: 77, result: 'WIN', lossType: null, isWinner: true },
    awayTeam: { tournamentTeamId: 1002, teamId: 2, teamName: 'Águias Douradas', score: 74, result: 'LOSS', lossType: 'NORMAL', isWinner: false },
  },
  {
    id: 102,
    tournamentId: 1,
    tournamentGroupId: null,
    matchNumber: null,
    status: 'SCHEDULED',
    scheduledAt: '2026-06-14T20:00:00.000Z',
    startedAt: null,
    endedAt: null,
    venueName: 'Arena Metropolitana',
    bracketRound: { id: 12, number: 2, label: 'Semifinais' },
    scoreSource: null,
    homeTeam: { tournamentTeamId: 1003, teamId: 3, teamName: 'Linces', score: null, result: null, lossType: null, isWinner: null },
    awayTeam: { tournamentTeamId: 1004, teamId: 4, teamName: 'Lobos do Norte', score: null, result: null, lossType: null, isWinner: null },
  },
]

const nextPageMatch: MatchSummary = { ...matches[1], id: 103, homeTeam: { ...matches[1].homeTeam, teamName: 'Tubarões' }, awayTeam: { ...matches[1].awayTeam, teamName: 'Tigres' } }

const page = (data: MatchSummary[], currentPage: number, totalPages: number): PaginatedResponse<MatchSummary> => ({
  data,
  meta: { totalItems: data.length, itemCount: data.length, itemsPerPage: 20, totalPages, currentPage },
  links: { first: '', previous: null, next: null, last: '' },
  statusCode: 200,
})

// Team 1005 and group 302 have no scheduled match: they only show up in the combos
// because the options come from the catalogs, not from the loaded matches.
const tournamentTeams = [1001, 1002, 1003, 1004, 1005].map((id, index) => ({
  id,
  tournamentId: 1,
  teamId: index + 1,
  displayNameSnapshot: ['Abutres', 'Águias Douradas', 'Linces', 'Lobos do Norte', 'Reservas FC'][index],
  seed: null,
  tiebreakOrder: null,
  tiebreakBlockKey: null,
}))

const groups = [
  { id: 301, tournamentId: 1, name: 'Grupo A', sortOrder: 1 },
  { id: 302, tournamentId: 1, name: 'Grupo B', sortOrder: 2 },
]

const bracket = {
  rounds: [
    { id: 11, tournamentId: 1, number: 1, label: 'Oitavas de final' },
    { id: 12, tournamentId: 1, number: 2, label: 'Semifinais' },
  ],
  slots: [],
}

const renderTab = (props: Partial<Parameters<typeof MatchesTab>[0]> = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <MatchesTab tournament={tournament} isOrgAdmin={false} {...props} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.spyOn(sportsApi, 'listMatchesPage').mockResolvedValue(page(matches, 1, 1))
  vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(tournamentTeams)
  vi.spyOn(sportsApi, 'getGroups').mockResolvedValue(groups)
  vi.spyOn(sportsApi, 'getBracket').mockResolvedValue(bracket)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MatchesTab', () => {
  it('renders the page the server returned, with inline matchup scores', async () => {
    renderTab()

    expect(await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')).toBeInTheDocument()
    expect(screen.getByLabelText('Linces vs Lobos do Norte')).toBeInTheDocument()

    const finishedRow = screen.getByLabelText('Abutres 77 - 74 Águias Douradas').closest('tr') as HTMLTableRowElement
    expect(within(finishedRow).getByText('Oitavas de final')).toBeInTheDocument()
    expect(within(finishedRow).getByText('Finalizada')).toBeInTheDocument()
  })

  it('scopes every request to the tournament', async () => {
    renderTab()

    await waitFor(() =>
      expect(sportsApi.listMatchesPage).toHaveBeenCalledWith(expect.objectContaining({ tournamentId: 1, page: 1, limit: 20 })),
    )
  })

  it('links each matchup to the match detail page', async () => {
    renderTab()

    expect(await screen.findByRole('link', { name: 'Abutres 77 - 74 Águias Douradas' })).toHaveAttribute('href', '/matches/101')
    expect(screen.getByRole('link', { name: 'Linces vs Lobos do Norte' })).toHaveAttribute('href', '/matches/102')
  })

  it('sends the team filter to the server instead of filtering in memory', async () => {
    renderTab()
    await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')

    await userEvent.click(screen.getByLabelText('Filtrar por equipe'))
    await userEvent.click(await screen.findByRole('option', { name: 'Linces' }))

    await waitFor(() =>
      expect(sportsApi.listMatchesPage).toHaveBeenCalledWith(expect.objectContaining({ tournamentTeamIds: [1003] })),
    )
  })

  it('sends the status filter to the server', async () => {
    renderTab()
    await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')

    await userEvent.click(screen.getByLabelText('Filtrar por status'))
    await userEvent.click(await screen.findByRole('option', { name: 'Finalizada' }))

    await waitFor(() =>
      expect(sportsApi.listMatchesPage).toHaveBeenCalledWith(expect.objectContaining({ status: 'FINISHED' })),
    )
  })

  it('spans every group when the group stage is picked as the phase', async () => {
    renderTab()
    await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')

    await userEvent.click(screen.getByLabelText('Filtrar por fase'))
    await userEvent.click(await screen.findByRole('option', { name: 'Fase de grupos' }))

    await waitFor(() =>
      expect(sportsApi.listMatchesPage).toHaveBeenCalledWith(expect.objectContaining({ tournamentGroupIds: [301, 302] })),
    )
  })

  it('drops the group filter instead of widening the list when the group option disappears', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <MatchesTab tournament={tournament} isOrgAdmin={false} />
        </QueryClientProvider>
      </MemoryRouter>,
    )
    await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')

    await userEvent.click(screen.getByLabelText('Filtrar por fase'))
    await userEvent.click(await screen.findByRole('option', { name: 'Fase de grupos' }))
    await waitFor(() =>
      expect(sportsApi.listMatchesPage).toHaveBeenCalledWith(expect.objectContaining({ tournamentGroupIds: [301, 302] })),
    )

    // Simulate the tournament's last group being deleted elsewhere: the groups query refetches to empty.
    vi.mocked(sportsApi.getGroups).mockResolvedValue([])
    await client.refetchQueries({ queryKey: groupKeys.list(tournament.id) })

    await waitFor(() => {
      const lastCall = vi.mocked(sportsApi.listMatchesPage).mock.calls.at(-1)?.[0]
      expect(lastCall?.tournamentGroupIds).toBeUndefined()
    })
    expect(screen.getByLabelText('Filtrar por fase').textContent).toBe('Fase')
  })

  it('sends a single round id when a bracket round is picked as the phase', async () => {
    renderTab()
    await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')

    await userEvent.click(screen.getByLabelText('Filtrar por fase'))
    await userEvent.click(await screen.findByRole('option', { name: 'Semifinais' }))

    await waitFor(() =>
      expect(sportsApi.listMatchesPage).toHaveBeenCalledWith(expect.objectContaining({ bracketRoundIds: [12] })),
    )
  })

  it('offers filter options for entries with no scheduled match', async () => {
    renderTab()
    await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')

    await userEvent.click(screen.getByLabelText('Filtrar por equipe'))
    expect(await screen.findByRole('option', { name: 'Reservas FC' })).toBeInTheDocument()
  })

  it('sends the search only after the typing stops', async () => {
    renderTab()
    await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')

    await userEvent.type(screen.getByLabelText('Buscar partida por equipe'), 'Lin')

    expect(sportsApi.listMatchesPage).not.toHaveBeenCalledWith(expect.objectContaining({ q: 'Lin' }))
    await waitFor(() => expect(sportsApi.listMatchesPage).toHaveBeenCalledWith(expect.objectContaining({ q: 'Lin' })))
  })

  it('appends the next page and drops the control on the last one', async () => {
    vi.mocked(sportsApi.listMatchesPage)
      .mockResolvedValueOnce(page([matches[0]], 1, 2))
      .mockResolvedValueOnce(page([nextPageMatch], 2, 2))
    renderTab()

    await userEvent.click(await screen.findByRole('button', { name: 'Carregar mais' }))

    expect(await screen.findByLabelText('Tubarões vs Tigres')).toBeInTheDocument()
    expect(screen.getByLabelText('Abutres 77 - 74 Águias Douradas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })

  it('offers no load control when the first page is already the last', async () => {
    renderTab()

    await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })

  it('does not blame the filters when the championship simply has no matches', async () => {
    vi.mocked(sportsApi.listMatchesPage).mockResolvedValue(page([], 1, 1))
    renderTab()

    expect(await screen.findByText('Nenhuma partida agendada.')).toBeInTheDocument()
  })

  it('points at the filters when they are what hid every match', async () => {
    renderTab()
    await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')
    vi.mocked(sportsApi.listMatchesPage).mockResolvedValue(page([], 1, 1))

    await userEvent.type(screen.getByLabelText('Buscar partida por equipe'), 'zzz')

    expect(await screen.findByText('Nenhuma partida encontrada com os filtros atuais.')).toBeInTheDocument()
    expect(screen.getByText('Ajuste os filtros para ver outras partidas.')).toBeInTheDocument()
  })

  it('shows a skeleton while the first page loads', () => {
    vi.mocked(sportsApi.listMatchesPage).mockReturnValue(new Promise(() => undefined))
    renderTab()

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('keeps the filters usable while a filtered request is in flight', () => {
    vi.mocked(sportsApi.listMatchesPage).mockReturnValue(new Promise(() => undefined))
    renderTab()

    expect(screen.getByLabelText('Buscar partida por equipe')).toBeInTheDocument()
  })

  it('shows an error state with retry when the matches fail to load', async () => {
    vi.mocked(sportsApi.listMatchesPage).mockRejectedValue(new Error('matches unavailable'))
    renderTab()

    expect(await screen.findByText('Não foi possível carregar as partidas.')).toBeInTheDocument()

    vi.mocked(sportsApi.listMatchesPage).mockResolvedValue(page(matches, 1, 1))
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByLabelText('Abutres 77 - 74 Águias Douradas')).toBeInTheDocument()
  })
})

describe('MatchesTab creation action', () => {
  it('opens the scheduling form for org admins with the championship locked in', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <MemoryRouter initialEntries={['/tournaments/1']}>
        <QueryClientProvider client={client}>
          <Routes>
            <Route path="/tournaments/1" element={<MatchesTab tournament={tournament} isOrgAdmin />} />
            <Route path="/tournaments/1/matches/new" element={<div>formulário de nova partida</div>} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Nova partida' }))

    expect(screen.getByText('formulário de nova partida')).toBeInTheDocument()
  })

  it('hides the creation action from non-admins', () => {
    renderTab()

    expect(screen.queryByRole('button', { name: 'Nova partida' })).not.toBeInTheDocument()
  })
})
