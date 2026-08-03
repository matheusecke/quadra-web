import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PeriodScoreEditor } from './PeriodScoreEditor'
import type { PeriodScore } from '../types'

const regularPeriods: PeriodScore[] = [
  { periodNumber: 1, type: 'REGULAR', overtimeNumber: null, homePoints: 18, awayPoints: 16 },
  { periodNumber: 2, type: 'REGULAR', overtimeNumber: null, homePoints: 20, awayPoints: 17 },
  { periodNumber: 3, type: 'REGULAR', overtimeNumber: null, homePoints: 16, awayPoints: 18 },
  { periodNumber: 4, type: 'REGULAR', overtimeNumber: null, homePoints: 18, awayPoints: 18 },
]

const renderEditor = ({
  periods = regularPeriods,
  onChange = vi.fn(),
  onAddOvertime = vi.fn(),
  onRemoveOvertime = vi.fn(),
}: Partial<ComponentProps<typeof PeriodScoreEditor>> = {}) => {
  render(
    <PeriodScoreEditor
      periods={periods}
      onChange={onChange}
      onAddOvertime={onAddOvertime}
      onRemoveOvertime={onRemoveOvertime}
      homeName="Engenharia"
      awayName="Direito"
    />,
  )
  return { onChange, onAddOvertime, onRemoveOvertime }
}

describe('PeriodScoreEditor', () => {
  it('renders four regular inputs per team and their derived totals', () => {
    renderEditor()

    expect(screen.getByLabelText('Engenharia — 1º período')).toHaveValue(18)
    expect(screen.getByLabelText('Direito — 4º período')).toHaveValue(18)
    expect(screen.getByTestId('home-total')).toHaveTextContent('72')
    expect(screen.getByTestId('away-total')).toHaveTextContent('69')
  })

  it('emits the edited value and normalizes an empty period to zero', () => {
    const onChange = vi.fn()
    renderEditor({ onChange })
    const input = screen.getByLabelText('Engenharia — 1º período')

    fireEvent.change(input, { target: { value: '20' } })
    expect(onChange).toHaveBeenLastCalledWith(0, 'home', 20)

    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(0, 'home', 0)
  })

  it('requests a new overtime from the explicit button', () => {
    const onAddOvertime = vi.fn()
    renderEditor({ onAddOvertime })

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar prorrogação' }))

    expect(onAddOvertime).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Remover prorrogação' })).not.toBeInTheDocument()
  })

  it('renders and removes only the last available overtime', () => {
    const onRemoveOvertime = vi.fn()
    renderEditor({
      periods: [
        ...regularPeriods,
        { periodNumber: 5, type: 'OVERTIME', overtimeNumber: 1, homePoints: 7, awayPoints: 5 },
      ],
      onRemoveOvertime,
    })

    expect(screen.getByText('OT')).toBeInTheDocument()
    expect(screen.getByLabelText('Engenharia — prorrogação 1')).toHaveValue(7)
    fireEvent.click(screen.getByRole('button', { name: 'Remover prorrogação' }))
    expect(onRemoveOvertime).toHaveBeenCalledOnce()
  })
})
