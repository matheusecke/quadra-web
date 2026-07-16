import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MvpSelect } from './MvpSelect'

const candidates = [
  { tournamentRosterId: 'roster-1', athleteId: 'a1', name: 'Rafael Moura', teamName: 'Casa' },
  { tournamentRosterId: 'roster-2', athleteId: 'a2', name: 'Diego Santos', teamName: 'Fora' },
]

describe('MvpSelect', () => {
  it('selects a candidate as MVP', async () => {
    const onChange = vi.fn()
    render(<MvpSelect candidates={candidates} value={null} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText(/mvp da partida/i))
    await userEvent.click(screen.getByRole('option', { name: 'Diego Santos (Fora)' }))
    expect(onChange).toHaveBeenCalledWith('roster-2')
  })

  it('clears the MVP selection', async () => {
    const onChange = vi.fn()
    render(<MvpSelect candidates={candidates} value="roster-1" onChange={onChange} />)
    await userEvent.click(screen.getByLabelText(/mvp da partida/i))
    await userEvent.click(screen.getByRole('option', { name: '— nenhum —' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
