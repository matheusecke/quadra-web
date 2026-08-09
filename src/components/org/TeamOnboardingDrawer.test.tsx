import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamOnboardingDrawer } from './TeamOnboardingDrawer'

const lookupMock = vi.fn()
const createTeamOnboardingMock = vi.fn()
const listTeamAffiliationCandidatesMock = vi.fn()

vi.mock('../../services/orgApi', () => ({
  lookupUserByEmail: (...args: unknown[]) => lookupMock(...args),
  createTeamOnboarding: (...args: unknown[]) => createTeamOnboardingMock(...args),
  listTeamAffiliationCandidates: (...args: unknown[]) =>
    listTeamAffiliationCandidatesMock(...args),
}))

const onClose = vi.fn()

function renderDrawer(fixedTeam?: { id: number; name: string }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <TeamOnboardingDrawer open onClose={onClose} fixedTeam={fixedTeam} />
    </QueryClientProvider>,
  )
}

async function selectMarina(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail da pessoa'), 'marina@example.com')
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
  await user.click(await screen.findByRole('button', { name: /Marina Souza/ }))
}

describe('TeamOnboardingDrawer', () => {
  beforeEach(() => {
    onClose.mockReset()
    lookupMock.mockReset()
    lookupMock.mockResolvedValue({ id: 42, name: 'Marina Souza', email: 'marina@example.com' })
    createTeamOnboardingMock.mockReset()
    createTeamOnboardingMock.mockResolvedValue(undefined)
    listTeamAffiliationCandidatesMock.mockReset()
    listTeamAffiliationCandidatesMock.mockResolvedValue({
      data: [
        {
          id: 8,
          name: 'Águias Campinas',
          shortName: 'AGC',
          city: 'Campinas',
          state: 'SP',
          affiliation: null,
        },
      ],
      meta: { totalItems: 1, itemCount: 1, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
      links: { first: '', previous: null, next: null, last: '' },
      statusCode: 200,
    })
  })

  it('opens on the existing-team branch', () => {
    renderDrawer()

    expect(screen.getByRole('tab', { name: 'Equipe existente' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('replaces the picker with a name field on the new-team branch', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.click(screen.getByRole('tab', { name: 'Criar nova' }))

    expect(screen.getByLabelText('Nome da equipe')).toBeInTheDocument()
  })

  it('hides the team picker on the new-team branch', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.click(screen.getByRole('tab', { name: 'Criar nova' }))

    expect(screen.queryByPlaceholderText('Buscar equipe...')).not.toBeInTheDocument()
  })

  it('sends the selected team and the single administrator', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.type(screen.getByPlaceholderText('Buscar equipe...'), 'agu')
    await user.click(await screen.findByText('Águias Campinas'))
    await selectMarina(user)
    await user.click(screen.getByRole('button', { name: 'Adicionar equipe' }))

    await waitFor(() => {
      expect(createTeamOnboardingMock).toHaveBeenCalledWith({ teamId: 8, adminUserId: 42 })
    })
  })

  it('sends the trimmed team name when a new team is created', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.click(screen.getByRole('tab', { name: 'Criar nova' }))
    await user.type(screen.getByLabelText('Nome da equipe'), '  Águias Campinas  ')
    await selectMarina(user)
    await user.click(screen.getByRole('button', { name: 'Adicionar equipe' }))

    await waitFor(() => {
      expect(createTeamOnboardingMock).toHaveBeenCalledWith({
        teamName: 'Águias Campinas',
        adminUserId: 42,
      })
    })
  })

  it('keeps submit disabled until both the team and the administrator are chosen', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await selectMarina(user)

    expect(screen.getByRole('button', { name: 'Adicionar equipe' })).toBeDisabled()
  })

  it('preserves the selection and explains how to proceed when the team is inactive', async () => {
    const user = userEvent.setup()
    createTeamOnboardingMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          error: {
            code: 'UNPROCESSABLE',
            message: 'Team affiliation is inactive; activate it before inviting users',
          },
        },
      },
    })
    renderDrawer()

    await user.type(screen.getByPlaceholderText('Buscar equipe...'), 'agu')
    await user.click(await screen.findByText('Águias Campinas'))
    await selectMarina(user)
    await user.click(screen.getByRole('button', { name: 'Adicionar equipe' }))

    expect(
      await screen.findByText(
        'Esta equipe está inativa nesta organização. Ative a equipe pela lista antes de convidar usuários.',
      ),
    ).toBeInTheDocument()
  })

  it('keeps the drawer open after that failure', async () => {
    const user = userEvent.setup()
    createTeamOnboardingMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          error: {
            code: 'UNPROCESSABLE',
            message: 'Team affiliation is inactive; activate it before inviting users',
          },
        },
      },
    })
    renderDrawer()

    await user.type(screen.getByPlaceholderText('Buscar equipe...'), 'agu')
    await user.click(await screen.findByText('Águias Campinas'))
    await selectMarina(user)
    await user.click(screen.getByRole('button', { name: 'Adicionar equipe' }))
    await screen.findByRole('alert')

    expect(onClose).not.toHaveBeenCalled()
  })

  it('offers no branch control when the team is fixed', () => {
    renderDrawer({ id: 8, name: 'Águias Campinas' })

    expect(screen.queryByRole('tab', { name: 'Criar nova' })).not.toBeInTheDocument()
  })

  it('sends the fixed team when only an administrator is added', async () => {
    const user = userEvent.setup()
    renderDrawer({ id: 8, name: 'Águias Campinas' })

    await selectMarina(user)
    await user.click(screen.getByRole('button', { name: 'Convidar administrador' }))

    await waitFor(() => {
      expect(createTeamOnboardingMock).toHaveBeenCalledWith({ teamId: 8, adminUserId: 42 })
    })
  })
})
