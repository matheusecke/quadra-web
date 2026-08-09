import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserRowActions } from './UserRowActions'
import type { OrgUserAffiliation } from '../../types/org'

const cancelUserInviteMock = vi.fn()
const resendUserInviteMock = vi.fn()
const activateUserAffiliationMock = vi.fn()
const deactivateUserAffiliationMock = vi.fn()
const activeAffiliationMock = vi.fn()

vi.mock('../../services/orgApi', () => ({
  cancelUserInvite: (...args: unknown[]) => cancelUserInviteMock(...args),
  resendUserInvite: (...args: unknown[]) => resendUserInviteMock(...args),
  activateUserAffiliation: (...args: unknown[]) => activateUserAffiliationMock(...args),
  deactivateUserAffiliation: (...args: unknown[]) => deactivateUserAffiliationMock(...args),
  updateMembership: vi.fn(),
}))

vi.mock('../../hooks/useActiveOrgAffiliation', () => ({
  useActiveOrgAffiliation: () => activeAffiliationMock(),
}))

const baseAffiliation: OrgUserAffiliation = {
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

function renderActions(overrides: Partial<OrgUserAffiliation> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <UserRowActions affiliation={{ ...baseAffiliation, ...overrides }} />
    </QueryClientProvider>,
  )
}

describe('UserRowActions', () => {
  beforeEach(() => {
    cancelUserInviteMock.mockReset()
    cancelUserInviteMock.mockResolvedValue(undefined)
    resendUserInviteMock.mockReset()
    resendUserInviteMock.mockResolvedValue(undefined)
    activateUserAffiliationMock.mockReset()
    activateUserAffiliationMock.mockResolvedValue(baseAffiliation)
    deactivateUserAffiliationMock.mockReset()
    deactivateUserAffiliationMock.mockResolvedValue(baseAffiliation)
    activeAffiliationMock.mockReturnValue({ role: 'TEAM_ADMIN', teamId: 8 })
  })

  it('offers nothing for a row the actor cannot manage', () => {
    renderActions({ canManage: false })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders actions after a row becomes manageable', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <UserRowActions affiliation={{ ...baseAffiliation, canManage: false }} />
      </QueryClientProvider>,
    )

    rerender(
      <QueryClientProvider client={queryClient}>
        <UserRowActions affiliation={baseAffiliation} />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('button', { name: 'Desativar' })).toBeInTheDocument()
  })

  it('offers only the deactivation for an active affiliation', () => {
    renderActions()

    expect(screen.getByRole('button', { name: 'Desativar' })).toBeInTheDocument()
  })

  it('offers only the activation for an inactive affiliation', () => {
    renderActions({ status: 'INACTIVE' })

    expect(screen.getByRole('button', { name: 'Ativar' })).toBeInTheDocument()
  })

  it('offers the resend for a pending invite', () => {
    renderActions({ status: 'PENDING' })

    expect(screen.getByRole('button', { name: 'Reenviar convite' })).toBeInTheDocument()
  })

  it('offers the cancellation for a pending invite', () => {
    renderActions({ status: 'PENDING' })

    expect(screen.getByRole('button', { name: 'Cancelar convite' })).toBeInTheDocument()
  })

  it('asks for confirmation before deactivating', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Desativar' }))

    expect(
      screen.getByText('O acesso desta pessoa à organização será suspenso.'),
    ).toBeInTheDocument()
  })

  it('does not call the API until the confirmation is accepted', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Desativar' }))

    expect(deactivateUserAffiliationMock).not.toHaveBeenCalled()
  })

  it('deactivates the affiliation when the confirmation is accepted', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Desativar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(deactivateUserAffiliationMock).toHaveBeenCalledWith(77)
    })
  })

  it('renews the invite when the resend is confirmed', async () => {
    const user = userEvent.setup()
    renderActions({ status: 'PENDING' })

    await user.click(screen.getByRole('button', { name: 'Reenviar convite' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(resendUserInviteMock).toHaveBeenCalledWith(77)
    })
  })

  it('cancels the invite when the cancellation is confirmed', async () => {
    const user = userEvent.setup()
    renderActions({ status: 'PENDING' })

    await user.click(screen.getByRole('button', { name: 'Cancelar convite' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(cancelUserInviteMock).toHaveBeenCalledWith(77)
    })
  })

  it('activates the affiliation when the activation is confirmed', async () => {
    const user = userEvent.setup()
    renderActions({ status: 'INACTIVE' })

    await user.click(screen.getByRole('button', { name: 'Ativar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(activateUserAffiliationMock).toHaveBeenCalledWith(77)
    })
  })

  it('keeps the confirmation open and reports the conflict when activation fails', async () => {
    const user = userEvent.setup()
    activateUserAffiliationMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { error: { code: 'CONFLICT', message: 'User already has an active affiliation' } },
      },
    })
    renderActions({ status: 'INACTIVE' })

    await user.click(screen.getByRole('button', { name: 'Ativar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(
      await screen.findByText('Este usuário já possui um vínculo ativo nesta organização.'),
    ).toBeInTheDocument()
  })

  it('offers the membership edit to a team administrator on an active athlete', () => {
    renderActions()

    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Editar vínculo' })).not.toBeInTheDocument()
  })

  it('moves focus into a confirmation and restores it after cancel', async () => {
    const user = userEvent.setup()
    renderActions()
    const trigger = screen.getByRole('button', { name: 'Desativar' })

    await user.click(trigger)
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('button', { name: 'Desativar' })).toHaveFocus()
  })

  it('restores focus to the action after a confirmed mutation succeeds', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Desativar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Desativar' })).toHaveFocus())
  })

  it('never offers the membership edit to an organization administrator', () => {
    activeAffiliationMock.mockReturnValue({ role: 'ORG_ADMIN', teamId: null })

    renderActions()

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('never offers the membership edit on a pending invite', () => {
    renderActions({ status: 'PENDING' })

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })
})
