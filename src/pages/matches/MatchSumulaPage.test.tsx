import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MatchSumulaPage } from './MatchSumulaPage'
import * as sportsApi from '../../services/sportsApi'
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
