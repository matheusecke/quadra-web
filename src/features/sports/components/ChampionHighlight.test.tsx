import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChampionHighlight } from './ChampionHighlight'

describe('ChampionHighlight', () => {
  it('labels the result as champion', () => {
    render(<ChampionHighlight teamName="Time 1" />)
    expect(screen.getByText('Campeão')).toBeInTheDocument()
  })

  it('shows the champion team name', () => {
    render(<ChampionHighlight teamName="Time 1" />)
    expect(screen.getByText('Time 1')).toBeInTheDocument()
  })
})
