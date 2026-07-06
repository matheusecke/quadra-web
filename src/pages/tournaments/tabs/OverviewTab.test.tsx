import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { getTournamentById, getMatchesByTournament, getTeams } from '../../../features/sports/mock-sports-data'
import { OverviewTab } from './OverviewTab'

describe('OverviewTab', () => {
  it('renders overview sections in the required order', () => {
    const tournament = getTournamentById('puc-geral-2026')
    expect(tournament).toBeDefined()

    const teams = new Map(getTeams().map((team) => [team.id, team]))
    const matches = getMatchesByTournament('puc-geral-2026')

    render(
      <MemoryRouter>
        <OverviewTab tournament={tournament!} matches={matches} teams={teams} />
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Grupos',
      'Chaveamento',
      'Líderes',
      'Partidas',
      'Regulamento',
    ])
  })
})
