import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ChampionHighlight } from './ChampionHighlight'

describe('ChampionHighlight', () => {
  it('labels the result as champion', () => {
    render(
      <MemoryRouter>
        <ChampionHighlight teamName="Time 1" teamId={1} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Campeão')).toBeInTheDocument()
  })

  it('shows the champion team name', () => {
    render(
      <MemoryRouter>
        <ChampionHighlight teamName="Time 1" teamId={1} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Time 1')).toBeInTheDocument()
  })

  it('links the champion to its team profile', () => {
    render(
      <MemoryRouter>
        <ChampionHighlight teamName="Engenharia PUC" teamId={8} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Engenharia PUC' })).toHaveAttribute('href', '/teams/8')
  })

  it('renders an unresolvable champion as plain text', () => {
    render(
      <MemoryRouter>
        <ChampionHighlight teamName="Engenharia PUC" teamId={null} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
