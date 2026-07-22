import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnrollTeamPanel } from './EnrollTeamPanel'

describe('EnrollTeamPanel', () => {
  it('enrolls the selected team', async () => {
    const onEnroll = vi.fn().mockResolvedValue(undefined)
    render(<EnrollTeamPanel availableTeams={[{ id: 9, name: 'Cometas' }]} onEnroll={onEnroll} />)
    await userEvent.click(screen.getByLabelText(/equipe/i))
    await userEvent.click(screen.getByRole('option', { name: 'Cometas' }))
    await userEvent.click(screen.getByRole('button', { name: /inscrever/i }))
    expect(onEnroll).toHaveBeenCalledWith(9)
  })
})
