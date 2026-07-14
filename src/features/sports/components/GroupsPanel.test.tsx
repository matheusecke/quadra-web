import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupsPanel } from './GroupsPanel'

const enrolledTeams = [{ id: 'team-1', name: 'Tigres' }, { id: 'team-2', name: 'Albatrozes' }]

describe('GroupsPanel', () => {
  it('creates a group', async () => {
    const onCreateGroup = vi.fn().mockResolvedValue(undefined)
    render(<GroupsPanel groups={[]} enrolledTeams={[]} assignedTeamIds={[]} onCreateGroup={onCreateGroup} onAssign={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/nome do grupo/i), 'Grupo A')
    await userEvent.click(screen.getByRole('button', { name: /criar grupo/i }))
    expect(onCreateGroup).toHaveBeenCalledWith('Grupo A')
  })

  it('assigns an enrolled team to a group', async () => {
    const onAssign = vi.fn().mockResolvedValue(undefined)
    render(<GroupsPanel groups={[{ id: 'g1', name: 'Grupo A' }]} enrolledTeams={enrolledTeams} assignedTeamIds={[]} onCreateGroup={vi.fn()} onAssign={onAssign} />)
    await userEvent.selectOptions(screen.getByLabelText(/^grupo$/i), 'g1')
    await userEvent.selectOptions(screen.getByLabelText(/^equipe$/i), 'team-1')
    await userEvent.click(screen.getByRole('button', { name: /adicionar ao grupo/i }))
    expect(onAssign).toHaveBeenCalledWith('g1', 'team-1')
  })

  it('warns how many enrolled teams still have no group', () => {
    render(<GroupsPanel groups={[{ id: 'g1', name: 'Grupo A' }]} enrolledTeams={enrolledTeams} assignedTeamIds={['team-1']} onCreateGroup={vi.fn()} onAssign={vi.fn()} />)
    expect(screen.getByText(/1 equipe inscrita ainda não está em nenhum grupo/i)).toBeInTheDocument()
  })

  it('offers only unassigned teams for assignment', () => {
    render(<GroupsPanel groups={[{ id: 'g1', name: 'Grupo A' }]} enrolledTeams={enrolledTeams} assignedTeamIds={['team-1']} onCreateGroup={vi.fn()} onAssign={vi.fn()} />)
    expect(screen.queryByRole('option', { name: 'Tigres' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Albatrozes' })).toBeInTheDocument()
  })
})
