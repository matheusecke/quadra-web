import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeriodScoreEditor } from './PeriodScoreEditor'
import type { PeriodScore } from '../types'

const periods: PeriodScore[] = [
  { periodNumber: 1, type: 'REGULAR', overtimeNumber: null, homePoints: 18, awayPoints: 16 },
]

describe('PeriodScoreEditor', () => {
  it('emits a change when a period cell is edited', async () => {
    const onChange = vi.fn()
    render(<PeriodScoreEditor periods={periods} onChange={onChange} onAddOvertime={() => {}} onRemoveOvertime={() => {}} homeName="Casa" awayName="Fora" />)
    const input = screen.getByLabelText(/casa.*1º período/i)
    await userEvent.clear(input)
    await userEvent.type(input, '20')
    expect(onChange).toHaveBeenLastCalledWith(0, 'home', 20)
  })
  it('shows the derived total for the home row', () => {
    render(<PeriodScoreEditor periods={periods} onChange={() => {}} onAddOvertime={() => {}} onRemoveOvertime={() => {}} homeName="Casa" awayName="Fora" />)
    expect(screen.getByTestId('home-total')).toHaveTextContent('18')
  })
})
