import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InvitePersonDrawer } from './InvitePersonDrawer'

const lookupMock = vi.fn()
const inviteOrgAdminMock = vi.fn()
const activeAffiliationMock = vi.fn()

vi.mock('../../services/orgApi', () => ({
  lookupUserByEmail: (...args: unknown[]) => lookupMock(...args),
  inviteOrgAdmin: (...args: unknown[]) => inviteOrgAdminMock(...args),
  inviteTeamMember: vi.fn(),
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

    expect(
      await screen.findByText('Este usuário já possui um vínculo ativo nesta organização.'),
    ).toBeInTheDocument()
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
