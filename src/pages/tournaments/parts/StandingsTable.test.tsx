import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StandingsTable } from './StandingsTable'
import type { StandingRow, Team } from '../../../features/sports/types'

const teams = new Map<number, Team>([
  [1, { id: 1, name: 'Alfa', shortName: 'ALF' }],
  [2, { id: 2, name: 'Beta', shortName: 'BET' }],
])

const row = (over: Partial<StandingRow>): StandingRow => ({
  position: 1, tournamentTeamId: 101, teamId: 1, teamName: 'Alfa',
  played: 2, wins: 1, losses: 1, classificationPoints: 3,
  pointsFor: 150, pointsAgainst: 140, pointDiff: 10, winPct: 0.5,
  isTiedUnresolved: false, tieBlockKey: null, ...over,
})

describe('StandingsTable', () => {
  it('renders the rows in the order given, without re-ranking', () => {
    render(
      <MemoryRouter>
        <StandingsTable rows={[row({ teamId: 2, teamName: 'Beta', position: 1, wins: 0, classificationPoints: 2 }), row({ position: 2, wins: 5, classificationPoints: 9 })]} teams={teams} variant="full" />
      </MemoryRouter>,
    )
    const cells = screen.getAllByRole('row').slice(1).map((r) => r.textContent)
    expect(cells[0]).toContain('Beta')   // fewer wins, but it came first — the server ranked it
  })

  it('shows the classification-points legend', () => {
    render(
      <MemoryRouter>
        <StandingsTable rows={[row({})]} teams={teams} variant="full" />
      </MemoryRouter>,
    )
    expect(screen.getByText(/2 vitória/i)).toBeInTheDocument()
  })

  it('renders a dash for a null position and a null win percentage', () => {
    render(
      <MemoryRouter>
        <StandingsTable rows={[row({ position: null, played: 0, wins: 0, losses: 0, winPct: null })]} teams={teams} variant="full" />
      </MemoryRouter>,
    )
    const cells = screen.getAllByRole('row')[1].querySelectorAll('td')
    expect(cells[0]).toHaveTextContent('—')                      // position
    expect(cells[cells.length - 1]).toHaveTextContent('—')       // win percentage — never .000
  })

  it('marks an unresolved tie with a textual chip, not only colour', () => {
    render(
      <MemoryRouter>
        <StandingsTable rows={[row({ isTiedUnresolved: true, tieBlockKey: '101-102' })]} teams={teams} variant="full" />
      </MemoryRouter>,
    )
    expect(screen.getByText(/empate/i)).toBeInTheDocument()
  })

  it('links the team name to its team profile', () => {
    render(
      <MemoryRouter>
        <StandingsTable rows={[row({})]} teams={teams} variant="full" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '/teams/1')
  })

  it('links a team that is missing from the catalog using its snapshot label', () => {
    render(
      <MemoryRouter>
        <StandingsTable rows={[row({ teamId: 7, teamName: 'Equipe Removida' })]} teams={teams} variant="full" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Equipe Removida' })).toHaveAttribute('href', '/teams/7')
  })
})
