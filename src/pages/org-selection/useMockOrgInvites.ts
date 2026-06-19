import { useMemo, useState } from 'react'
import { mockOrgSelectionInvites } from './mockInvites'
import type { InviteResolutionStatus } from './types'

export function useMockOrgInvites() {
  const [invites, setInvites] = useState(() => mockOrgSelectionInvites)

  const pendingInvites = useMemo(
    () => invites.filter((invite) => invite.status === 'PENDING'),
    [invites],
  )

  const resolveInvite = (inviteId: number, status: InviteResolutionStatus) => {
    setInvites((current) =>
      current.map((invite) => (invite.id === inviteId ? { ...invite, status } : invite)),
    )
  }

  return {
    invites,
    pendingInvites,
    pendingCount: pendingInvites.length,
    resolveInvite,
  }
}
