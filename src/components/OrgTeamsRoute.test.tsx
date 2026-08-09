import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { OrgTeamsRoute } from './OrgTeamsRoute'

const affiliationMock = vi.fn()

vi.mock('../hooks/useActiveOrgAffiliation', () => ({
  useActiveOrgAffiliation: () => affiliationMock(),
}))

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/teams']}>
      <Routes>
        <Route element={<OrgTeamsRoute />}>
          <Route path="/teams" element={<div>teams-page</div>} />
        </Route>
        <Route path="/teams/:teamId" element={<div>team-detail-page</div>} />
        <Route path="/home" element={<div>home-page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OrgTeamsRoute', () => {
  it('lets an organization admin through', () => {
    affiliationMock.mockReturnValue({ role: 'ORG_ADMIN', teamId: null })

    renderGuard()

    expect(screen.getByText('teams-page')).toBeInTheDocument()
  })

  it('redirects a team admin to its own team profile', () => {
    affiliationMock.mockReturnValue({ role: 'TEAM_ADMIN', teamId: 8 })

    renderGuard()

    expect(screen.getByText('team-detail-page')).toBeInTheDocument()
  })

  it('sends a team admin without a team home instead of to an invalid profile', () => {
    affiliationMock.mockReturnValue({ role: 'TEAM_ADMIN', teamId: null })

    renderGuard()

    expect(screen.getByText('home-page')).toBeInTheDocument()
  })

  it('sends an athlete home', () => {
    affiliationMock.mockReturnValue({ role: 'ATHLETE', teamId: 8 })

    renderGuard()

    expect(screen.getByText('home-page')).toBeInTheDocument()
  })
})
