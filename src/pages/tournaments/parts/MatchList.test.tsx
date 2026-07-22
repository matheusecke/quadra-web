import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Match } from '../../../features/sports/types'
import { MatchList } from './MatchList'

const tournamentTeams = new Map([
  [1, { name: 'Abutres', shortName: 'ABU' }],
  [2, { name: 'Águias Douradas', shortName: 'AGD' }],
])

const finishedMatch: Match = {
  id: 101,
  tournamentId: 1,
  date: '2026-06-07T21:00:00.000Z',
  homeTournamentTeamId: 1,
  awayTournamentTeamId: 2,
  homeScore: 77,
  awayScore: 74,
  status: 'FINISHED',
  tournamentGroupId: null,
  bracketRound: { id: 1, number: 1, label: 'Oitavas de final' },
  homeLossType: null,
  awayLossType: 'NORMAL',
  scoreSource: 'PERIODS',
}

describe('MatchList', () => {
  it('renders score inside the matchup and hides statistics status labels', () => {
    render(
      <MemoryRouter>
        <MatchList matches={[finishedMatch]} tournamentTeams={tournamentTeams} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Abutres 77 - 74 Águias Douradas')).toBeInTheDocument()
    expect(screen.getByText('Oitavas de final')).toBeInTheDocument()
    expect(screen.getByText('Finalizada')).toBeInTheDocument()
    expect(screen.queryByText(/stats ok/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stats parciais/i)).not.toBeInTheDocument()
  })

  it('marks a W.O. as finished', () => {
    render(
      <MemoryRouter>
        <MatchList matches={[{ ...finishedMatch, homeScore: 20, awayScore: 0, awayLossType: 'FORFEIT', scoreSource: 'AWARDED' }]} tournamentTeams={tournamentTeams} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Finalizada')).toBeInTheDocument()
    expect(screen.getByText('W.O.')).toBeInTheDocument()
  })
})
