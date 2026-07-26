import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MatchSumulaPage } from './MatchSumulaPage'
import * as sportsApi from '../../services/sportsApi'
import { SEED_TOURNAMENT, seedRosterId, tournamentTeamId } from '../../features/sports/seedIds'
import type { Team, TournamentRoster, TournamentTeam } from '../../features/sports/types'

const INVERNO = SEED_TOURNAMENT.INVERNO
const homeTtId = tournamentTeamId(INVERNO, 1)
const awayTtId = tournamentTeamId(INVERNO, 2)

const TEAMS: Team[] = [
  { id: 1, name: 'Time 1', shortName: 'T01', city: 'Campinas' },
  { id: 2, name: 'Time 2', shortName: 'T02', city: 'Campinas' },
]

const TOURNAMENT_TEAMS: TournamentTeam[] = [
  { id: homeTtId, tournamentId: INVERNO, teamId: 1, displayNameSnapshot: 'Time 1', seed: null, tiebreakOrder: null, tiebreakBlockKey: null },
  { id: awayTtId, tournamentId: INVERNO, teamId: 2, displayNameSnapshot: 'Time 2', seed: null, tiebreakOrder: null, tiebreakBlockKey: null },
]

// userIds match the mock matches engine's own seeded roster (§ seedRosterEntries in
// mock-sports-data.ts) so a submitted box score's tournamentRosterId is still recognized —
// match submission stays on the mock engine until its own integration phase.
const HOME_ROSTER: TournamentRoster[] = [
  { id: seedRosterId(INVERNO, 101), tournamentId: INVERNO, tournamentTeamId: homeTtId, userId: 101, role: 'ATHLETE', jerseyNumber: 4, displayNameSnapshot: 'Rafael Moura' },
  { id: seedRosterId(INVERNO, 102), tournamentId: INVERNO, tournamentTeamId: homeTtId, userId: 102, role: 'ATHLETE', jerseyNumber: null, displayNameSnapshot: 'Diego Santos' },
  { id: seedRosterId(INVERNO, 103), tournamentId: INVERNO, tournamentTeamId: homeTtId, userId: 103, role: 'ATHLETE', jerseyNumber: 6, displayNameSnapshot: 'Felipe Oliveira' },
]

const AWAY_ROSTER: TournamentRoster[] = [
  { id: seedRosterId(INVERNO, 109), tournamentId: INVERNO, tournamentTeamId: awayTtId, userId: 109, role: 'ATHLETE', jerseyNumber: 4, displayNameSnapshot: 'Nicolas Barbosa' },
  { id: seedRosterId(INVERNO, 110), tournamentId: INVERNO, tournamentTeamId: awayTtId, userId: 110, role: 'ATHLETE', jerseyNumber: 5, displayNameSnapshot: 'Otávio Ribeiro' },
  { id: seedRosterId(INVERNO, 111), tournamentId: INVERNO, tournamentTeamId: awayTtId, userId: 111, role: 'ATHLETE', jerseyNumber: 6, displayNameSnapshot: 'Paulo Carvalho' },
]

const ROSTERS_BY_TOURNAMENT_TEAM: Record<number, TournamentRoster[]> = {
  [homeTtId]: HOME_ROSTER,
  [awayTtId]: AWAY_ROSTER,
}

beforeEach(() => {
  vi.spyOn(sportsApi, 'getTeams').mockResolvedValue(TEAMS)
  vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(TOURNAMENT_TEAMS)
  vi.spyOn(sportsApi, 'getTournamentRoster').mockImplementation(async (ttId) => ROSTERS_BY_TOURNAMENT_TEAM[ttId] ?? [])
})

const renderSumula = (matchId: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/matches/${matchId}/sumula`]}>
        <Routes>
          <Route path="/matches/:matchId/sumula" element={<MatchSumulaPage />} />
          <Route path="/matches/:matchId" element={<div>detalhe da partida</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MatchSumulaPage', () => {
  it('blocks result submission when a roster cannot be loaded', async () => {
    vi.spyOn(sportsApi, 'getTournamentRoster').mockRejectedValue(new Error('roster unavailable'))
    renderSumula('216')

    expect(await screen.findByText('Não foi possível carregar os elencos.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /finalizar partida/i })).not.toBeInTheDocument()
  })

  it('renders roster rows from the queried roster snapshot, not the athlete catalog', async () => {
    const getAthletes = vi.spyOn(sportsApi, 'getAthletes')
    renderSumula('216')
    expect(await screen.findByText('Rafael Moura')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(getAthletes).not.toHaveBeenCalled()
  })

  it('warns when total points do not match the final score', async () => {
    renderSumula('216')
    const anyPts = await screen.findAllByLabelText(/pts/i)
    await userEvent.type(anyPts[0], '5')
    await waitFor(() => expect(screen.getByText(/não confere com o placar/i)).toBeInTheDocument())
  }, 10_000)

  it('submits the result and returns to the match detail', async () => {
    renderSumula('216')
    await userEvent.click(await screen.findByRole('button', { name: /finalizar partida/i }))
    await userEvent.click(await screen.findByRole('button', { name: /confirmar/i }))
    await waitFor(() => expect(screen.getByText('detalhe da partida')).toBeInTheDocument())
  }, 10_000)

  it('disables a column from the panel and submits null for it', async () => {
    renderSumula('216')
    await userEvent.click(await screen.findByRole('button', { name: /configurar estatísticas/i }))
    await userEvent.click(screen.getByRole('switch', { name: /rebotes/i }))
    await userEvent.click(screen.getByRole('button', { name: /descartar/i }))

    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: /finalizar partida/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    await waitFor(() => expect(screen.getByText('detalhe da partida')).toBeInTheDocument())

    const detail = await sportsApi.getMatchDetail(216)
    expect([...detail!.homeStats.players, ...detail!.awayStats.players].every((player) => player.reb === null)).toBe(true)
  }, 10_000)

  it('reopens disabled columns as N/A, re-enables them, and confirms point data loss', async () => {
    renderSumula('216')
    await userEvent.click(await screen.findByRole('button', { name: /configurar estatísticas/i }))
    await userEvent.click(screen.getByRole('switch', { name: /tocos/i }))
    await userEvent.click(screen.getByRole('button', { name: /descartar e desabilitar/i }))

    await userEvent.click(screen.getByRole('button', { name: /finalizar partida/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    await waitFor(() => expect(screen.getByText('detalhe da partida')).toBeInTheDocument())

    renderSumula('216')
    await userEvent.click(await screen.findByRole('button', { name: /configurar estatísticas/i }))
    const blocksToggle = screen.getByRole('switch', { name: /tocos/i })
    expect(blocksToggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('columnheader', { name: /BLK — não acompanhada/i })).toBeInTheDocument()
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)

    await userEvent.click(blocksToggle)
    expect(blocksToggle).toHaveAttribute('aria-checked', 'true')
    const blockInputs = screen.getAllByLabelText(/— BLK$/)
    expect(blockInputs.every((input) => input.getAttribute('value') === '0')).toBe(true)
    expect(blockInputs.every((input) => !input.hasAttribute('disabled'))).toBe(true)

    const pointsInput = screen.getAllByLabelText(/— PTS$/)[0]
    await userEvent.clear(pointsInput)
    await userEvent.type(pointsInput, '5')
    await userEvent.click(screen.getByRole('switch', { name: /pontos/i }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(pointsInput).toHaveValue(5)

    await userEvent.click(screen.getByRole('switch', { name: /pontos/i }))
    await userEvent.click(screen.getByRole('button', { name: /descartar e desabilitar/i }))
    expect(screen.getByRole('columnheader', { name: /PTS — não acompanhada/i })).toBeInTheDocument()
  }, 10_000)

  it('keeps the statistic controls keyboard-accessible switches', async () => {
    renderSumula('216')
    const configButton = await screen.findByRole('button', { name: /configurar estatísticas/i })
    expect(configButton).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(configButton)
    expect(configButton).toHaveAttribute('aria-expanded', 'true')
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(9)
    switches.forEach((toggle) => expect(toggle).toHaveAttribute('aria-checked'))

    configButton.focus()
    for (const toggle of switches) {
      await userEvent.tab()
      expect(toggle).toHaveFocus()
    }
  }, 10_000)
})

describe('MatchSumulaPage — W.O.', () => {
  it('hides the súmula entirely when the match is a W.O.', async () => {
    renderSumula('216')
    await userEvent.click(await screen.findByLabelText(/como a partida terminou/i))
    await userEvent.click(screen.getByRole('option', { name: 'W.O.' }))
    await userEvent.click(screen.getByLabelText(/equipe que não compareceu/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 2' }))
    expect(screen.queryByText(/placar por período/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/mvp da partida/i)).not.toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  }, 10_000)

  it('posts the home side as forfeiting using its own tournamentTeamId, not a re-derived one', async () => {
    renderSumula('216')
    await userEvent.click(await screen.findByLabelText(/como a partida terminou/i))
    await userEvent.click(screen.getByRole('option', { name: 'W.O.' }))
    await userEvent.click(screen.getByLabelText(/equipe que não compareceu/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 1' }))
    await userEvent.click(screen.getByRole('button', { name: /finalizar partida/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    await waitFor(() => expect(screen.getByText('detalhe da partida')).toBeInTheDocument())

    const detail = await sportsApi.getMatchDetail(216)
    expect(detail!.homeLossType).toBe('FORFEIT')
  }, 10_000)
})

describe('MatchSumulaPage — abandonment', () => {
  it('warns that the official score will be assigned by the rules', async () => {
    renderSumula('216')
    await userEvent.click(await screen.findByLabelText(/como a partida terminou/i))
    await userEvent.click(screen.getByRole('option', { name: 'Abandono' }))
    await userEvent.click(screen.getByLabelText(/equipe que abandonou/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 2' }))
    expect(screen.getByText(/placar oficial será atribuído/i)).toBeInTheDocument()
  }, 10_000)
})
