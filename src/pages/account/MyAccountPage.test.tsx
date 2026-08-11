import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MyAccountPage } from './MyAccountPage'
import * as accountApi from '../../services/accountApi'
import { useAuth } from '../../hooks/useAuth'

vi.mock('../../services/accountApi')
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

const refreshUserMock = vi.fn<() => Promise<void>>()

const profile = {
  id: 1,
  email: 'user@example.com',
  name: 'User Name',
  birthDate: '1998-04-23',
  heightCm: 182,
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return render(<MyAccountPage />, { wrapper })
}

const axiosValidationError = (fields: Record<string, string[]>) =>
  Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: {
      status: 400,
      data: { error: { code: 'VALIDATION_ERROR', message: 'Validation failed.', data: fields } },
    },
  })

describe('MyAccountPage — dados pessoais', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refreshUserMock.mockResolvedValue()
    vi.mocked(useAuth).mockReturnValue({ refreshUser: refreshUserMock } as never)
    vi.mocked(accountApi.getMyProfile).mockResolvedValue(profile)
    vi.mocked(accountApi.updateMyProfile).mockResolvedValue(profile)
  })

  it('fills the form with the loaded profile and locks the email', async () => {
    renderPage()

    expect(await screen.findByLabelText('Nome')).toHaveValue('User Name')
    expect(screen.getByLabelText('Data de nascimento')).toHaveValue('23/04/1998')
    expect(screen.getByLabelText('Altura')).toHaveValue('1,82m')

    const email = screen.getByLabelText('E-mail')
    expect(email).toHaveValue('user@example.com')
    expect(email).toBeDisabled()
  })

  it('keeps Salvar disabled until something actually changes', async () => {
    renderPage()

    const save = await screen.findByRole('button', { name: 'Salvar' })
    expect(save).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Nome'), '!')
    expect(save).toBeEnabled()
  })

  it('sends only the changed field and refreshes the session user', async () => {
    vi.mocked(accountApi.updateMyProfile).mockResolvedValue({ ...profile, name: 'Nome Novo' })
    renderPage()

    const nameInput = await screen.findByLabelText('Nome')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Nome Novo')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(accountApi.updateMyProfile).toHaveBeenCalledWith({ name: 'Nome Novo' }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Dados atualizados.')
    expect(refreshUserMock).toHaveBeenCalled()
  })

  it('sends null when the height is cleared', async () => {
    vi.mocked(accountApi.updateMyProfile).mockResolvedValue({ ...profile, heightCm: null })
    renderPage()

    const height = await screen.findByLabelText('Altura')
    await userEvent.click(height)
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(accountApi.updateMyProfile).toHaveBeenCalledWith({ heightCm: null }),
    )
  })

  it('sends the birth date as a date-only string', async () => {
    renderPage()

    const birthDate = await screen.findByLabelText('Data de nascimento')
    await userEvent.clear(birthDate)
    await userEvent.type(birthDate, '31/12/2000')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(accountApi.updateMyProfile).toHaveBeenCalledWith({ birthDate: '2000-12-31' }),
    )
  })

  it('restores the loaded values on Cancelar', async () => {
    renderPage()

    const nameInput = await screen.findByLabelText('Nome')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Rascunho')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(nameInput).toHaveValue('User Name')
    expect(accountApi.updateMyProfile).not.toHaveBeenCalled()
  })

  it('shows a server validation error on the offending field', async () => {
    vi.mocked(accountApi.updateMyProfile).mockRejectedValue(
      axiosValidationError({ birthDate: ['Birth date must be a real past date.'] }),
    )
    renderPage()

    const nameInput = await screen.findByLabelText('Nome')
    await userEvent.type(nameInput, ' Jr')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Use uma data de nascimento real')
    expect(refreshUserMock).not.toHaveBeenCalled()
  })

  it('refuses to submit an empty name without calling the API', async () => {
    renderPage()

    const nameInput = await screen.findByLabelText('Nome')
    await userEvent.clear(nameInput)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe seu nome.')
    expect(accountApi.updateMyProfile).not.toHaveBeenCalled()
  })
})

const axiosErrorWithCode = (code: string) =>
  Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { status: 400, data: { error: { code, message: 'Bad request.' } } },
  })

describe('MyAccountPage — segurança', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refreshUserMock.mockResolvedValue()
    vi.mocked(useAuth).mockReturnValue({ refreshUser: refreshUserMock } as never)
    vi.mocked(accountApi.getMyProfile).mockResolvedValue(profile)
    vi.mocked(accountApi.changePassword).mockResolvedValue('rotated-token')
  })

  const fillPasswords = async (current: string, next: string, confirm: string) => {
    await userEvent.type(await screen.findByLabelText('Senha atual'), current)
    await userEvent.type(screen.getByLabelText('Nova senha'), next)
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), confirm)
    await userEvent.click(screen.getByRole('button', { name: 'Trocar senha' }))
  }

  it('changes the password and clears the three fields', async () => {
    renderPage()

    await fillPasswords('oldpassword1!', 'newpassword1!', 'newpassword1!')

    await waitFor(() =>
      expect(accountApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpassword1!',
        newPassword: 'newpassword1!',
      }),
    )
    expect(await screen.findByText('Senha alterada. As outras sessões foram encerradas.'))
      .toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('')
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveValue('')
  })

  it('does not call the API when the confirmation does not match', async () => {
    renderPage()

    await fillPasswords('oldpassword1!', 'newpassword1!', 'newpassword2!')

    expect(await screen.findByText('A confirmação não confere com a nova senha.'))
      .toBeInTheDocument()
    expect(accountApi.changePassword).not.toHaveBeenCalled()
  })

  it('does not call the API when the new password is too weak', async () => {
    renderPage()

    await fillPasswords('oldpassword1!', 'abcdefgh', 'abcdefgh')

    expect(
      await screen.findByText(
        'A senha deve ter no mínimo 8 caracteres, 1 número e 1 caractere especial.',
      ),
    ).toBeInTheDocument()
    expect(accountApi.changePassword).not.toHaveBeenCalled()
  })

  it('reports a wrong current password on its own field, not as a banner', async () => {
    vi.mocked(accountApi.changePassword).mockRejectedValue(
      axiosErrorWithCode('WRONG_CURRENT_PASSWORD'),
    )
    renderPage()

    await fillPasswords('errada1!', 'newpassword1!', 'newpassword1!')

    expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveValue('errada1!')
  })
})
