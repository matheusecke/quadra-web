import { useCallback, useEffect, useMemo, useState } from 'react'
import { listMyInvites, respondToMyInvite } from '../../services/inviteApi'
import type { InviteDecision, MyInvite, OrgSelectionInvite } from './types'

export type ResolveInviteResult = 'accepted' | 'rejected'

export type UseOrgInvitesResult = {
  pendingInvites: OrgSelectionInvite[]
  pendingCount: number
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  actionInviteId: number | null
  actionError: string | null
  refetch: () => Promise<void>
  resolveInvite: (inviteId: number, decision: InviteDecision) => Promise<ResolveInviteResult>
}

function formatSentAtLabel(sentAt: string): string {
  const date = new Date(sentAt)
  if (Number.isNaN(date.getTime())) return 'Enviado em data indisponível'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  const days = Math.max(1, Math.round(Math.abs(diffMs) / dayMs))

  if (Math.abs(diffMs) < dayMs) return 'Enviado hoje'
  if (days === 1) return 'Enviado ontem'
  return `Enviado há ${days} dias`
}

function formatExpiresAtLabel(expiresAt: string | null, isExpired: boolean): string | null {
  if (!expiresAt || isExpired) return null

  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return 'Expira em data indisponível'

  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  const days = Math.max(1, Math.round(Math.abs(diffMs) / dayMs))

  if (Math.abs(diffMs) < dayMs) return 'Expira hoje'
  if (days === 1) return 'Expira amanhã'
  return `Expira em ${days} dias`
}

function mapInviteToOrgSelectionInvite(invite: MyInvite): OrgSelectionInvite {
  return {
    ...invite,
    sentAtLabel: formatSentAtLabel(invite.sentAt),
    expiresAtLabel: formatExpiresAtLabel(invite.expiresAt, invite.isExpired),
  }
}

function getInviteErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível carregar os convites. Tente novamente.'
}

export function useOrgInvites(): UseOrgInvitesResult {
  const [invites, setInvites] = useState<MyInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionInviteId, setActionInviteId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    setErrorMessage(null)
    try {
      const data = await listMyInvites()
      setInvites(data)
    } catch (error) {
      setIsError(true)
      setErrorMessage(getInviteErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)
    setIsError(false)
    setErrorMessage(null)

    listMyInvites()
      .then((data) => {
        if (isMounted) {
          setInvites(data)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setIsError(true)
          setErrorMessage(getInviteErrorMessage(error))
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const pendingInvites = useMemo(
    () => invites.map(mapInviteToOrgSelectionInvite),
    [invites],
  )

  const resolveInvite = useCallback(async (inviteId: number, decision: InviteDecision): Promise<ResolveInviteResult> => {
    setActionError(null)
    setActionInviteId(inviteId)

    try {
      await respondToMyInvite(inviteId, decision)
      setInvites((current) => current.filter((invite) => invite.id !== inviteId))
      return decision === 'ACCEPT' ? 'accepted' : 'rejected'
    } catch {
      setActionError('Não foi possível responder ao convite. Tente novamente.')
      throw new Error('Não foi possível responder ao convite. Tente novamente.')
    } finally {
      setActionInviteId(null)
    }
  }, [])

  return {
    pendingInvites,
    pendingCount: pendingInvites.length,
    isLoading,
    isError,
    errorMessage,
    actionInviteId,
    actionError,
    refetch,
    resolveInvite,
  }
}
