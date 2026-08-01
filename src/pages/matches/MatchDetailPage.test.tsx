import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MatchDetailPage } from './MatchDetailPage'
import * as sportsApi from '../../services/sportsApi'
import type { MatchDetail } from '../../features/sports/types'

vi.mock('../../features/sports/useIsOrgAdmin', () => ({ useIsOrgAdmin: () => true }))

afterEach(() => vi.restoreAllMocks())

const buildMatch = (overrides: Partial<MatchDetail> = {}): MatchDetail => ({
  id: 501,
  tournamentId: 31,
  tournamentGroupId: null,
  matchNumber: 4,
  status: 'SCHEDULED',
  scheduledAt: '2026-08-01T22:00:00.000Z',
  startedAt: null,
  endedAt: null,
  venueName: 'Quadra 1',
  bracketRound: null,
  scoreSource: null,
  homeTeam: { tournamentTeamId: 41, teamName: 'Águias', score: null, result: null, lossType: null, isWinner: null },
  awayTeam: { tournamentTeamId: 52, teamName: 'Falcões', score: null, result: null, lossType: null, isWinner: null },
  periods: [],
  playerStats: [],
  mvp: null,
  ...overrides,
})

const apiFailure = (code: string, message: string) =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    response: { data: { error: { code, message } } },
  })

const renderDetail = (matchId = '501') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/matches/${matchId}`]}>
        <Routes>
          <Route path="/matches/:matchId" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchDetailPage — read', () => {
  it('shows a not-found message for a match that does not exist', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockRejectedValue(apiFailure('RECORD_NOT_FOUND', 'Match not found'))

    renderDetail()

    expect(await screen.findByText('Partida não encontrada.')).toBeInTheDocument()
  })

  it('offers a retry on an unrelated load error', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    const getMatch = vi.spyOn(sportsApi, 'getMatch').mockRejectedValue(new Error('network down'))
    const user = userEvent.setup()

    renderDetail()
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    expect(getMatch).toHaveBeenCalledTimes(2)
  })

  it('renders the team names straight from the match sides, without a catalog lookup', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    const getTeams = vi.spyOn(sportsApi, 'getTeams')

    renderDetail()

    expect(await screen.findByText('Águias')).toBeInTheDocument()
    expect(screen.getByText('Falcões')).toBeInTheDocument()
    expect(getTeams).not.toHaveBeenCalled()
  })

  it('hides the score when either side has not been recorded', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())

    renderDetail()

    expect(await screen.findByText('× × ×')).toBeInTheDocument()
  })

  it('shows the official score once both sides are recorded', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({
      status: 'FINISHED',
      scoreSource: 'PERIODS',
      homeTeam: { tournamentTeamId: 41, teamName: 'Águias', score: 80, result: 'WIN', lossType: null, isWinner: true },
      awayTeam: { tournamentTeamId: 52, teamName: 'Falcões', score: 75, result: 'LOSS', lossType: null, isWinner: false },
    }))

    renderDetail()

    expect(await screen.findByText('80')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  it('labels a periods-sourced score as "Placar por períodos"', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ scoreSource: 'PERIODS' }))

    renderDetail()

    expect(await screen.findByText('Placar por períodos')).toBeInTheDocument()
  })

  it('labels an awarded score as "Placar atribuído"', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ scoreSource: 'AWARDED' }))

    renderDetail()

    expect(await screen.findByText('Placar atribuído')).toBeInTheDocument()
  })

  it('does not show a derived match-leaders section', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())

    renderDetail()

    await screen.findByText('Águias')
    expect(screen.queryByText(/líderes da partida/i)).not.toBeInTheDocument()
  })
})

describe('MatchDetailPage — admin actions', () => {
  it('links to the edit page', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())

    renderDetail()

    expect(await screen.findByRole('link', { name: 'Editar partida' })).toHaveAttribute('href', '/matches/501/edit')
  })

  it('offers Adiar for a scheduled match', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'SCHEDULED' }))

    renderDetail()

    expect(await screen.findByRole('button', { name: 'Adiar' })).toBeInTheDocument()
  })

  it('hides Adiar once a match is finished', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'FINISHED' }))

    renderDetail()

    await screen.findByText('Águias')
    expect(screen.queryByRole('button', { name: 'Adiar' })).not.toBeInTheDocument()
  })

  it('offers Cancelar for a postponed match', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'POSTPONED' }))

    renderDetail()

    expect(await screen.findByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('hides Cancelar once a match is finished', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'FINISHED' }))

    renderDetail()

    await screen.findByText('Águias')
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('shows Phase 9 unavailability with a disabled Lançar resultado control', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'FINISHED' }))

    renderDetail()

    expect(await screen.findByRole('button', { name: 'Lançar resultado' })).toBeDisabled()
    expect(screen.getByText('Lançamento de resultado estará disponível após a integração da Fase 9.')).toBeInTheDocument()
  })

  it('asks for inline confirmation before postponing', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'SCHEDULED' }))
    const user = userEvent.setup()

    renderDetail()
    await user.click(await screen.findByRole('button', { name: 'Adiar' }))

    expect(screen.getByRole('alertdialog')).toHaveTextContent('A partida ficará Adiada até que uma nova data seja salva.')
  })

  it('asks for inline confirmation before cancelling', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'SCHEDULED' }))
    const user = userEvent.setup()

    renderDetail()
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('alertdialog')).toHaveTextContent('A partida será cancelada e não poderá ser reativada nesta fase.')
  })

  it('disables the other action while a status mutation is in flight', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'SCHEDULED' }))
    vi.spyOn(sportsApi, 'postponeMatch').mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()

    renderDetail()
    await user.click(await screen.findByRole('button', { name: 'Adiar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar adiamento' }))

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('keeps the page and shows the returned status after a successful postpone', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'SCHEDULED' }))
    vi.spyOn(sportsApi, 'postponeMatch').mockResolvedValue(buildMatch({ status: 'POSTPONED' }))
    const user = userEvent.setup()

    renderDetail()
    await user.click(await screen.findByRole('button', { name: 'Adiar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar adiamento' }))

    expect(await screen.findByText('Adiada')).toBeInTheDocument()
  })

  it('re-reads the match and reports its current status on a stale transition', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    const getMatch = vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'SCHEDULED' }))
    const postponeMatch = vi.spyOn(sportsApi, 'postponeMatch')
      .mockRejectedValue(apiFailure('INVALID_STATUS_TRANSITION', 'Only a scheduled or live match can be postponed.'))
    const user = userEvent.setup()

    renderDetail()
    await user.click(await screen.findByRole('button', { name: 'Adiar' }))
    getMatch.mockResolvedValue(buildMatch({ status: 'FINISHED' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar adiamento' }))

    expect(await screen.findByText('A partida está com status Finalizada e não pode mais ser adiada.')).toBeInTheDocument()
    expect(postponeMatch).toHaveBeenCalledTimes(1)
  })
})
