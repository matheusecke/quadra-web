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
  homeTeam: { tournamentTeamId: 41, teamId: 8, teamName: 'Águias', score: null, result: null, lossType: null, isWinner: null },
  awayTeam: { tournamentTeamId: 52, teamId: 9, teamName: 'Falcões', score: null, result: null, lossType: null, isWinner: null },
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
          <Route path="/matches/:matchId/sumula" element={<div>súmula preservada</div>} />
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
      homeTeam: { tournamentTeamId: 41, teamId: 8, teamName: 'Águias', score: 80, result: 'WIN', lossType: null, isWinner: true },
      awayTeam: { tournamentTeamId: 52, teamId: 9, teamName: 'Falcões', score: 75, result: 'LOSS', lossType: null, isWinner: false },
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

  it.each([
    ['SCHEDULED', 'link', 'Lançar resultado'],
    ['LIVE', 'link', 'Continuar súmula'],
    ['FINISHED', 'button', 'Reabrir resultado'],
  ] as const)('shows the %s scoresheet action', async (status, role, name) => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status }))

    renderDetail()

    const action = await screen.findByRole(role, { name })
    if (role === 'link') expect(action).toHaveAttribute('href', '/matches/501/sumula')
    expect(screen.queryByText(
      'Lançamento de resultado estará disponível após a integração da Fase 9.',
    )).not.toBeInTheDocument()
  })

  it.each(['POSTPONED', 'CANCELLED'] as const)(
    'shows no scoresheet action for %s',
    async (status) => {
      vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
      vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status }))

      renderDetail()

      await screen.findByText('Águias')
      expect(screen.queryByRole('link', { name: /súmula|resultado/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /reabrir resultado/i })).not.toBeInTheDocument()
    },
  )

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

  it('closes the confirmation after a stale transition so the obsolete action cannot be retried', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    const getMatch = vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'SCHEDULED' }))
    vi.spyOn(sportsApi, 'postponeMatch')
      .mockRejectedValue(apiFailure('INVALID_STATUS_TRANSITION', 'Only a scheduled or live match can be postponed.'))
    const user = userEvent.setup()

    renderDetail()
    await user.click(await screen.findByRole('button', { name: 'Adiar' }))
    getMatch.mockResolvedValue(buildMatch({ status: 'FINISHED' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar adiamento' }))
    await screen.findByText('A partida está com status Finalizada e não pode mais ser adiada.')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('asks for inline confirmation before reopening and does not write early', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'FINISHED' }))
    const reopenMatch = vi.spyOn(sportsApi, 'reopenMatch')
    renderDetail()

    await userEvent.click(await screen.findByRole('button', { name: 'Reabrir resultado' }))

    expect(screen.getByRole('alertdialog', { name: 'Confirmar reabertura' })).toHaveTextContent(
      'O placar oficial será limpo. Períodos, estatísticas e MVP serão preservados para correção.',
    )
    expect(reopenMatch).not.toHaveBeenCalled()
  })

  it('moves focus to the confirmation button when the reopen dialog opens', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'FINISHED' }))
    renderDetail()

    await userEvent.click(await screen.findByRole('button', { name: 'Reabrir resultado' }))

    expect(screen.getByRole('button', { name: 'Confirmar reabertura' })).toHaveFocus()
  })

  it('shows loading while reopen is pending', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'FINISHED' }))
    vi.spyOn(sportsApi, 'reopenMatch').mockReturnValue(new Promise<MatchDetail>(() => {}))
    renderDetail()

    await userEvent.click(await screen.findByRole('button', { name: 'Reabrir resultado' }))
    const confirm = screen.getByRole('button', { name: 'Confirmar reabertura' })
    await userEvent.click(confirm)

    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled()
  })

  it('reopens once and navigates to the preserved scoresheet on success', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'FINISHED' }))
    const reopened = buildMatch({
      status: 'LIVE',
      endedAt: null,
      startedAt: '2026-08-15T20:00:00.000Z',
      periods: [{
        periodNumber: 1,
        periodType: 'REGULAR',
        homePoints: 18,
        awayPoints: 22,
        startedAt: null,
        endedAt: null,
      }],
      playerStats: [{
        tournamentRosterId: 88,
        tournamentTeamId: 41,
        displayName: 'Ana Silva',
        pts: 18,
        fgm: null,
        fga: null,
        threeFgm: null,
        threeFga: null,
        ftm: null,
        fta: null,
        reb: null,
        ast: null,
        stl: null,
        blk: null,
        tov: null,
        pf: null,
        minutesSeconds: null,
      }],
      mvp: { tournamentRosterId: 88, displayName: 'Ana Silva' },
    })
    const reopenMatch = vi.spyOn(sportsApi, 'reopenMatch').mockResolvedValue(reopened)
    renderDetail()

    await userEvent.click(await screen.findByRole('button', { name: 'Reabrir resultado' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reabertura' }))

    expect(reopenMatch).toHaveBeenCalledOnce()
    expect(reopenMatch).toHaveBeenCalledWith(501)
    expect(await screen.findByText('súmula preservada')).toBeInTheDocument()
  })

  it('re-reads a stale reopen transition and shows the exact PT-BR error', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    const getMatch = vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(
      buildMatch({ status: 'FINISHED' }),
    )
    vi.spyOn(sportsApi, 'reopenMatch').mockRejectedValue(apiFailure(
      'INVALID_STATUS_TRANSITION',
      'Only a finished match can be reopened.',
    ))
    renderDetail()

    await userEvent.click(await screen.findByRole('button', { name: 'Reabrir resultado' }))
    getMatch.mockResolvedValue(buildMatch({ status: 'LIVE' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reabertura' }))

    expect(await screen.findByText('Somente uma partida finalizada pode ser reaberta.')).toBeInTheDocument()
    expect(getMatch).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alertdialog', { name: 'Confirmar reabertura' })).not.toBeInTheDocument()
  })

  it('retries one concurrency conflict and preserves the specific final error', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([])
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: 'FINISHED' }))
    const reopenMatch = vi.spyOn(sportsApi, 'reopenMatch').mockRejectedValue(apiFailure(
      'CONCURRENT_MODIFICATION',
      'The resource changed during this operation. Retry the request.',
    ))
    renderDetail()

    await userEvent.click(await screen.findByRole('button', { name: 'Reabrir resultado' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reabertura' }))

    expect(await screen.findByText(
      'A partida foi alterada por outra pessoa. Revise os dados atualizados e tente novamente.',
    )).toBeInTheDocument()
    expect(reopenMatch).toHaveBeenCalledTimes(2)
  })
})
