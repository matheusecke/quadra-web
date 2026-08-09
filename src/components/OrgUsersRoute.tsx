import { Navigate, Outlet } from 'react-router-dom'
import { useActiveOrgAffiliation } from '../hooks/useActiveOrgAffiliation'

export function OrgUsersRoute() {
  const { role } = useActiveOrgAffiliation()

  if (role !== 'ORG_ADMIN' && role !== 'TEAM_ADMIN') return <Navigate to="/home" replace />

  return <Outlet />
}
