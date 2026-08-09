import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { OrgUsersRoute } from './OrgUsersRoute'

const affiliationMock = vi.fn()

vi.mock('../hooks/useActiveOrgAffiliation', () => ({
  useActiveOrgAffiliation: () => affiliationMock(),
}))

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/users']}>
      <Routes>
        <Route element={<OrgUsersRoute />}>
          <Route path="/users" element={<div>users-page</div>} />
        </Route>
        <Route path="/home" element={<div>home-page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OrgUsersRoute', () => {
  it('lets an organization admin through', () => {
    affiliationMock.mockReturnValue({ role: 'ORG_ADMIN', teamId: null })

    renderGuard()

    expect(screen.getByText('users-page')).toBeInTheDocument()
  })

  it('lets a team admin through', () => {
    affiliationMock.mockReturnValue({ role: 'TEAM_ADMIN', teamId: 8 })

    renderGuard()

    expect(screen.getByText('users-page')).toBeInTheDocument()
  })

  it('sends an athlete home', () => {
    affiliationMock.mockReturnValue({ role: 'ATHLETE', teamId: 8 })

    renderGuard()

    expect(screen.getByText('home-page')).toBeInTheDocument()
  })

  it('sends a session without an organization home', () => {
    affiliationMock.mockReturnValue({ role: null, teamId: null })

    renderGuard()

    expect(screen.getByText('home-page')).toBeInTheDocument()
  })
})
