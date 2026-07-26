import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Tournament, Match, Team } from '../../../features/sports/types'
import { MatchesTab } from './MatchesTab'

const teams = new Map<number, Team>([
  [1, { id: 1, name: 'Abutres', shortName: 'ABU' }],
  [2, { id: 2, name: 'Águias Douradas', shortName: 'AGD' }],
  [3, { id: 3, name: 'Linces', shortName: 'LIN' }],
  [4, { id: 4, name: 'Lobos do Norte', shortName: 'LOB' }],
])

const tournamentTeams = new Map([
  [1001, { name: 'Abutres', shortName: 'ABU' }],
  [1002, { name: 'Águias Douradas', shortName: 'AGD' }],
  [1003, { name: 'Linces', shortName: 'LIN' }],
  [1004, { name: 'Lobos do Norte', shortName: 'LOB' }],
])

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

const matches: Match[] = [
  {
    id: 101,
    tournamentId: 1,
    date: '2026-06-07T21:00:00.000Z',
    homeTournamentTeamId: 1001,
    awayTournamentTeamId: 1002,
    homeScore: 77,
    awayScore: 74,
    status: 'FINISHED',
    venue: 'Ginásio Central',
    tournamentGroupId: null,
    bracketRound: { id: 11, number: 1, label: 'Oitavas de final' },
    homeLossType: null,
    awayLossType: 'NORMAL',
    scoreSource: 'PERIODS',
  },
  {
    id: 102,
    tournamentId: 1,
    date: '2026-06-14T20:00:00.000Z',
    homeTournamentTeamId: 1003,
    awayTournamentTeamId: 1004,
    homeScore: null,
    awayScore: null,
    status: 'SCHEDULED',
    venue: 'Arena Metropolitana',
    tournamentGroupId: null,
    bracketRound: { id: 12, number: 2, label: 'Semifinais' },
    homeLossType: null,
    awayLossType: null,
    scoreSource: null,
  },
]

describe('MatchesTab', () => {
  it('renders matches with inline matchup scores and no statistics status labels', () => {
    render(
      <MemoryRouter>
        <MatchesTab tournament={tournament} matches={matches} teams={teams} tournamentTeams={tournamentTeams} isOrgAdmin={false} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Abutres 77 - 74 Águias Douradas')).toBeInTheDocument()
    expect(screen.getByLabelText('Linces vs Lobos do Norte')).toBeInTheDocument()

    expect(screen.queryByRole('columnheader', { name: 'Mandante' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Visitante' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Placar' })).not.toBeInTheDocument()

    const finishedRow = screen.getByLabelText('Abutres 77 - 74 Águias Douradas').closest('tr')
    expect(finishedRow).not.toBeNull()
    expect(within(finishedRow as HTMLTableRowElement).getByText('Oitavas de final')).toBeInTheDocument()
    expect(within(finishedRow as HTMLTableRowElement).getByText('Finalizada')).toBeInTheDocument()

    const dateCell = within(finishedRow as HTMLTableRowElement).getAllByRole('cell')[0]
    expect(dateCell).not.toHaveTextContent('Oitavas de final')

    const scheduledRow = screen.getByLabelText('Linces vs Lobos do Norte').closest('tr')
    expect(scheduledRow).not.toBeNull()
    expect(within(scheduledRow as HTMLTableRowElement).getByText('Agendada')).toBeInTheDocument()

    expect(screen.queryByText(/stats ok/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stats parciais/i)).not.toBeInTheDocument()
  })

  it('filters matches by the enrolled team\'s own tournamentTeamId', async () => {
    render(
      <MemoryRouter>
        <MatchesTab tournament={tournament} matches={matches} teams={teams} tournamentTeams={tournamentTeams} isOrgAdmin={false} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByLabelText('Filtrar por equipe'))
    await userEvent.click(await screen.findByRole('option', { name: 'Linces' }))

    expect(screen.getByLabelText('Linces vs Lobos do Norte')).toBeInTheDocument()
    expect(screen.queryByLabelText('Abutres 77 - 74 Águias Douradas')).not.toBeInTheDocument()
  })

  it('links each matchup to the match detail page', () => {
    render(
      <MemoryRouter>
        <MatchesTab tournament={tournament} matches={matches} teams={teams} tournamentTeams={tournamentTeams} isOrgAdmin={false} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Abutres 77 - 74 Águias Douradas' })).toHaveAttribute(
      'href',
      '/matches/101',
    )
    expect(screen.getByRole('link', { name: 'Linces vs Lobos do Norte' })).toHaveAttribute('href', '/matches/102')
  })
})

describe('MatchesTab creation action', () => {
  it('opens the scheduling form for org admins with the championship locked in', async () => {
    render(
      <MemoryRouter initialEntries={['/tournaments/1']}>
        <Routes>
          <Route
            path="/tournaments/1"
            element={<MatchesTab tournament={tournament} matches={matches} teams={teams} tournamentTeams={tournamentTeams} isOrgAdmin />}
          />
          <Route path="/tournaments/1/matches/new" element={<div>formulário de nova partida</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Nova partida' }))

    expect(screen.getByText('formulário de nova partida')).toBeInTheDocument()
  })

  it('hides the creation action from non-admins', () => {
    render(
      <MemoryRouter>
        <MatchesTab tournament={tournament} matches={matches} teams={teams} tournamentTeams={tournamentTeams} isOrgAdmin={false} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Nova partida' })).not.toBeInTheDocument()
  })
})
