import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamRowActions } from './TeamRowActions'
import type { OrgTeamAffiliation } from '../../types/org'

const activateTeamAffiliationMock = vi.fn()
const deactivateTeamAffiliationMock = vi.fn()
const cancelTeamInclusionMock = vi.fn()
const resendTeamInvitesMock = vi.fn()

vi.mock('../../services/orgApi', () => ({
  activateTeamAffiliation: (...args: unknown[]) => activateTeamAffiliationMock(...args),
  deactivateTeamAffiliation: (...args: unknown[]) => deactivateTeamAffiliationMock(...args),
  cancelTeamInclusion: (...args: unknown[]) => cancelTeamInclusionMock(...args),
  resendTeamInvites: (...args: unknown[]) => resendTeamInvitesMock(...args),
  createTeamOnboarding: vi.fn(),
  listTeamAffiliationCandidates: vi.fn(),
  lookupUserByEmail: vi.fn(),
}))

const baseAffiliation: OrgTeamAffiliation = {
  id: 15,
  organizationId: 42,
  teamId: 8,
  team: { id: 8, name: 'Águias Campinas', shortName: 'AGC', city: 'Campinas', state: 'SP' },
  status: 'ACTIVE',
  activeUserCount: 12,
  pendingAdminInviteCount: 0,
  createdByUserId: 9,
  createdAt: '2026-06-01T12:00:00.000Z',
  updatedAt: '2026-06-01T12:00:00.000Z',
}

function renderActions(overrides: Partial<OrgTeamAffiliation> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <TeamRowActions affiliation={{ ...baseAffiliation, ...overrides }} />
    </QueryClientProvider>,
  )
}

describe('TeamRowActions', () => {
  beforeEach(() => {
    activateTeamAffiliationMock.mockReset()
    activateTeamAffiliationMock.mockResolvedValue(baseAffiliation)
    deactivateTeamAffiliationMock.mockReset()
    deactivateTeamAffiliationMock.mockResolvedValue(baseAffiliation)
    cancelTeamInclusionMock.mockReset()
    cancelTeamInclusionMock.mockResolvedValue(undefined)
    resendTeamInvitesMock.mockReset()
    resendTeamInvitesMock.mockResolvedValue(undefined)
  })

  it('offers the collective resend on a pending inclusion', () => {
    renderActions({ status: 'PENDING' })

    expect(screen.getByRole('button', { name: 'Reenviar todos' })).toBeInTheDocument()
  })

  it('offers the cancellation on a pending inclusion', () => {
    renderActions({ status: 'PENDING' })

    expect(screen.getByRole('button', { name: 'Cancelar inclusão' })).toBeInTheDocument()
  })

  it('offers the administrator invite on a pending inclusion', () => {
    renderActions({ status: 'PENDING' })

    expect(screen.getByRole('button', { name: 'Convidar administrador' })).toBeInTheDocument()
  })

  it('offers the administrator invite on an active affiliation', () => {
    renderActions()

    expect(screen.getByRole('button', { name: 'Convidar administrador' })).toBeInTheDocument()
  })

  it('never offers the administrator invite on an inactive affiliation', () => {
    renderActions({ status: 'INACTIVE' })

    expect(screen.queryByRole('button', { name: 'Convidar administrador' })).not.toBeInTheDocument()
  })

  it('offers only the activation on an inactive affiliation', () => {
    renderActions({ status: 'INACTIVE' })

    expect(screen.getByRole('button', { name: 'Ativar' })).toBeInTheDocument()
  })

  it('warns about the cascade before deactivating', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Desativar' }))

    expect(
      screen.getByText('Membros ativos serão desativados e convites pendentes serão cancelados.'),
    ).toBeInTheDocument()
  })

  it('warns that members stay inactive before activating', async () => {
    const user = userEvent.setup()
    renderActions({ status: 'INACTIVE' })

    await user.click(screen.getByRole('button', { name: 'Ativar' }))

    expect(
      screen.getByText('Os membros permanecerão inativos e deverão ser ativados individualmente.'),
    ).toBeInTheDocument()
  })

  it('warns that every pending invite is cancelled before cancelling the inclusion', async () => {
    const user = userEvent.setup()
    renderActions({ status: 'PENDING' })

    await user.click(screen.getByRole('button', { name: 'Cancelar inclusão' }))

    expect(
      screen.getByText('Todos os convites pendentes desta equipe serão cancelados.'),
    ).toBeInTheDocument()
  })

  it('warns that every pending invite is renewed before the collective resend', async () => {
    const user = userEvent.setup()
    renderActions({ status: 'PENDING' })

    await user.click(screen.getByRole('button', { name: 'Reenviar todos' }))

    expect(
      screen.getByText(
        'Todos os convites pendentes desta equipe receberão um novo prazo para serem respondidos.',
      ),
    ).toBeInTheDocument()
  })

  it('deactivates the affiliation when the confirmation is accepted', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Desativar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(deactivateTeamAffiliationMock).toHaveBeenCalledWith(15)
    })
  })

  it('cancels the inclusion when the confirmation is accepted', async () => {
    const user = userEvent.setup()
    renderActions({ status: 'PENDING' })

    await user.click(screen.getByRole('button', { name: 'Cancelar inclusão' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(cancelTeamInclusionMock).toHaveBeenCalledWith(15)
    })
  })

  it('renews every pending invite when the collective resend is accepted', async () => {
    const user = userEvent.setup()
    renderActions({ status: 'PENDING' })

    await user.click(screen.getByRole('button', { name: 'Reenviar todos' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(resendTeamInvitesMock).toHaveBeenCalledWith(15)
    })
  })

  it('activates the affiliation when the confirmation is accepted', async () => {
    const user = userEvent.setup()
    renderActions({ status: 'INACTIVE' })

    await user.click(screen.getByRole('button', { name: 'Ativar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(activateTeamAffiliationMock).toHaveBeenCalledWith(15)
    })
  })

  it('opens the reduced drawer with the team already fixed', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Convidar administrador' }))

    expect(screen.getByText('Equipe: Águias Campinas')).toBeInTheDocument()
  })

  it('moves focus into a confirmation and restores it after cancel', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Desativar' }))
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('button', { name: 'Desativar' })).toHaveFocus()
  })

  it('keeps focus on the stable list region when refetch removes the row', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <section aria-label="Lista de equipes" data-org-list-focus-target tabIndex={-1}>
          <TeamRowActions affiliation={{ ...baseAffiliation, status: 'PENDING' }} />
        </section>
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar inclusão' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    const listRegion = screen.getByRole('region', { name: 'Lista de equipes' })
    await waitFor(() => expect(listRegion).toHaveFocus())

    rerender(
      <QueryClientProvider client={queryClient}>
        <section aria-label="Lista de equipes" data-org-list-focus-target tabIndex={-1} />
      </QueryClientProvider>,
    )

    expect(screen.queryByRole('button', { name: 'Cancelar inclusão' })).not.toBeInTheDocument()
    expect(listRegion).toHaveFocus()
  })
})
