import type { MyInvite } from '../../types/api'

export type OrgSelectionTab = 'organizations' | 'invites'

export type OrgSelectionInvite = MyInvite & {
  sentAtLabel: string
  expiresAtLabel: string | null
}
