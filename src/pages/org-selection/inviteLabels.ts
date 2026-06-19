import type { AffiliationStatus, OrgRole } from '../../types/admin'

export function roleLabel(role: OrgRole): string {
  const labels: Record<OrgRole, string> = {
    ORG_ADMIN: 'Admin org.',
    TEAM_ADMIN: 'Admin time',
    ATHLETE: 'Atleta',
    COACHING_STAFF: 'Comissão',
  }

  return labels[role]
}

export function inviteStatusLabel(status: AffiliationStatus): string {
  if (status === 'ACTIVE') return 'Aceito'
  if (status === 'REJECTED') return 'Recusado'
  return 'Pendente'
}

export function inviteStatusVariant(status: AffiliationStatus) {
  if (status === 'ACTIVE') return 'success' as const
  if (status === 'REJECTED') return 'danger' as const
  return 'warning' as const
}
