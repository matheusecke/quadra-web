import { render, screen } from '@testing-library/react'
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

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useAuthMock.mockReturnValue({
      status: 'unauthenticated',
      login: vi.fn(),
      chooseOrg: vi.fn(),
    })
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
})
