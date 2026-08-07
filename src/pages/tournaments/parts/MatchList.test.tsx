import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { MatchSummary } from '../../../features/sports/types'
import { MatchList } from './MatchList'

const finishedMatch: MatchSummary = {
  id: 101,
  tournamentId: 1,
  tournamentGroupId: null,
  matchNumber: null,
  status: 'FINISHED',
  scheduledAt: '2026-06-07T21:00:00.000Z',
  startedAt: null,
  endedAt: null,
  venueName: 'Ginásio Central',
  bracketRound: { id: 1, number: 1, label: 'Oitavas de final' },
  scoreSource: 'PERIODS',
  homeTeam: { tournamentTeamId: 1, teamName: 'Abutres', score: 77, result: 'WIN', lossType: null, isWinner: true },
  awayTeam: { tournamentTeamId: 2, teamName: 'Águias Douradas', score: 74, result: 'LOSS', lossType: 'NORMAL', isWinner: false },
}

describe('MatchList', () => {
  it('renders score inside the matchup and hides statistics status labels', () => {
    render(
      <MemoryRouter>
        <MatchList matches={[finishedMatch]} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Abutres 77 - 74 Águias Douradas')).toBeInTheDocument()
    expect(screen.getByText('Oitavas de final')).toBeInTheDocument()
    expect(screen.getByText('Finalizada')).toBeInTheDocument()
    expect(screen.queryByText(/stats ok/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stats parciais/i)).not.toBeInTheDocument()
  })

  it('marks a W.O. as finished', () => {
    const woMatch: MatchSummary = {
      ...finishedMatch,
      homeTeam: { ...finishedMatch.homeTeam, score: 20 },
      awayTeam: { ...finishedMatch.awayTeam, score: 0, lossType: 'FORFEIT' },
      scoreSource: 'AWARDED',
    }
    render(
      <MemoryRouter>
        <MatchList matches={[woMatch]} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Finalizada')).toBeInTheDocument()
    expect(screen.getByText('W.O.')).toBeInTheDocument()
  })

  it('hides the score block when a side has not been scored', () => {
    const pendingMatch: MatchSummary = {
      ...finishedMatch,
      status: 'SCHEDULED',
      scoreSource: null,
      homeTeam: { ...finishedMatch.homeTeam, score: null, result: null, isWinner: null },
      awayTeam: { ...finishedMatch.awayTeam, score: null, result: null, isWinner: null },
    }
    render(
      <MemoryRouter>
        <MatchList matches={[pendingMatch]} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Abutres vs Águias Douradas')).toBeInTheDocument()
  })
})
