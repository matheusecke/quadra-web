import type { OrgRole } from '../../types/admin'

export function roleLabel(role: OrgRole): string {
  const labels: Record<OrgRole, string> = {
    ORG_ADMIN: 'Admin org.',
    TEAM_ADMIN: 'Admin time',
    ATHLETE: 'Atleta',
    COACHING_STAFF: 'Comissão',
  }

  return labels[role]
}

export function inviteExpiredLabel(isExpired: boolean): string | null {
  return isExpired ? 'Expirado' : null
}
