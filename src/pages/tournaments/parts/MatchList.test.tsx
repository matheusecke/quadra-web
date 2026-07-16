import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Match, Team } from '../../../features/sports/types'
import { MatchList } from './MatchList'

const teams = new Map<string, Team>([
  ['abutres', { id: 'abutres', name: 'Abutres', shortName: 'ABU' }],
  ['aguias', { id: 'aguias', name: 'Águias Douradas', shortName: 'AGD' }],
])

const finishedMatch: Match = {
  id: 'm1',
  tournamentId: 'c1',
  date: '2026-06-07T21:00:00.000Z',
  homeTeamId: 'abutres',
  awayTeamId: 'aguias',
  homeScore: 77,
  awayScore: 74,
  status: 'FINISHED',
  statsStatus: 'COMPLETE',
  tournamentGroupId: null,
  bracketRound: { id: 'round-oitavas', number: 1, label: 'Oitavas de final' },
  homeLossType: null,
  awayLossType: 'NORMAL',
  scoreSource: 'PERIODS',
}

describe('MatchList', () => {
  it('renders score inside the matchup and hides statistics status labels', () => {
    render(
      <MemoryRouter>
        <MatchList matches={[finishedMatch]} teams={teams} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Abutres 77 - 74 Águias Douradas')).toBeInTheDocument()
    expect(screen.getByText('Oitavas de final')).toBeInTheDocument()
    expect(screen.getByText('Finalizada')).toBeInTheDocument()
    expect(screen.queryByText(/stats ok/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stats parciais/i)).not.toBeInTheDocument()
  })
})
