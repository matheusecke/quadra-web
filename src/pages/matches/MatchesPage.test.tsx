import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as sportsApi from '../../services/sportsApi'
import type { MatchSummary } from '../../features/sports/types'
import type { PaginatedResponse } from '../../types/admin'
import { MatchesPage } from './MatchesPage'

vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => false }))

const buildMatch = (id: number): MatchSummary => ({
  id,
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
  homeTeam: { tournamentTeamId: 1, teamId: 1, teamName: 'Abutres', score: 20, result: 'WIN', lossType: null, isWinner: true },
  awayTeam: { tournamentTeamId: 2, teamId: 2, teamName: 'Águias Douradas', score: 0, result: 'LOSS', lossType: null, isWinner: false },
})

const page = (data: MatchSummary[], currentPage: number, totalPages: number): PaginatedResponse<MatchSummary> => ({
  data,
  meta: { totalItems: data.length, itemCount: data.length, itemsPerPage: 20, totalPages, currentPage },
  links: { first: '', previous: null, next: null, last: '' },
  statusCode: 200,
})

const emptyPage = () => page([], 1, 1)

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
})

afterEach(() => vi.restoreAllMocks())

function renderMatchesPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchesPage loading and error', () => {
  it('does not show the resolved empty state while the first page is still pending', async () => {
    let resolvePage: ((value: PaginatedResponse<MatchSummary>) => void) | undefined
    vi.spyOn(sportsApi, 'listMatchesPage').mockImplementation(
      () => new Promise((resolve) => { resolvePage = resolve }),
    )
    renderMatchesPage()

    expect(screen.queryByText('Nenhuma partida agendada.')).not.toBeInTheDocument()

    resolvePage!(emptyPage())
    expect(await screen.findByText('Nenhuma partida agendada.')).toBeInTheDocument()
  })

  it('shows an error state with a retry action when the request fails', async () => {
    const listMatchesPage = vi.spyOn(sportsApi, 'listMatchesPage').mockRejectedValue(new Error('network down'))
    renderMatchesPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    expect(listMatchesPage).toHaveBeenCalledTimes(2)
  })
})

describe('MatchesPage empty states', () => {
  it('shows "Nenhuma partida agendada." when there are no matches and no filters', async () => {
    vi.spyOn(sportsApi, 'listMatchesPage').mockResolvedValue(emptyPage())
    renderMatchesPage()

    expect(await screen.findByText('Nenhuma partida agendada.')).toBeInTheDocument()
  })

  it('shows "Nenhuma partida encontrada com os filtros atuais." when a filter narrows the result to zero', async () => {
    vi.spyOn(sportsApi, 'listMatchesPage').mockResolvedValue(emptyPage())
    renderMatchesPage()
    await screen.findByText('Nenhuma partida agendada.')

    await userEvent.click(screen.getByRole('button', { name: 'Filtrar por status' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Finalizada' }))

    expect(await screen.findByText('Nenhuma partida encontrada com os filtros atuais.')).toBeInTheDocument()
  })
})

describe('MatchesPage filters reaching the adapter', () => {
  it('debounces the search field before sending the trimmed query', async () => {
    const listMatchesPage = vi.spyOn(sportsApi, 'listMatchesPage').mockResolvedValue(emptyPage())
    renderMatchesPage()
    await screen.findByText('Nenhuma partida agendada.')

    await userEvent.type(screen.getByLabelText('Buscar partida por equipe'), 'Águias')

    await waitFor(() => expect(listMatchesPage).toHaveBeenLastCalledWith({ q: 'Águias', page: 1, limit: 20 }))
  })

  it('sends q: undefined immediately when the search is cleared, without waiting for the debounce', async () => {
    const listMatchesPage = vi.spyOn(sportsApi, 'listMatchesPage').mockResolvedValue(emptyPage())
    renderMatchesPage()
    await screen.findByText('Nenhuma partida agendada.')
    await userEvent.type(screen.getByLabelText('Buscar partida por equipe'), 'Águias')
    await waitFor(() => expect(listMatchesPage).toHaveBeenLastCalledWith({ q: 'Águias', page: 1, limit: 20 }))

    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca' }))

    await waitFor(
      () => expect(listMatchesPage).toHaveBeenLastCalledWith({ q: undefined, page: 1, limit: 20 }),
      { timeout: 100 },
    )
  })

  it('sends the selected status filter to the adapter', async () => {
    const listMatchesPage = vi.spyOn(sportsApi, 'listMatchesPage').mockResolvedValue(emptyPage())
    renderMatchesPage()
    await screen.findByText('Nenhuma partida agendada.')

    await userEvent.click(screen.getByRole('button', { name: 'Filtrar por status' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Finalizada' }))

    await waitFor(() => expect(listMatchesPage).toHaveBeenLastCalledWith({ status: 'FINISHED', page: 1, limit: 20 }))
  })

  it('sends the selected tournament filter to the adapter', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([
      { id: 7, name: 'Copa Teste', seasonId: 1, categoryId: null, regulation: null, format: 'LEAGUE', status: 'IN_PROGRESS', startsAt: null, endsAt: null, registrationStartsAt: null, registrationEndsAt: null, isRegistrationOpen: false, championTournamentTeamId: null, enrolledTeamCount: 0, matchCount: 0, finishedMatchCount: 0, updatedAt: '2026-01-01T00:00:00.000Z' },
    ])
    const listMatchesPage = vi.spyOn(sportsApi, 'listMatchesPage').mockResolvedValue(emptyPage())
    renderMatchesPage()
    await screen.findByText('Nenhuma partida agendada.')

    await userEvent.click(screen.getByRole('button', { name: 'Filtrar por campeonato' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Copa Teste' }))

    await waitFor(() => expect(listMatchesPage).toHaveBeenLastCalledWith({ tournamentId: 7, page: 1, limit: 20 }))
  })
})

describe('MatchesPage pagination', () => {
  it('requests page two when "Carregar mais" is clicked', async () => {
    const listMatchesPage = vi.spyOn(sportsApi, 'listMatchesPage')
      .mockResolvedValueOnce(page([buildMatch(101)], 1, 2))
      .mockResolvedValueOnce(page([buildMatch(102)], 2, 2))
    renderMatchesPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Carregar mais' }))

    expect(listMatchesPage).toHaveBeenLastCalledWith({ page: 2, limit: 20 })
  })
})

describe('MatchesPage matchup rendering', () => {
  it('renders the matchup from the embedded team names, without querying any catalog', async () => {
    const getTeams = vi.spyOn(sportsApi, 'getTeams')
    const getAllTournamentTeams = vi.spyOn(sportsApi, 'getAllTournamentTeams')
    vi.spyOn(sportsApi, 'listMatchesPage').mockResolvedValue(page([buildMatch(101)], 1, 1))
    renderMatchesPage()

    expect(await screen.findByText('Abutres')).toBeInTheDocument()
    expect(screen.getByText('Águias Douradas')).toBeInTheDocument()
    expect(getTeams).not.toHaveBeenCalled()
    expect(getAllTournamentTeams).not.toHaveBeenCalled()
  })
})
