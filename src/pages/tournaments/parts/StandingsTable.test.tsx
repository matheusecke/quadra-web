import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StandingsTable } from './StandingsTable'
import type { StandingRow, Team } from '../../../features/sports/types'

const teams = new Map<string, Team>([
  ['A', { id: 'A', name: 'Alfa', shortName: 'ALF' }],
  ['B', { id: 'B', name: 'Beta', shortName: 'BET' }],
])

const row = (over: Partial<StandingRow>): StandingRow => ({
  position: 1, tournamentTeamId: 'tt-A', teamId: 'A', teamName: 'Alfa',
  played: 2, wins: 1, losses: 1, classificationPoints: 3,
  pointsFor: 150, pointsAgainst: 140, pointDiff: 10, winPct: 0.5,
  isTiedUnresolved: false, tieBlockKey: null, ...over,
})

describe('StandingsTable', () => {
  it('renders the rows in the order given, without re-ranking', () => {
    render(<StandingsTable rows={[row({ teamId: 'B', teamName: 'Beta', position: 1, wins: 0, classificationPoints: 2 }), row({ position: 2, wins: 5, classificationPoints: 9 })]} teams={teams} variant="full" />)
    const cells = screen.getAllByRole('row').slice(1).map((r) => r.textContent)
    expect(cells[0]).toContain('Beta')   // fewer wins, but it came first — the server ranked it
  })

  it('shows the classification-points legend', () => {
    render(<StandingsTable rows={[row({})]} teams={teams} variant="full" />)
    expect(screen.getByText(/2 vitória/i)).toBeInTheDocument()
  })

  it('renders a dash for a null position and a null win percentage', () => {
    render(<StandingsTable rows={[row({ position: null, played: 0, wins: 0, losses: 0, winPct: null })]} teams={teams} variant="full" />)
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('marks an unresolved tie with a textual chip, not only colour', () => {
    render(<StandingsTable rows={[row({ isTiedUnresolved: true, tieBlockKey: 'tt-A-tt-B' })]} teams={teams} variant="full" />)
    expect(screen.getByText(/empate/i)).toBeInTheDocument()
  })
})
