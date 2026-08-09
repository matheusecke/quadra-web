import { afterEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import axios from 'axios'
import * as sportsApi from '../../services/sportsApi'
import type { MatchDetail, Tournament, TournamentGroup, TournamentTeam } from '../../features/sports/types'
import { MatchFormPage } from './MatchFormPage'

afterEach(() => vi.restoreAllMocks())

const buildTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  id: 1,
  name: 'Copa Teste',
  seasonId: 1,
  categoryId: null,
  regulation: null,
  format: 'LEAGUE',
  status: 'IN_PROGRESS',
  startsAt: null,
  endsAt: null,
  registrationStartsAt: null,
  registrationEndsAt: null,
  isRegistrationOpen: false,
  championTournamentTeamId: null,
  enrolledTeamCount: 2,
  matchCount: 0,
  finishedMatchCount: 0,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const buildTournamentTeams = (tournamentId: number): TournamentTeam[] => [
  { id: 11, tournamentId, teamId: 1, displayNameSnapshot: 'Time 1', seed: null, tiebreakOrder: null, tiebreakBlockKey: null },
  { id: 12, tournamentId, teamId: 2, displayNameSnapshot: 'Time 2', seed: null, tiebreakOrder: null, tiebreakBlockKey: null },
]

const buildMatchDetail = (overrides: Partial<MatchDetail> = {}): MatchDetail => ({
  id: 501,
  tournamentId: 1,
  tournamentGroupId: null,
  matchNumber: 4,
  status: 'SCHEDULED',
  scheduledAt: '2026-08-01T22:00:00.000Z',
  startedAt: null,
  endedAt: null,
  venueName: 'Quadra 1',
  bracketRound: null,
  scoreSource: null,
  homeTeam: { tournamentTeamId: 11, teamId: 11, teamName: 'Time 1', score: null, result: null, lossType: null, isWinner: null },
  awayTeam: { tournamentTeamId: 12, teamId: 12, teamName: 'Time 2', score: null, result: null, lossType: null, isWinner: null },
  periods: [],
  playerStats: [],
  mvp: null,
  ...overrides,
})

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="loc">{location.search}</div>
}

const renderNew = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/matches/new']}>
        <Routes>
          <Route path="/matches/new" element={<MatchFormPage />} />
          <Route path="/matches/:matchId" element={<div>partida criada</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const renderEdit = (matchId = 501) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/matches/${matchId}/edit`]}>
        <Routes>
          <Route path="/matches/:matchId/edit" element={<MatchFormPage />} />
          <Route path="/matches/:matchId" element={<div>detalhe da partida</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const apiFailure = (code: string, message: string, data?: Record<string, string[]>) =>
  Object.assign(new axios.AxiosError('erro'), { response: { data: { error: { code, message, data } } } })

describe('MatchFormPage create', () => {
  it('creates a match sending the four required fields and null optionals', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([buildTournament()])
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    const createMatch = vi.spyOn(sportsApi, 'createMatch').mockResolvedValue(buildMatchDetail())
    renderNew()

    await userEvent.click(await screen.findByLabelText(/campeonato/i))
    await userEvent.click(await screen.findByRole('option', { name: 'Copa Teste' }))
    await userEvent.click(await screen.findByLabelText(/mandante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 1' }))
    await userEvent.click(screen.getByLabelText(/visitante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 2' }))
    fireEvent.change(screen.getByLabelText('Data e hora'), { target: { value: '01/08/2026 22:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Agendar partida' }))

    expect(createMatch).toHaveBeenCalledWith({
      tournamentId: 1,
      tournamentGroupId: null,
      matchNumber: null,
      scheduledAt: new Date('2026-08-01T22:00').toISOString(),
      venueName: null,
      homeTournamentTeamId: 11,
      awayTournamentTeamId: 12,
    })
  })

  it('trims the venue before sending it', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([buildTournament()])
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    const createMatch = vi.spyOn(sportsApi, 'createMatch').mockResolvedValue(buildMatchDetail())
    renderNew()

    await userEvent.click(await screen.findByLabelText(/campeonato/i))
    await userEvent.click(await screen.findByRole('option', { name: 'Copa Teste' }))
    await userEvent.click(await screen.findByLabelText(/mandante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 1' }))
    await userEvent.click(screen.getByLabelText(/visitante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 2' }))
    fireEvent.change(screen.getByLabelText('Data e hora'), { target: { value: '01/08/2026 22:00' } })
    await userEvent.type(screen.getByLabelText('Local'), '  Quadra 2  ')
    await userEvent.click(screen.getByRole('button', { name: 'Agendar partida' }))

    expect(createMatch).toHaveBeenCalledWith(expect.objectContaining({ venueName: 'Quadra 2' }))
  })

  it('hides the group field for a league tournament', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([buildTournament({ format: 'LEAGUE' })])
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament({ format: 'LEAGUE' }))
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    renderNew()

    await userEvent.click(await screen.findByLabelText(/campeonato/i))
    await userEvent.click(await screen.findByRole('option', { name: 'Copa Teste' }))

    expect(screen.queryByLabelText('Grupo')).not.toBeInTheDocument()
  })

  it('shows the group field for a group-stage tournament', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([buildTournament({ format: 'GROUP_STAGE' })])
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament({ format: 'GROUP_STAGE' }))
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    vi.spyOn(sportsApi, 'getGroups').mockResolvedValue([{ id: 9, tournamentId: 1, name: 'Grupo A', sortOrder: 1 } as TournamentGroup])
    renderNew()

    await userEvent.click(await screen.findByLabelText(/campeonato/i))
    await userEvent.click(await screen.findByRole('option', { name: 'Copa Teste' }))

    expect(await screen.findByLabelText('Grupo')).toBeInTheDocument()
  })

  it('blocks submit while a required field is still empty', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([buildTournament()])
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    renderNew()

    await userEvent.click(await screen.findByLabelText(/campeonato/i))
    await userEvent.click(await screen.findByRole('option', { name: 'Copa Teste' }))
    await userEvent.click(await screen.findByLabelText(/mandante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 1' }))

    expect(screen.getByRole('button', { name: 'Agendar partida' })).toBeDisabled()
  })

  it('shows an inline error on both sides and disables submit when they pick the same team', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([buildTournament()])
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    renderNew()

    await userEvent.click(await screen.findByLabelText(/campeonato/i))
    await userEvent.click(await screen.findByRole('option', { name: 'Copa Teste' }))
    await userEvent.click(await screen.findByLabelText(/mandante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 1' }))
    await userEvent.click(screen.getByLabelText(/visitante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 1' }))

    expect(screen.getAllByText('Selecione equipes diferentes.')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Agendar partida' })).toBeDisabled()
  })

  it('keeps the form and explains the refusal when the championship no longer accepts matches', async () => {
    vi.spyOn(sportsApi, 'getTournaments').mockResolvedValue([buildTournament()])
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    vi.spyOn(sportsApi, 'createMatch').mockRejectedValue(
      apiFailure('TOURNAMENT_NOT_MUTABLE', 'Matches cannot be created for a completed or cancelled tournament.'),
    )
    renderNew()

    await userEvent.click(await screen.findByLabelText(/campeonato/i))
    await userEvent.click(await screen.findByRole('option', { name: 'Copa Teste' }))
    await userEvent.click(await screen.findByLabelText(/mandante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 1' }))
    await userEvent.click(screen.getByLabelText(/visitante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 2' }))
    fireEvent.change(screen.getByLabelText('Data e hora'), { target: { value: '01/08/2026 22:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Agendar partida' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este campeonato não aceita novas partidas.')
  })
})

describe('MatchFormPage cancel', () => {
  it('returns to the championship Partidas tab when cancelling in-tournament creation', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/tournaments/2/matches/new']}>
          <Routes>
            <Route path="/tournaments/:tournamentId/matches/new" element={<MatchFormPage />} />
            <Route path="/tournaments/:tournamentId" element={<div>detalhe do campeonato</div>} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.getByText('detalhe do campeonato')).toBeInTheDocument()
    expect(screen.getByTestId('loc')).toHaveTextContent('tab=matches')
  })

  it('returns to the global matches list when cancelling standalone creation', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/matches/new']}>
          <Routes>
            <Route path="/matches/new" element={<MatchFormPage />} />
            <Route path="/matches" element={<div>lista de partidas</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.getByText('lista de partidas')).toBeInTheDocument()
  })

  it('returns to the match detail when cancelling an edit', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    renderEdit()

    await userEvent.click(await screen.findByRole('button', { name: /cancelar/i }))

    expect(screen.getByText('detalhe da partida')).toBeInTheDocument()
  })
})

describe('MatchFormPage edit', () => {
  it('prefills the form from the match detail and keeps the championship read-only', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    renderEdit()

    await waitFor(() => expect(screen.getByLabelText('Data e hora')).not.toHaveValue(''))
    expect(screen.getByLabelText(/campeonato/i)).toBeDisabled()
  })

  it('disables Salvar until a field is touched', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('sends null when a touched venue is cleared', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    const updateMatch = vi.spyOn(sportsApi, 'updateMatch').mockResolvedValue(buildMatchDetail())
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    await userEvent.clear(screen.getByLabelText('Local'))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(updateMatch).toHaveBeenCalledWith(501, { venueName: null })
  })

  it('omits an untouched field from the PATCH body', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    const updateMatch = vi.spyOn(sportsApi, 'updateMatch').mockResolvedValue(buildMatchDetail())
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    await userEvent.type(screen.getByLabelText('Local'), ' extra')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(updateMatch).toHaveBeenCalledWith(501, { venueName: 'Quadra 1 extra' })
  })

  it('sends both sides when the participants are swapped', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    const updateMatch = vi.spyOn(sportsApi, 'updateMatch').mockResolvedValue(buildMatchDetail())
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    await userEvent.click(screen.getByLabelText(/mandante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 2' }))
    await userEvent.click(screen.getByLabelText(/visitante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(updateMatch).toHaveBeenCalledWith(501, { homeTournamentTeamId: 12, awayTournamentTeamId: 11 })
  })

  it('locks participants and group but keeps number and venue editable once the match is finished', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail({ status: 'FINISHED' }))
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    expect(screen.getByLabelText(/mandante/i)).toBeDisabled()
    expect(screen.getByLabelText('Data e hora')).toBeDisabled()
    expect(screen.getByLabelText('Local')).not.toBeDisabled()
  })

  it('locks participants but keeps the date editable while the match is live', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail({ status: 'LIVE' }))
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({ rounds: [], slots: [] })
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    expect(screen.getByLabelText(/mandante/i)).toBeDisabled()
    expect(screen.getByLabelText('Data e hora')).not.toBeDisabled()
  })

  it('blocks Salvar when a touched required field is cleared', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({ rounds: [], slots: [] })
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    fireEvent.change(screen.getByLabelText('Data e hora'), { target: { value: '' } })

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('disables the participants after the API reports an existing scoresheet', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({ rounds: [], slots: [] })
    vi.spyOn(sportsApi, 'updateMatch').mockRejectedValue(
      apiFailure('MATCH_HAS_SCORESHEET', 'Participants cannot be changed after the scoresheet is recorded.'),
    )
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    await userEvent.click(screen.getByLabelText(/mandante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 2' }))
    await userEvent.click(screen.getByLabelText(/visitante/i))
    await userEvent.click(screen.getByRole('option', { name: 'Time 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await screen.findByText('Os participantes não podem ser alterados após o registro da súmula.')

    expect(screen.getByLabelText(/mandante/i)).toBeDisabled()
  })

  it('disables the group after the API reports the match belongs to the bracket', async () => {
    const groupStage = buildTournament({ format: 'GROUP_STAGE' })
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(groupStage)
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    vi.spyOn(sportsApi, 'getGroups').mockResolvedValue([{ id: 9, tournamentId: 1, name: 'Grupo A', sortOrder: 1 } as TournamentGroup])
    vi.spyOn(sportsApi, 'getBracket').mockResolvedValue({ rounds: [], slots: [] })
    vi.spyOn(sportsApi, 'updateMatch').mockRejectedValue(
      apiFailure('MATCH_IN_BRACKET', 'A match linked to a bracket slot cannot belong to a group.'),
    )
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    await userEvent.click(await screen.findByLabelText('Grupo'))
    await userEvent.click(screen.getByRole('option', { name: 'Grupo A' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await screen.findByText('Uma partida vinculada ao chaveamento não pode pertencer a um grupo.')

    expect(screen.getByLabelText('Grupo')).toBeDisabled()
  })

  it('shows the field-level message from a VALIDATION_ERROR next to the field', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(buildMatchDetail())
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    vi.spyOn(sportsApi, 'updateMatch').mockRejectedValue(
      apiFailure('VALIDATION_ERROR', 'Invalid data in request.', { venueName: ['Local muito longo.'] }),
    )
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    await userEvent.type(screen.getByLabelText('Local'), ' extra')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Local muito longo.')).toBeInTheDocument()
  })
})

describe('MatchFormPage reschedule confirmation', () => {
  const postponedMatch = buildMatchDetail({ status: 'POSTPONED' })

  it('confirms a touched postponed date before patching', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(postponedMatch)
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    const update = vi.spyOn(sportsApi, 'updateMatch').mockResolvedValue({ ...postponedMatch, status: 'SCHEDULED' })
    renderEdit()

    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))
    fireEvent.change(screen.getByLabelText('Data e hora'), { target: { value: '03/08/2026 20:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Ao salvar a data e hora, a partida voltará de Adiada para Agendada.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reagendamento' }))

    expect(update).toHaveBeenCalledWith(501, { scheduledAt: new Date('2026-08-03T20:00').toISOString() })
  })

  it('does not open the confirmation when only the venue is touched on a postponed match', async () => {
    vi.spyOn(sportsApi, 'getMatch').mockResolvedValue(postponedMatch)
    vi.spyOn(sportsApi, 'getTournament').mockResolvedValue(buildTournament())
    vi.spyOn(sportsApi, 'getTournamentTeams').mockResolvedValue(buildTournamentTeams(1))
    const update = vi.spyOn(sportsApi, 'updateMatch').mockResolvedValue(postponedMatch)
    renderEdit()
    await waitFor(() => expect(screen.getByLabelText('Local')).toHaveValue('Quadra 1'))

    await userEvent.type(screen.getByLabelText('Local'), ' extra')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(update).toHaveBeenCalledWith(501, { venueName: 'Quadra 1 extra' })
  })
})
