import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoxScoreTable } from './BoxScoreTable'
import type { BoxScoreTableProps } from './BoxScoreTable'
import type { PlayerStatInput } from '../statistics'

const zero: PlayerStatInput = {
  pts: 0,
  fgm: 0,
  fga: 0,
  threeFgm: 0,
  threeFga: 0,
  ftm: 0,
  fta: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
  tov: 0,
  pf: 0,
  minutesSeconds: 0,
}

function ControlledBoxScore({ onStatChange }: Pick<BoxScoreTableProps, 'onStatChange'>) {
  const [lines, setLines] = useState<Record<string, PlayerStatInput>>({ 'roster-1': zero })
  const handleStatChange: BoxScoreTableProps['onStatChange'] = (rosterId, field, value) => {
    onStatChange(rosterId, field, value)
    setLines((current) => ({
      ...current,
      [rosterId]: { ...(current[rosterId] ?? zero), [field]: value },
    }))
  }

  return (
    <BoxScoreTable
      roster={[{ tournamentRosterId: 'roster-1', name: 'R. Albuquerque', number: 7 }]}
      lines={lines}
      onStatChange={handleStatChange}
    />
  )
}

describe('BoxScoreTable', () => {
  it('emits a stat change for the edited cell', async () => {
    const onStatChange = vi.fn()
    render(<BoxScoreTable roster={[{ tournamentRosterId: 'roster-1', name: 'R. Albuquerque', number: 7 }]} lines={{ 'roster-1': zero }} onStatChange={onStatChange} />)
    const cell = screen.getByLabelText(/r\. albuquerque.*pts/i)
    await userEvent.type(cell, '5')
    expect(onStatChange).toHaveBeenLastCalledWith('roster-1', 'pts', 5)
  })
  it('flags fgm greater than fga inline', () => {
    render(<BoxScoreTable roster={[{ tournamentRosterId: 'roster-1', name: 'R. Albuquerque', number: 7 }]} lines={{ 'roster-1': { ...zero, fgm: 9, fga: 4 } }} onStatChange={() => {}} />)
    expect(screen.getByText(/fgm não pode exceder fga/i)).toBeInTheDocument()
  })

  it('keeps whole-minute editing while emitting contract seconds', async () => {
    const onStatChange = vi.fn()
    render(<ControlledBoxScore onStatChange={onStatChange} />)

    const minutes = screen.getByLabelText(/r\. albuquerque.*min/i)
    await userEvent.clear(minutes)
    await userEvent.type(minutes, '38')

    expect(onStatChange).toHaveBeenLastCalledWith('roster-1', 'minutesSeconds', 2280)
  })
})
