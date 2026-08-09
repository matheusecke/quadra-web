import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamRegistrationForm } from './TeamRegistrationForm'
import type { TeamProfileIdentity } from '../../features/sports/types'

const updateTeamMock = vi.fn()

vi.mock('../../services/orgApi', () => ({
  updateTeam: (...args: unknown[]) => updateTeamMock(...args),
}))

const team: TeamProfileIdentity = {
  id: 8,
  name: 'Engenharia PUC',
  shortName: 'EPU',
  city: 'Campinas',
  state: 'SP',
  status: 'ACTIVE',
}

function renderForm(overrides: Partial<TeamProfileIdentity> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <TeamRegistrationForm team={{ ...team, ...overrides }} />
    </QueryClientProvider>,
  )
}

describe('TeamRegistrationForm', () => {
  beforeEach(() => {
    updateTeamMock.mockReset()
    updateTeamMock.mockResolvedValue(undefined)
  })

  it('shows the global identity warning', () => {
    renderForm()

    expect(
      screen.getByText(
        'Estes dados identificam sua equipe em toda a plataforma. Se ela estiver vinculada a outras organizações, as alterações também serão exibidas nelas.',
      ),
    ).toBeInTheDocument()
  })

  it('opens with the current registration values', () => {
    renderForm()

    expect(screen.getByLabelText('Sigla')).toHaveValue('EPU')
  })

  it('sends the four registration fields on save', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.clear(screen.getByLabelText('Nome'))
    await user.type(screen.getByLabelText('Nome'), 'Engenharia PUC Campinas')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(updateTeamMock).toHaveBeenCalledWith(8, {
        name: 'Engenharia PUC Campinas',
        shortName: 'EPU',
        city: 'Campinas',
        state: 'SP',
      })
    })
  })

  it('sends null instead of an empty location', async () => {
    const user = userEvent.setup()
    renderForm({ city: null, state: null })

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(updateTeamMock).toHaveBeenCalledWith(8, {
        name: 'Engenharia PUC',
        shortName: 'EPU',
        city: null,
        state: null,
      })
    })
  })

  it('blocks saving without a name', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.clear(screen.getByLabelText('Nome'))

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('blocks saving without a short name', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.clear(screen.getByLabelText('Sigla'))

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('reports a failed save inline', async () => {
    const user = userEvent.setup()
    updateTeamMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { error: { code: 'FORBIDDEN', message: 'You cannot edit this team registration.' } } },
    })
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText('Não foi possível salvar o cadastro da equipe.'),
    ).toBeInTheDocument()
  })

  it('confirms a successful save', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Cadastro atualizado.')).toBeInTheDocument()
  })
})
