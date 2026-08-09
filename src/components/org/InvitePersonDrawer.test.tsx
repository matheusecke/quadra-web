import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InvitePersonDrawer } from './InvitePersonDrawer'

const lookupMock = vi.fn()
const inviteOrgAdminMock = vi.fn()
const inviteTeamMemberMock = vi.fn()
const activeAffiliationMock = vi.fn()

vi.mock('../../services/orgApi', () => ({
  lookupUserByEmail: (...args: unknown[]) => lookupMock(...args),
  inviteOrgAdmin: (...args: unknown[]) => inviteOrgAdminMock(...args),
  inviteTeamMember: (...args: unknown[]) => inviteTeamMemberMock(...args),
}))

vi.mock('../../hooks/useActiveOrgAffiliation', () => ({
  useActiveOrgAffiliation: () => activeAffiliationMock(),
}))

const onClose = vi.fn()

function renderDrawer() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <InvitePersonDrawer open onClose={onClose} />
    </QueryClientProvider>,
  )
}

async function selectMarina(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail da pessoa'), 'marina@example.com')
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
  await user.click(await screen.findByRole('button', { name: /Marina Souza/ }))
}

describe('InvitePersonDrawer as an organization administrator', () => {
  beforeEach(() => {
    onClose.mockReset()
    lookupMock.mockReset()
    lookupMock.mockResolvedValue({ id: 42, name: 'Marina Souza', email: 'marina@example.com' })
    inviteOrgAdminMock.mockReset()
    inviteOrgAdminMock.mockResolvedValue(undefined)
    activeAffiliationMock.mockReturnValue({ role: 'ORG_ADMIN', teamId: null })
  })

  it('keeps submit disabled until a user has been selected', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.type(screen.getByLabelText('E-mail da pessoa'), 'marina@example.com')

    expect(screen.getByRole('button', { name: 'Enviar convite' })).toBeDisabled()
  })

  it('sends only the selected recipient', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await selectMarina(user)
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))

    await waitFor(() => {
      expect(inviteOrgAdminMock).toHaveBeenCalledWith({ userId: 42 })
    })
  })

  it('offers no role, jersey or position field to an organization administrator', () => {
    renderDrawer()

    expect(screen.queryByLabelText('Papel')).not.toBeInTheDocument()
  })

  it('closes after a successful invite', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await selectMarina(user)
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('keeps the drawer open and shows the contractual copy when the user already has a link', async () => {
    const user = userEvent.setup()
    inviteOrgAdminMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { error: { code: 'CONFLICT', message: 'User already has an active affiliation' } },
      },
    })
    renderDrawer()

    await selectMarina(user)
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))

    const error = await screen.findByText('Este usuário já possui um vínculo ativo nesta organização.')
    expect(error).toHaveFocus()
    expect(screen.getByRole('button', { name: /Marina Souza/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))
    await waitFor(() => expect(inviteOrgAdminMock).toHaveBeenCalledTimes(2))
    expect(lookupMock).toHaveBeenCalledTimes(1)
  })

  it('blocks a second submit while the invite is in flight', async () => {
    const user = userEvent.setup()
    inviteOrgAdminMock.mockReturnValue(new Promise(() => undefined))
    renderDrawer()

    await selectMarina(user)
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))

    expect(screen.getByRole('button', { name: 'Enviar convite' })).toBeDisabled()
  })
})

describe('InvitePersonDrawer as a team administrator', () => {
  beforeEach(() => {
    onClose.mockReset()
    lookupMock.mockReset()
    lookupMock.mockResolvedValue({ id: 42, name: 'Marina Souza', email: 'marina@example.com' })
    inviteTeamMemberMock.mockReset()
    inviteTeamMemberMock.mockResolvedValue(undefined)
    activeAffiliationMock.mockReturnValue({ role: 'TEAM_ADMIN', teamId: 8 })
  })

  it('requires a jersey number before an athlete can be invited', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await selectMarina(user)

    expect(screen.getByRole('button', { name: 'Enviar convite' })).toBeDisabled()
  })

  it('sends the athlete membership fields to the team route', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await selectMarina(user)
    await user.type(screen.getByLabelText('Camisa'), '7')
    await user.click(screen.getByLabelText('Posição'))
    await user.click(screen.getByRole('option', { name: 'PG' }))
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))

    await waitFor(() => {
      expect(inviteTeamMemberMock).toHaveBeenCalledWith(8, {
        userId: 42,
        role: 'ATHLETE',
        jerseyNumber: 7,
        position: 'PG',
      })
    })
  })

  it('lets the coaching staff be invited without jersey or position', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await selectMarina(user)
    await user.click(screen.getByLabelText('Papel'))
    await user.click(screen.getByRole('option', { name: 'Comissão técnica' }))
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))

    await waitFor(() => {
      expect(inviteTeamMemberMock).toHaveBeenCalledWith(8, {
        userId: 42,
        role: 'COACHING_STAFF',
      })
    })
  })

  it('hides the jersey field once the coaching staff role is chosen', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.click(screen.getByLabelText('Papel'))
    await user.click(screen.getByRole('option', { name: 'Comissão técnica' }))

    expect(screen.queryByLabelText('Camisa')).not.toBeInTheDocument()
  })

  it('never offers the organization administrator role to a team administrator', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.click(screen.getByLabelText('Papel'))

    expect(
      screen.queryByRole('option', { name: 'Administrador da organização' }),
    ).not.toBeInTheDocument()
  })
})
