import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MatchSumulaPage } from './MatchSumulaPage'
import * as sportsApi from '../../services/sportsApi'
import type {
  MatchPeriodInput,
  MatchPlayerStatisticInput,
} from '../../services/sportsApi'
import type {
  MatchDetail,
  MatchStatus,
  PlayerMatchStats,
  TournamentRoster,
} from '../../features/sports/types'

export const buildPlayerStat = (
  tournamentRosterId: number,
  tournamentTeamId: number,
  displayName: string,
  overrides: Partial<PlayerMatchStats> = {},
): PlayerMatchStats => ({
  tournamentRosterId,
  tournamentTeamId,
  displayName,
  pts: 0,
  fgm: 0,
  fga: 0,
  threeFgm: 0,
  threeFga: 0,
  ftm: 0,
  fta: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
  tov: 0,
  pf: 0,
  minutesSeconds: 0,
  ...overrides,
})

export const buildMatch = (overrides: Partial<MatchDetail> = {}): MatchDetail => ({
  id: 501,
  tournamentId: 12,
  tournamentGroupId: 7,
  matchNumber: 18,
  status: 'SCHEDULED',
  scheduledAt: '2026-08-15T19:30:00.000Z',
  startedAt: null,
  endedAt: null,
  venueName: 'Arena Central',
  bracketRound: null,
  scoreSource: null,
  homeTeam: {
    tournamentTeamId: 41,
    teamName: 'Engenharia',
    score: null,
    result: null,
    lossType: null,
    isWinner: null,
  },
  awayTeam: {
    tournamentTeamId: 52,
    teamName: 'Direito',
    score: null,
    result: null,
    lossType: null,
    isWinner: null,
  },
  periods: [],
  playerStats: [],
  mvp: null,
  ...overrides,
})

export const homeRoster: TournamentRoster[] = [
  {
    id: 88,
    tournamentId: 12,
    tournamentTeamId: 41,
    userId: 165,
    role: 'ATHLETE',
    jerseyNumber: 7,
    displayNameSnapshot: 'Ana Silva',
  },
  {
    id: 89,
    tournamentId: 12,
    tournamentTeamId: 41,
    userId: 190,
    role: 'COACHING_STAFF',
    jerseyNumber: null,
    displayNameSnapshot: 'Técnica da Engenharia',
  },
]

export const awayRoster: TournamentRoster[] = [
  {
    id: 91,
    tournamentId: 12,
    tournamentTeamId: 52,
    userId: 171,
    role: 'ATHLETE',
    jerseyNumber: 11,
    displayNameSnapshot: 'Bia Souza',
  },
]

const zeroMetrics = {
  pts: 0,
  fgm: 0,
  fga: 0,
  threeFgm: 0,
  threeFga: 0,
  ftm: 0,
  fta: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
  tov: 0,
  pf: 0,
  minutesSeconds: 0,
}

const zeroPeriods: MatchPeriodInput[] = [1, 2, 3, 4].map((periodNumber) => ({
  periodNumber,
  periodType: 'REGULAR',
  homePoints: 0,
  awayPoints: 0,
}))

const zeroPlayerStats: MatchPlayerStatisticInput[] = [
  { tournamentRosterId: 88, ...zeroMetrics },
  { tournamentRosterId: 91, ...zeroMetrics },
]

const apiFailure = (code: string, message: string) =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    response: { data: { error: { code, message } } },
  })

export const mockRosters = () =>
  vi.spyOn(sportsApi, 'getTournamentRoster').mockImplementation(async (tournamentTeamId) => {
    if (tournamentTeamId === 41) return homeRoster
    if (tournamentTeamId === 52) return awayRoster
    return []
  })

export const renderSumula = (matchId = '501') => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/matches/${matchId}/sumula`]}>
          <Routes>
            <Route path="/matches/:matchId/sumula" element={<MatchSumulaPage />} />
            <Route path="/matches/:matchId" element={<div>detalhe da partida</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  }
}

afterEach(() => vi.restoreAllMocks())

describe('MatchSumulaPage — loading and lifecycle', () => {
  it('rejects an invalid route id without requesting a match', () => {
    const getMatch = vi.spyOn(sportsApi, 'getMatch')

    renderSumula('abc')

    expect(screen.getByText('ID de partida inválido.')).toBeInTheDocument()
    expect(getMatch).not.toHaveBeenCalled()
  })

  it('shows an accessible loading state while the match is pending', () => {
    vi.spyOn(sportsApi, 'getMatch').mockReturnValue(new Promise<MatchDetail>(() => {}))

    renderSumula()

    expect(screen.getByRole('status', { name: 'Carregando súmula' })).toBeInTheDocument()
  })

  it('shows the specific not-found state for the exact match error', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockRejectedValue(
      apiFailure('RECORD_NOT_FOUND', 'Match not found'),
    )

    renderSumula()

    expect(await screen.findByText('Partida não encontrada.')).toBeInTheDocument()
  })

  it('retries an unrelated match load failure', async () => {
    const getMatch = vi.spyOn(sportsApi, 'getMatch').mockRejectedValue(new Error('network'))
    renderSumula()

    await userEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    expect(getMatch).toHaveBeenCalledTimes(2)
  })

  it('loads rosters only after an editable match has loaded', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    const getRoster = mockRosters()

    renderSumula()

    expect(await screen.findByRole('heading', { name: 'Súmula da partida' })).toBeInTheDocument()
    expect(getRoster).toHaveBeenCalledWith(41)
    expect(getRoster).toHaveBeenCalledWith(52)
  })

  it.each([
    ['FINISHED', 'Reabra o resultado na tela de detalhes para continuar a edição.'],
    ['POSTPONED', 'Partidas adiadas não podem ter a súmula alterada.'],
    ['CANCELLED', 'Partidas canceladas não podem ter a súmula alterada.'],
  ] as const)('blocks a %s match before roster loading', async (status, description) => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({ status: status as MatchStatus }))
    const getRoster = vi.spyOn(sportsApi, 'getTournamentRoster')

    renderSumula()

    expect(await screen.findByText(description)).toBeInTheDocument()
    expect(getRoster).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Voltar para a partida' })).toHaveAttribute(
      'href',
      '/matches/501',
    )
  })
})

describe('MatchSumulaPage — roster hydration', () => {
  it('offers a joint retry and no editor when either roster fails', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    const getRoster = vi.spyOn(sportsApi, 'getTournamentRoster').mockRejectedValue(
      new Error('roster unavailable'),
    )
    renderSumula()

    expect(await screen.findByText('Não foi possível carregar os elencos.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Súmula da partida' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(getRoster).toHaveBeenCalledTimes(4)
  })

  it('uses every ATHLETE in roster order and excludes coaching staff', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const getAthletes = vi.spyOn(sportsApi, 'getAthletes')

    renderSumula()

    expect(await screen.findByText('Ana Silva')).toBeInTheDocument()
    expect(screen.queryByText('Técnica da Engenharia')).not.toBeInTheDocument()
    expect(getAthletes).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('tab', { name: 'Direito' }))
    expect(screen.getByText('Bia Souza')).toBeInTheDocument()
  })

  it('hydrates saved periods, stats and MVP while filling missing defaults with zero', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({
      status: 'LIVE',
      startedAt: '2026-08-15T20:00:00.000Z',
      periods: [{
        periodNumber: 1,
        periodType: 'REGULAR',
        homePoints: 18,
        awayPoints: 22,
        startedAt: null,
        endedAt: null,
      }],
      playerStats: [buildPlayerStat(88, 41, 'Ana Silva', { pts: 18 })],
      mvp: { tournamentRosterId: 88, displayName: 'Ana Silva' },
    }))
    mockRosters()

    renderSumula()

    expect(await screen.findByText('Ao vivo')).toBeInTheDocument()
    expect(screen.getByLabelText('Engenharia — 1º período')).toHaveValue(18)
    expect(screen.getByLabelText('Engenharia — 2º período')).toHaveValue(0)
    expect(screen.getByLabelText('Ana Silva — PTS')).toHaveValue(18)
    expect(screen.getByLabelText('MVP da partida')).toHaveTextContent('Ana Silva (Engenharia)')
  })

  it('blocks the editor when saved stats reference an athlete absent from both rosters', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch({
      playerStats: [buildPlayerStat(999, 41, 'Atleta removido')],
    }))
    mockRosters()

    renderSumula()

    expect(await screen.findByText(
      'A súmula possui um atleta que não está disponível nos elencos.',
    )).toBeInTheDocument()
    expect(screen.queryByLabelText('Engenharia — 1º período')).not.toBeInTheDocument()
  })
})

describe('MatchSumulaPage — draft', () => {
  it('sends the complete zero-default snapshot, stays on the page and shows success', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const saveDraft = vi.spyOn(sportsApi, 'saveMatchDraft').mockResolvedValue(buildMatch({
      status: 'LIVE',
      startedAt: '2026-08-15T20:00:00.000Z',
    }))
    renderSumula()

    await userEvent.click(await screen.findByRole('button', { name: 'Salvar rascunho' }))

    await waitFor(() => expect(saveDraft).toHaveBeenCalledWith(501, {
      periods: zeroPeriods,
      playerStats: zeroPlayerStats,
      mvpTournamentRosterId: null,
    }))
    expect(await screen.findByText('Rascunho salvo.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Súmula da partida' })).toBeInTheDocument()
    expect(screen.getByText('Ao vivo')).toBeInTheDocument()
  })

  it('disables both write actions while a draft is pending', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    let resolveDraft!: (match: MatchDetail) => void
    vi.spyOn(sportsApi, 'saveMatchDraft').mockReturnValue(
      new Promise((resolve) => { resolveDraft = resolve }),
    )
    renderSumula()

    const draftButton = await screen.findByRole('button', { name: 'Salvar rascunho' })
    const resultButton = screen.getByRole('button', { name: 'Finalizar partida' })
    await userEvent.click(draftButton)

    expect(draftButton).toBeDisabled()
    expect(resultButton).toBeDisabled()

    resolveDraft(buildMatch({ status: 'LIVE' }))
    expect(await screen.findByText('Rascunho salvo.')).toBeInTheDocument()
  })

  it('blocks invalid player statistics before calling the adapter', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const saveDraft = vi.spyOn(sportsApi, 'saveMatchDraft')
    renderSumula()
    const fgm = await screen.findByLabelText('Ana Silva — FGM')

    fireEvent.change(fgm, { target: { value: '1' } })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }))

    expect(screen.getByText(
      'Corrija as estatísticas dos atletas antes de continuar.',
    )).toHaveAttribute('role', 'alert')
    expect(saveDraft).not.toHaveBeenCalled()
  })

  it('blocks two tournament registrations belonging to the same user', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    vi.spyOn(sportsApi, 'getTournamentRoster').mockImplementation(async (teamId) =>
      teamId === 41
        ? homeRoster
        : [{ ...awayRoster[0], userId: homeRoster[0].userId }],
    )
    const saveDraft = vi.spyOn(sportsApi, 'saveMatchDraft')
    renderSumula()

    await userEvent.click(await screen.findByRole('button', { name: 'Salvar rascunho' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Os elencos possuem duas inscrições pertencentes à mesma pessoa.',
    )
    expect(saveDraft).not.toHaveBeenCalled()
  })

  it('shows the exact API error and preserves edited values', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    vi.spyOn(sportsApi, 'saveMatchDraft').mockRejectedValue(
      apiFailure(
        'INVALID_MATCH_MVP',
        'The match MVP must be present in the resulting player statistics.',
      ),
    )
    renderSumula()
    const firstPeriod = await screen.findByLabelText('Engenharia — 1º período')
    fireEvent.change(firstPeriod, { target: { value: '12' } })

    await userEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O MVP precisa estar entre os atletas enviados nas estatísticas.',
    )
    expect(firstPeriod).toHaveValue(12)
  })
})

describe('MatchSumulaPage — NORMAL result and warning', () => {
  it('blocks a tied NORMAL result before opening confirmation', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const submitResult = vi.spyOn(sportsApi, 'submitMatchResult')
    renderSumula()

    await userEvent.click(await screen.findByRole('button', { name: 'Finalizar partida' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'O resultado normal não pode terminar empatado. Adicione uma prorrogação.',
    )
    expect(screen.queryByRole('alertdialog', { name: 'Confirmar resultado' })).not.toBeInTheDocument()
    expect(submitResult).not.toHaveBeenCalled()
  })

  it('lists a separate non-blocking points warning for each divergent side', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    renderSumula()
    fireEvent.change(await screen.findByLabelText('Engenharia — 1º período'), {
      target: { value: '1' },
    })

    expect(screen.getByText(
      'A soma dos pontos de Engenharia não confere com o placar por períodos.',
    )).toBeInTheDocument()
    expect(screen.queryByText(
      'A soma dos pontos de Direito não confere com o placar por períodos.',
    )).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar partida' }))
    expect(screen.getByRole('alertdialog', { name: 'Confirmar resultado' })).toBeInTheDocument()
  })

  it('submits an explicit NORMAL full snapshot and navigates only on success', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const submitResult = vi.spyOn(sportsApi, 'submitMatchResult').mockResolvedValue(
      buildMatch({ status: 'FINISHED' }),
    )
    renderSumula()
    fireEvent.change(await screen.findByLabelText('Engenharia — 1º período'), {
      target: { value: '1' },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar partida' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(submitResult).toHaveBeenCalledWith(501, {
      resultType: 'NORMAL',
      periods: [{ ...zeroPeriods[0], homePoints: 1 }, ...zeroPeriods.slice(1)],
      playerStats: zeroPlayerStats,
      mvpTournamentRosterId: null,
    }))
    expect(await screen.findByText('detalhe da partida')).toBeInTheDocument()
  })
})

const selectResultType = async (label: 'Normal' | 'Abandono' | 'W.O.') => {
  await userEvent.click(screen.getByLabelText('Tipo de resultado'))
  await userEvent.click(screen.getByRole('option', { name: label }))
}

const selectOffender = async (teamName: 'Engenharia' | 'Direito') => {
  await userEvent.click(screen.getByLabelText('Equipe infratora'))
  await userEvent.click(screen.getByRole('option', { name: teamName }))
}

describe('MatchSumulaPage — DEFAULT', () => {
  it('keeps played fields and draft available in DEFAULT mode', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    renderSumula()

    await screen.findByRole('heading', { name: 'Súmula da partida' })
    await selectResultType('Abandono')

    expect(screen.getByLabelText('Equipe infratora')).toBeInTheDocument()
    expect(screen.getByLabelText('Engenharia — 1º período')).toBeInTheDocument()
    expect(screen.getByLabelText('MVP da partida')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeInTheDocument()
  })

  it('saves a DEFAULT-screen draft without result type or offender', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const saveDraft = vi.spyOn(sportsApi, 'saveMatchDraft').mockResolvedValue(
      buildMatch({ status: 'LIVE' }),
    )
    renderSumula()
    await screen.findByRole('heading', { name: 'Súmula da partida' })
    await selectResultType('Abandono')
    await selectOffender('Direito')

    await userEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }))

    await waitFor(() => expect(saveDraft).toHaveBeenCalledWith(501, {
      periods: zeroPeriods,
      playerStats: zeroPlayerStats,
      mvpTournamentRosterId: null,
    }))
    const body = saveDraft.mock.calls[0][1]
    expect(body).not.toHaveProperty('resultType')
    expect(body).not.toHaveProperty('offendingTournamentTeamId')
  })

  it('requires an offending participant before DEFAULT confirmation', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const submitResult = vi.spyOn(sportsApi, 'submitMatchResult')
    renderSumula()
    await screen.findByRole('heading', { name: 'Súmula da partida' })
    await selectResultType('Abandono')

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar partida' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Selecione a equipe infratora.')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(submitResult).not.toHaveBeenCalled()
  })

  it('allows a tied court score and submits the complete DEFAULT body', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const submitResult = vi.spyOn(sportsApi, 'submitMatchResult').mockResolvedValue(
      buildMatch({ status: 'FINISHED', scoreSource: 'AWARDED' }),
    )
    renderSumula()
    await screen.findByRole('heading', { name: 'Súmula da partida' })
    await selectResultType('Abandono')
    await selectOffender('Direito')

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar partida' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(submitResult).toHaveBeenCalledWith(501, {
      resultType: 'DEFAULT',
      offendingTournamentTeamId: 52,
      periods: zeroPeriods,
      playerStats: zeroPlayerStats,
      mvpTournamentRosterId: null,
    }))
    expect(await screen.findByText('detalhe da partida')).toBeInTheDocument()
  })
})

describe('MatchSumulaPage — FORFEIT', () => {
  it('hides played fields, warning and draft without previewing an awarded score', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    renderSumula()
    fireEvent.change(await screen.findByLabelText('Engenharia — 1º período'), {
      target: { value: '7' },
    })
    expect(screen.getByText(
      'A soma dos pontos de Engenharia não confere com o placar por períodos.',
    )).toBeInTheDocument()

    await selectResultType('W.O.')

    expect(screen.queryByLabelText('Engenharia — 1º período')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('MVP da partida')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar rascunho' })).not.toBeInTheDocument()
    expect(screen.queryByText(/não confere com o placar por períodos/i)).not.toBeInTheDocument()
    expect(screen.getByText('Placar de quadra')).toBeInTheDocument()
    expect(screen.getByTestId('home-score')).toHaveTextContent('7')
    expect(screen.getByTestId('away-score')).toHaveTextContent('0')
    expect(screen.queryByText('20')).not.toBeInTheDocument()
  })

  it('restores untouched reducer values when returning from FORFEIT', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    renderSumula()
    fireEvent.change(await screen.findByLabelText('Engenharia — 1º período'), {
      target: { value: '7' },
    })

    await selectResultType('W.O.')
    await selectResultType('Normal')

    expect(screen.getByLabelText('Engenharia — 1º período')).toHaveValue(7)
  })

  it('requires an offending participant before FORFEIT confirmation', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const submitResult = vi.spyOn(sportsApi, 'submitMatchResult')
    renderSumula()
    await screen.findByRole('heading', { name: 'Súmula da partida' })
    await selectResultType('W.O.')

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar partida' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Selecione a equipe infratora.')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(submitResult).not.toHaveBeenCalled()
  })

  it('submits only resultType and offendingTournamentTeamId for FORFEIT', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatch())
    mockRosters()
    const submitResult = vi.spyOn(sportsApi, 'submitMatchResult').mockResolvedValue(
      buildMatch({ status: 'FINISHED', scoreSource: 'AWARDED' }),
    )
    renderSumula()
    await screen.findByRole('heading', { name: 'Súmula da partida' })
    await selectResultType('W.O.')
    await selectOffender('Engenharia')

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar partida' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(submitResult).toHaveBeenCalledWith(501, {
      resultType: 'FORFEIT',
      offendingTournamentTeamId: 41,
    }))
    expect(Object.keys(submitResult.mock.calls[0][1]).sort()).toEqual([
      'offendingTournamentTeamId',
      'resultType',
    ])
    expect(await screen.findByText('detalhe da partida')).toBeInTheDocument()
  })
})
