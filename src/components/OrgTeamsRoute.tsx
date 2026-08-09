import { Navigate, Outlet } from 'react-router-dom'
import { useActiveOrgAffiliation } from '../hooks/useActiveOrgAffiliation'

export function OrgTeamsRoute() {
  const { role, teamId } = useActiveOrgAffiliation()

  if (role === 'ORG_ADMIN') return <Outlet />
  // A team admin who types /teams belongs on its own team, not on the organization list.
  if (role === 'TEAM_ADMIN' && teamId !== null) return <Navigate to={`/teams/${teamId}`} replace />

  return <Navigate to="/home" replace />
}
