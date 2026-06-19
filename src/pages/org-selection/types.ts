import type { OrgRole } from '../../types/admin'

export type OrgSelectionTab = 'organizations' | 'invites'

export type InviteDecision = 'ACCEPT' | 'REJECT'

export type MyInvite = {
  id: number
  organizationId: number
  organizationName: string
  role: OrgRole
  teamId: number | null
  teamName: string | null
  jerseyNumber: number | null
  status: 'PENDING'
  sentAt: string
  expiresAt: string | null
  isExpired: boolean
}

export type OrgSelectionInvite = MyInvite & {
  sentAtLabel: string
  expiresAtLabel: string | null
}
