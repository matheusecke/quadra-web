import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Tournament, Match, Team } from '../../../features/sports/types'
import { MatchesTab } from './MatchesTab'

const teams = new Map<string, Team>([
  ['abutres', { id: 'abutres', name: 'Abutres', shortName: 'ABU' }],
  ['aguias', { id: 'aguias', name: 'Águias Douradas', shortName: 'AGD' }],
  ['linces', { id: 'linces', name: 'Linces', shortName: 'LIN' }],
  ['lobos', { id: 'lobos', name: 'Lobos do Norte', shortName: 'LOB' }],
])

const tournament: Tournament = {
  id: 'c1',
  name: 'Supercopa Nacional',
  seasonId: 'season-2025-26',
  categoryId: 'cat-adulto-masc',
  format: 'GROUP_STAGE_KNOCKOUT',
  status: 'IN_PROGRESS',
  teamIds: ['abutres', 'aguias', 'linces', 'lobos'],
  matchCount: 2,
  finishedMatchCount: 1,
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  updatedAt: '2026-06-10T12:00:00.000Z',
  regulation: 'Todos contra todos.',
  leaders: {
    ppg: [],
    rpg: [],
    apg: [],
    stg: [],
    bpg: [],
  },
  championTournamentTeamId: null,
}

const matches: Match[] = [
  {
    id: 'm1',
    tournamentId: 'c1',
    date: '2026-06-07T21:00:00.000Z',
    homeTeamId: 'abutres',
    awayTeamId: 'aguias',
    homeScore: 77,
    awayScore: 74,
    status: 'FINISHED',
    venue: 'Ginásio Central',
    tournamentGroupId: null,
    bracketRound: { id: 'round-oitavas', number: 1, label: 'Oitavas de final' },
    homeLossType: null,
    awayLossType: 'NORMAL',
    scoreSource: 'PERIODS',
  },
  {
    id: 'm2',
    tournamentId: 'c1',
    date: '2026-06-14T20:00:00.000Z',
    homeTeamId: 'linces',
    awayTeamId: 'lobos',
    homeScore: null,
    awayScore: null,
    status: 'SCHEDULED',
    venue: 'Arena Metropolitana',
    tournamentGroupId: null,
    bracketRound: { id: 'round-semi', number: 2, label: 'Semifinais' },
    homeLossType: null,
    awayLossType: null,
    scoreSource: null,
  },
]

describe('MatchesTab', () => {
  it('renders matches with inline matchup scores and no statistics status labels', () => {
    render(
      <MemoryRouter>
        <MatchesTab tournament={tournament} matches={matches} teams={teams} isOrgAdmin={false} />
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

  it('links each matchup to the match detail page', () => {
    render(
      <MemoryRouter>
        <MatchesTab tournament={tournament} matches={matches} teams={teams} isOrgAdmin={false} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Abutres 77 - 74 Águias Douradas' })).toHaveAttribute(
      'href',
      '/matches/m1',
    )
    expect(screen.getByRole('link', { name: 'Linces vs Lobos do Norte' })).toHaveAttribute('href', '/matches/m2')
  })
})

describe('MatchesTab creation action', () => {
  it('opens the scheduling form for org admins with the championship locked in', async () => {
    render(
      <MemoryRouter initialEntries={['/tournaments/c1']}>
        <Routes>
          <Route
            path="/tournaments/c1"
            element={<MatchesTab tournament={tournament} matches={matches} teams={teams} isOrgAdmin />}
          />
          <Route path="/tournaments/c1/matches/new" element={<div>formulário de nova partida</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Nova partida' }))

    expect(screen.getByText('formulário de nova partida')).toBeInTheDocument()
  })

  it('hides the creation action from non-admins', () => {
    render(
      <MemoryRouter>
        <MatchesTab tournament={tournament} matches={matches} teams={teams} isOrgAdmin={false} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Nova partida' })).not.toBeInTheDocument()
  })
})
