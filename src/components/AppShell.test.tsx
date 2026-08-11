import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

const useAuthMock = vi.fn()

vi.mock('../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))
vi.mock('./Sidebar', () => ({ Sidebar: () => <nav>sidebar</nav> }))

const withoutOrg = {
  status: 'authenticated',
  user: { id: 1, email: 'u@e.com', name: 'U', isSystemAdmin: false, organizationId: null, role: null },
}

function renderShell(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/account" element={<div>my-account-page</div>} />
          <Route path="/home" element={<div>home-page</div>} />
        </Route>
        <Route path="/select-org" element={<div>select-org-page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('opens /account for an authenticated user with no active organization', () => {
    useAuthMock.mockReturnValue(withoutOrg)
    renderShell('/account')
    expect(screen.getByText('my-account-page')).toBeInTheDocument()
  })

  it('still sends that same user to the organization picker on a normal route', () => {
    useAuthMock.mockReturnValue(withoutOrg)
    renderShell('/home')
    expect(screen.getByText('select-org-page')).toBeInTheDocument()
  })
})
