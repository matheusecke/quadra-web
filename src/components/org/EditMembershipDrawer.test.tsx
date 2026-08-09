import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditMembershipDrawer } from './EditMembershipDrawer'
import type { OrgUserAffiliation } from '../../types/org'

const updateMembershipMock = vi.fn()

vi.mock('../../services/orgApi', () => ({
  updateMembership: (...args: unknown[]) => updateMembershipMock(...args),
}))

const athlete: OrgUserAffiliation = {
  id: 77,
  userId: 12,
  user: { id: 12, name: 'Ana Costa', email: 'ana@liga.test' },
  organizationId: 42,
  role: 'ATHLETE',
  teamId: 8,
  team: { id: 8, name: 'Tigres' },
  jerseyNumber: 23,
  position: 'PG',
  status: 'ACTIVE',
  inviteExpiresAt: null,
  isInviteExpired: false,
  canManage: true,
  createdByUserId: 9,
  createdAt: '2026-06-01T12:00:00.000Z',
  updatedAt: '2026-06-01T12:00:00.000Z',
}

const onClose = vi.fn()

function renderDrawer(overrides: Partial<OrgUserAffiliation> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <EditMembershipDrawer affiliation={{ ...athlete, ...overrides }} open onClose={onClose} />
    </QueryClientProvider>,
  )
}

describe('EditMembershipDrawer', () => {
  beforeEach(() => {
    onClose.mockReset()
    updateMembershipMock.mockReset()
    updateMembershipMock.mockResolvedValue(athlete)
  })

  it('opens with the current jersey number', () => {
    renderDrawer()

    expect(screen.getByLabelText('Camisa')).toHaveValue(23)
  })

  it('sends both fields when the athlete is saved', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.clear(screen.getByLabelText('Camisa'))
    await user.type(screen.getByLabelText('Camisa'), '10')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(updateMembershipMock).toHaveBeenCalledWith(77, { jerseyNumber: 10, position: 'PG' })
    })
  })

  it('blocks saving an athlete without a jersey number', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.clear(screen.getByLabelText('Camisa'))

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('lets the coaching staff be saved with both fields empty', async () => {
    const user = userEvent.setup()
    renderDrawer({ role: 'COACHING_STAFF', jerseyNumber: null, position: null })

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(updateMembershipMock).toHaveBeenCalledWith(77, { jerseyNumber: null, position: null })
    })
  })

  it('closes after a successful save', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('reports an unmapped conflict with the fallback copy without closing', async () => {
    const user = userEvent.setup()
    updateMembershipMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { error: { code: 'CONFLICT', message: 'Jersey number is already used in this team' } },
      },
    })
    renderDrawer()

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText('Outra alteração ocorreu ao mesmo tempo. Atualize a lista e tente novamente.'),
    ).toBeInTheDocument()
  })
})
