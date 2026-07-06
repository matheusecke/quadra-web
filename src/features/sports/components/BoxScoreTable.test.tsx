import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoxScoreTable } from './BoxScoreTable'
import type { PlayerStatInput } from '../statistics'

const zero: PlayerStatInput = { pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, min: 0 }

describe('BoxScoreTable', () => {
  it('emits a stat change for the edited cell', async () => {
    const onStatChange = vi.fn()
    render(<BoxScoreTable roster={[{ athleteId: 'a1', name: 'R. Albuquerque', number: 7 }]} lines={{ a1: zero }} onStatChange={onStatChange} />)
    const cell = screen.getByLabelText(/r\. albuquerque.*pts/i)
    await userEvent.type(cell, '5')
    expect(onStatChange).toHaveBeenLastCalledWith('a1', 'pts', 5)
  })
  it('flags fgm greater than fga inline', () => {
    render(<BoxScoreTable roster={[{ athleteId: 'a1', name: 'R. Albuquerque', number: 7 }]} lines={{ a1: { ...zero, fgm: 9, fga: 4 } }} onStatChange={() => {}} />)
    expect(screen.getByText(/fgm não pode exceder fga/i)).toBeInTheDocument()
  })
})
