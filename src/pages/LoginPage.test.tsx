import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

const navigateMock = vi.fn()
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
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useAuthMock.mockReturnValue({
      status: 'unauthenticated',
      login: vi.fn(),
      chooseOrg: vi.fn(),
    })
  })

  it('shows a visible path to create an account', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /criar conta/i })).toHaveAttribute('href', '/register')
  })

  it('shows the expected placeholders for email and password', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Email')).toHaveAttribute('placeholder', 'nome@empresa.com')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('placeholder', '••••••••')
  })

  it('shows error message when login fails', async () => {
    const loginMock = vi.fn().mockRejectedValue(new Error('unauthorized'))
    useAuthMock.mockReturnValue({
      status: 'unauthenticated',
      login: loginMock,
    })
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha inválidos.')
  })

  it('toggles password visibility', async () => {
    renderPage()
    const passwordInput = screen.getByLabelText('Senha')
    expect(passwordInput).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: /mostrar senha/i }))
    expect(passwordInput).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: /ocultar senha/i }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
