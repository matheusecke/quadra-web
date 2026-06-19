import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { getChampionshipById, getMatchesByChampionship, getTeams } from '../../../features/sports/mockSportsData'
import { OverviewTab } from './OverviewTab'

describe('OverviewTab', () => {
  it('renders overview sections in the required order', () => {
    const championship = getChampionshipById('puc-geral-2026')
    expect(championship).toBeDefined()

    const teams = new Map(getTeams().map((team) => [team.id, team]))
    const matches = getMatchesByChampionship('puc-geral-2026')

    render(
      <MemoryRouter>
        <OverviewTab championship={championship!} matches={matches} teams={teams} />
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
