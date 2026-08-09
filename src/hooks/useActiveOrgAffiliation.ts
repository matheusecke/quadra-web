import { useAuth } from './useAuth'
import type { OrgRole } from '../types/admin'

/**
 * The JWT carries the active role but not the team, so the team of the active affiliation is read
 * from the organizations snapshot loaded by /auth/orgs.
 */
export function useActiveOrgAffiliation(): { role: OrgRole | null; teamId: number | null } {
  const { user, organizations } = useAuth()
  const organizationId = user?.organizationId ?? null
  const active =
    organizationId === null
      ? undefined
      : organizations.find((organization) => organization.organizationId === organizationId)

  return {
    role: (user?.role as OrgRole | null) ?? null,
    teamId: active?.teamId ?? null,
  }
}
