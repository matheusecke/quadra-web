import type { BadgeVariant } from '../../components/ui'
import type { AffiliationStatus, OrgRole } from '../../types/admin'
import type { BasketballPosition } from '../../types/org'

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  ORG_ADMIN: 'Administrador da organização',
  TEAM_ADMIN: 'Administrador da equipe',
  ATHLETE: 'Atleta',
  COACHING_STAFF: 'Comissão técnica',
}

const USER_STATUS_LABELS: Record<AffiliationStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  REJECTED: 'Rejeitado',
}

const TEAM_STATUS_LABELS: Record<AffiliationStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  REJECTED: 'Rejeitada',
}

const STATUS_VARIANTS: Record<AffiliationStatus, BadgeVariant> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'default',
  REJECTED: 'danger',
}

/** Only a still-pending invite can read as expired; the flag is meaningless for every other status. */
const isExpiredInvite = (status: AffiliationStatus, isInviteExpired: boolean) =>
  status === 'PENDING' && isInviteExpired

export function userAffiliationStatusLabel(
  status: AffiliationStatus,
  isInviteExpired = false,
): string {
  return isExpiredInvite(status, isInviteExpired) ? 'Expirado' : USER_STATUS_LABELS[status]
}

export function teamAffiliationStatusLabel(status: AffiliationStatus): string {
  return TEAM_STATUS_LABELS[status]
}

export function affiliationStatusVariant(
  status: AffiliationStatus,
  isInviteExpired = false,
): BadgeVariant {
  return isExpiredInvite(status, isInviteExpired) ? 'danger' : STATUS_VARIANTS[status]
}

export function membershipLabel(
  jerseyNumber: number | null,
  position: BasketballPosition | null,
): string {
  const parts = [jerseyNumber === null ? null : `#${jerseyNumber}`, position].filter(Boolean)
  return parts.length === 0 ? '—' : parts.join(' · ')
}
