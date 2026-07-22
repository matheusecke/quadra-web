import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompleteTournamentPanel } from './CompleteTournamentPanel'

const teams = [{ tournamentTeamId: 1, name: 'Alfa', shortName: 'ALF' }, { tournamentTeamId: 2, name: 'Beta', shortName: 'BET' }]

describe('CompleteTournamentPanel', () => {
  it('starts on the suggestion and completes with the selected champion', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined)
    render(<CompleteTournamentPanel teams={teams} suggestion={1} requiresChampion onComplete={onComplete} onCancel={vi.fn()} />)
    expect(screen.getByText('Alfa')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /confirmar encerramento/i }))
    expect(onComplete).toHaveBeenCalledWith(1)
  })
})
