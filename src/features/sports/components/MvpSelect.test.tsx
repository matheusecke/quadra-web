import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MvpSelect } from './MvpSelect'

const candidates = [
  { athleteId: 'a1', name: 'Rafael Moura', teamName: 'Casa' },
  { athleteId: 'a2', name: 'Diego Santos', teamName: 'Fora' },
]

describe('MvpSelect', () => {
  it('selects a candidate as MVP', async () => {
    const onChange = vi.fn()
    render(<MvpSelect candidates={candidates} value={null} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText(/mvp da partida/i), 'a2')
    expect(onChange).toHaveBeenCalledWith('a2')
  })

  it('clears the MVP selection', async () => {
    const onChange = vi.fn()
    render(<MvpSelect candidates={candidates} value="a1" onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText(/mvp da partida/i), '')
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
