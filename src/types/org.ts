import type { AffiliationStatus, AffiliationTeam, AffiliationUser, OrgRole } from './admin'

/** Closed enum mirrored from the API contract. Declared here so types never depend on a feature folder. */
export type BasketballPosition = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export type OrgUserAffiliation = {
  id: number
  userId: number
  user: AffiliationUser
  organizationId: number
  role: OrgRole
  teamId: number | null
  team: AffiliationTeam | null
  jerseyNumber: number | null
  position: BasketballPosition | null
  status: AffiliationStatus
  inviteExpiresAt: string | null
  isInviteExpired: boolean
  /** Derived by the API for the calling actor. Never a substitute for the server-side check. */
  canManage: boolean
  createdByUserId: number | null
  createdAt: string
  updatedAt: string
}

export type OrgTeamAffiliationTeam = {
  id: number
  name: string
  shortName: string
  city: string | null
  state: string | null
}

export type OrgTeamAffiliation = {
  id: number
  organizationId: number
  teamId: number
  team: OrgTeamAffiliationTeam
  status: AffiliationStatus
  activeUserCount: number
  pendingAdminInviteCount: number
  createdByUserId: number | null
  createdAt: string
  updatedAt: string
}

export type TeamAffiliationCandidate = {
  id: number
  name: string
  shortName: string
  city: string | null
  state: string | null
  affiliation: { id: number; status: AffiliationStatus } | null
}

export type UserLookupResult = {
  id: number
  name: string
  email: string
}

export type InviteTeamMemberInput = {
  userId: number
  role: 'ATHLETE' | 'COACHING_STAFF'
  jerseyNumber?: number
  position?: BasketballPosition
}

export type CreateTeamOnboardingInput =
  | { teamId: number; adminUserId: number }
  | { teamName: string; adminUserId: number }

export type UpdateMembershipInput = {
  jerseyNumber?: number | null
  position?: BasketballPosition | null
}

export type UpdateTeamInput = {
  name: string
  shortName: string
  city: string | null
  state: string | null
}
