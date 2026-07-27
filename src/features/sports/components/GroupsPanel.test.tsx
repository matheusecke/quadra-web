import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupsPanel } from './GroupsPanel'
import type { GroupMemberRow, GroupOption, GroupsPanelProps, GroupsTeamOption } from './GroupsPanel'

const GROUP_A: GroupOption = { id: 701, name: 'Grupo A' }
const GROUP_B: GroupOption = { id: 702, name: 'Grupo B' }
const groups: GroupOption[] = [GROUP_A, GROUP_B]

const enrolledTeams: GroupsTeamOption[] = [{ id: 1, name: 'Tigres' }, { id: 2, name: 'Albatrozes' }]

/** Grupo A has Tigres; Grupo B is empty; Albatrozes is unassigned. */
const members: GroupMemberRow[] = [
  { id: 901, tournamentGroupId: GROUP_A.id, tournamentTeamId: enrolledTeams[0].id, name: 'Tigres' },
]

function renderPanel(overrides: Partial<GroupsPanelProps> = {}) {
  const props: GroupsPanelProps = {
    groups,
    members,
    enrolledTeams,
    canManage: true,
    onCreateGroup: vi.fn().mockResolvedValue(undefined),
    onRenameGroup: vi.fn().mockResolvedValue(undefined),
    onRemoveGroup: vi.fn().mockResolvedValue(undefined),
    onAssign: vi.fn().mockResolvedValue(undefined),
    onRemoveMember: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  return render(<GroupsPanel {...props} />)
}

const groupASection = () => screen.getByRole('group', { name: GROUP_A.name })
const groupBSection = () => screen.getByRole('group', { name: GROUP_B.name })

describe('GroupsPanel', () => {
  it('lists each group with its teams in the order received', () => {
    renderPanel()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Grupo A', 'Grupo B'])
    expect(within(groupASection()).getByText('Tigres')).toBeInTheDocument()
  })

  it('shows explanatory text for a group with no teams', () => {
    renderPanel()
    expect(within(groupBSection()).getByText(/nenhuma equipe neste grupo/i)).toBeInTheDocument()
  })

  it('removes a team from its group', async () => {
    const onRemoveMember = vi.fn().mockResolvedValue(undefined)
    renderPanel({ onRemoveMember })
    await userEvent.click(within(groupASection()).getByRole('button', { name: /remover tigres do grupo/i }))
    expect(onRemoveMember).toHaveBeenCalledWith(901)
  })

  it('keeps the row when removing a member fails', async () => {
    const onRemoveMember = vi.fn().mockRejectedValue(new Error('nope'))
    renderPanel({ onRemoveMember })
    await userEvent.click(within(groupASection()).getByRole('button', { name: /remover tigres do grupo/i }))
    expect(within(groupASection()).getByText('Tigres')).toBeInTheDocument()
  })

  it('renames a group inline', async () => {
    const onRenameGroup = vi.fn().mockResolvedValue(undefined)
    renderPanel({ onRenameGroup })
    await userEvent.click(within(groupASection()).getByRole('button', { name: /renomear/i }))
    const nameField = screen.getByRole('textbox', { name: new RegExp(`nome do grupo ${GROUP_A.name}`, 'i') })
    await userEvent.clear(nameField)
    await userEvent.type(nameField, 'Grupo Ouro')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(onRenameGroup).toHaveBeenCalledWith(701, 'Grupo Ouro')
  })

  it('offers deletion only for a group with no teams', () => {
    renderPanel()
    expect(within(groupASection()).queryByRole('button', { name: /excluir grupo/i })).not.toBeInTheDocument()
    expect(within(groupBSection()).getByRole('button', { name: /excluir grupo/i })).toBeInTheDocument()
  })

  it('hides every write control when the viewer cannot manage', () => {
    renderPanel({ canManage: false })
    expect(screen.queryByRole('button', { name: /criar grupo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /adicionar ao grupo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /renomear/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /excluir grupo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remover tigres do grupo/i })).not.toBeInTheDocument()
    expect(screen.getByText('Tigres')).toBeInTheDocument()
  })

  it('creates a group', async () => {
    const onCreateGroup = vi.fn().mockResolvedValue(undefined)
    renderPanel({ onCreateGroup, groups: [], members: [], enrolledTeams: [] })
    await userEvent.type(screen.getByLabelText(/^nome do grupo$/i), 'Grupo A')
    await userEvent.click(screen.getByRole('button', { name: /criar grupo/i }))
    expect(onCreateGroup).toHaveBeenCalledWith('Grupo A')
  })

  it('assigns an enrolled team to a group', async () => {
    const onAssign = vi.fn().mockResolvedValue(undefined)
    renderPanel({ onAssign, groups: [GROUP_A], members: [] })
    await userEvent.click(screen.getByLabelText(/^grupo$/i))
    await userEvent.click(screen.getByRole('option', { name: 'Grupo A' }))
    await userEvent.click(screen.getByLabelText(/^equipe$/i))
    await userEvent.click(screen.getByRole('option', { name: 'Tigres' }))
    await userEvent.click(screen.getByRole('button', { name: /adicionar ao grupo/i }))
    expect(onAssign).toHaveBeenCalledWith(701, 1)
  })

  it('warns how many enrolled teams still have no group', () => {
    renderPanel()
    expect(screen.getByText(/1 equipe inscrita ainda não está em nenhum grupo/i)).toBeInTheDocument()
  })

  it('offers only unassigned teams for assignment', async () => {
    renderPanel()
    await userEvent.click(screen.getByLabelText(/^equipe$/i))
    expect(screen.queryByRole('option', { name: 'Tigres' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Albatrozes' })).toBeInTheDocument()
  })

  // Two registrations can share a display name; only the assigned id is out of the list.
  it('tells apart two enrolled teams with the same name', async () => {
    renderPanel({
      enrolledTeams: [{ id: 1, name: 'Tigres' }, { id: 2, name: 'Tigres' }],
      members: [{ id: 901, tournamentGroupId: GROUP_A.id, tournamentTeamId: 1, name: 'Tigres' }],
    })
    expect(screen.getByText(/1 equipe inscrita ainda não está em nenhum grupo/i)).toBeInTheDocument()
  })
})
