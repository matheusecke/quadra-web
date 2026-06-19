import type { AffiliationStatus, OrgRole } from '../../types/admin'

export type OrgSelectionTab = 'organizations' | 'invites'

export type OrgSelectionInvite = {
  id: number
  organizationName: string
  role: OrgRole
  teamName: string | null
  jerseyNumber: number | null
  status: AffiliationStatus
  sentAt: string
  expiresAt: string | null
}

export type InviteResolutionStatus = Exclude<AffiliationStatus, 'PENDING'>
