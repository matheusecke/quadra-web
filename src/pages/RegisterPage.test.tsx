import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from './RegisterPage'

const navigateMock = vi.fn()
const registerMock = vi.fn()
const useAuthMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    registerMock.mockReset()
    useAuthMock.mockReturnValue({
      status: 'unauthenticated',
      register: registerMock,
    })
  })

  it('shows a visible path back to login', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login')
  })

  it('requires email, name, password, and birth date', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByText('Informe seu email.')).toBeInTheDocument()
    expect(screen.getByText('Informe seu nome.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua data de nascimento.')).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('validates password requirements before submit', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Nome'), 'User Name')
    await userEvent.type(screen.getByLabelText('Senha'), 'password')
    await userEvent.type(screen.getByLabelText('Data de nascimento'), '23/04/1998')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByText('A senha deve ter pelo menos 1 numero.')).toBeInTheDocument()
    expect(screen.getByText('A senha deve ter pelo menos 1 caractere especial.')).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('formats birth date visually as dd/mm/aaaa while typing', async () => {
    renderPage()
    const birthDate = screen.getByLabelText('Data de nascimento')

    await userEvent.type(birthDate, '23041998')

    expect(birthDate).toHaveValue('23/04/1998')
  })

  it('submits register payload and omits blank height', async () => {
    registerMock.mockResolvedValue({ organizations: [] })
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Nome'), 'User Name')
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123!')
    await userEvent.type(screen.getByLabelText('Data de nascimento'), '23/04/1998')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: 'User Name',
        password: 'secret123!',
        birthDate: '1998-04-23',
      })
    })
    expect(navigateMock).toHaveBeenCalledWith('/no-org')
  })

  it('sends height as an integer when filled', async () => {
    registerMock.mockResolvedValue({ organizations: [{ organizationId: 1 }] })
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Nome'), 'User Name')
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123!')
    await userEvent.type(screen.getByLabelText('Data de nascimento'), '23/04/1998')
    await userEvent.type(screen.getByLabelText('Altura (opcional)'), '182')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(expect.objectContaining({ height: 182 }))
    })
    expect(navigateMock).toHaveBeenCalledWith('/select-org')
  })

  it('rejects invalid birth dates in dd/mm/aaaa format', async () => {
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Nome'), 'User Name')
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123!')
    await userEvent.type(screen.getByLabelText('Data de nascimento'), '31/02/1998')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByText('Use uma data valida no formato dd/mm/aaaa.')).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('rejects non-integer height', async () => {
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Nome'), 'User Name')
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123!')
    await userEvent.type(screen.getByLabelText('Data de nascimento'), '23/04/1998')
    await userEvent.type(screen.getByLabelText('Altura (opcional)'), '182.5')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByText('Informe a altura como um numero inteiro em centimetros.')).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('shows an API error and keeps the user on the page', async () => {
    registerMock.mockRejectedValue(new Error('conflict'))
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Nome'), 'User Name')
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123!')
    await userEvent.type(screen.getByLabelText('Data de nascimento'), '23/04/1998')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nao foi possivel criar sua conta. Confira os dados e tente novamente.',
    )
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('disables submit while registering', async () => {
    registerMock.mockReturnValue(new Promise(() => undefined))
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Nome'), 'User Name')
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123!')
    await userEvent.type(screen.getByLabelText('Data de nascimento'), '23/04/1998')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(screen.getByRole('button', { name: /criando conta/i })).toBeDisabled()
  })
})
