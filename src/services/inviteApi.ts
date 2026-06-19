import api from './api'
import type { ApiResponse } from '../types/api'
import type { InviteDecision, MyInvite } from '../pages/org-selection/types'

export async function listMyInvites(): Promise<MyInvite[]> {
  const response = await api.get<ApiResponse<MyInvite[]>>('/auth/invites')
  return response.data.data
}

export async function respondToMyInvite(
  inviteId: number,
  decision: InviteDecision,
): Promise<MyInvite> {
  const response = await api.post<ApiResponse<MyInvite>>(`/auth/invites/${inviteId}/respond`, {
    decision,
  })
  return response.data.data
}
