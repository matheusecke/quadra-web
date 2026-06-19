import api from './api'
import type { ApiResponse, InviteDecision, MyInvite } from '../types/api'

export async function listMyInvites(): Promise<MyInvite[]> {
  const response = await api.get<ApiResponse<MyInvite[]>>('/auth/invites')
  return response.data.data
}

export async function respondToMyInvite(
  inviteId: number,
  decision: InviteDecision,
): Promise<void> {
  await api.post(`/auth/invites/${inviteId}/respond`, { decision })
}
