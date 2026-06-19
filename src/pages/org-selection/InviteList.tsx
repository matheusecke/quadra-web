import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { getInitials } from './orgSelectionUtils'
import { roleLabel } from './inviteLabels'
import { useScrollChrome } from './useScrollChrome'
import type { InviteDecision } from '../../types/api'
import type { OrgSelectionInvite } from './types'
import s from './InviteList.module.css'

type InviteListProps = {
  invites: OrgSelectionInvite[]
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  actionInviteId: number | null
  actionError: string | null
  onRetry: () => void
  onResolveInvite: (inviteId: number, decision: InviteDecision) => Promise<void>
}

export function InviteList({
  invites,
  isLoading,
  isError,
  errorMessage,
  actionInviteId,
  actionError,
  onRetry,
  onResolveInvite,
}: InviteListProps) {
  const { scrollRef, state: scrollState, refresh } = useScrollChrome()
  const [confirmingInviteId, setConfirmingInviteId] = useState<number | null>(null)

  useEffect(() => {
    refresh(false)
  }, [invites.length, refresh])

  if (isLoading) {
    return (
      <div className={s.emptyWrap}>
        <span className={s.srOnly}>Carregando convites</span>
        <div className={s.skeletonList}>
          <Skeleton className={s.skeletonItem} height={88} />
          <Skeleton className={s.skeletonItem} height={88} />
          <Skeleton className={s.skeletonItem} height={88} />
        </div>
      </div>
    )
  }

  if (isError && invites.length === 0) {
    return (
      <div className={s.emptyWrap}>
        <ErrorState
          title="Não foi possível carregar os convites"
          description={errorMessage ?? undefined}
          onRetry={onRetry}
        />
      </div>
    )
  }

  if (invites.length === 0) {
    return (
      <div className={s.emptyWrap}>
        <EmptyState
          title="Nenhum convite pendente"
          description="Novos convites aparecerão nesta aba. Você ainda pode selecionar uma organização normalmente."
        />
      </div>
    )
  }

  return (
    <>
      {(actionError || isError) && (
        <div className={s.actionError} role="alert">
          {actionError ?? errorMessage ?? 'Não foi possível carregar os convites.'}
        </div>
      )}
      <div
        className={`${s.wrap} ${scrollState.fadeTop ? s.fadeTop : s.noFadeTop} ${
          scrollState.fadeBottom ? '' : s.noFadeBottom
        }`}
      >
        <div ref={scrollRef} className={s.list}>
          {invites.map((invite) => {
            const isResolving = actionInviteId === invite.id
            const isConfirming = confirmingInviteId === invite.id

            return (
              <article key={invite.id} className={s.item}>
                <div className={s.topline}>
                  <div className={s.identity}>
                    <div className={s.avatar} aria-hidden="true">
                      {getInitials(invite.organizationName)}
                    </div>
                    <div className={s.identityText}>
                      <h3 className={s.org}>{invite.organizationName}</h3>
                      <p className={s.meta}>
                        {invite.teamName ?? 'Sem time vinculado'}
                        {invite.jerseyNumber !== null ? ` · Camisa ${invite.jerseyNumber}` : ''}
                      </p>
                    </div>
                  </div>
                  {invite.isExpired ? (
                    <Badge variant="danger" dot>Expirado</Badge>
                  ) : (
                    <Badge variant="warning" dot>Pendente</Badge>
                  )}
                </div>

                <div className={s.details}>
                  <Badge variant="ghost">{roleLabel(invite.role)}</Badge>
                  <span>{invite.sentAtLabel}</span>
                  {invite.expiresAtLabel && <span>{invite.expiresAtLabel}</span>}
                </div>

                <div className={s.actions}>
                  {isConfirming ? (
                    <>
                      <span className={s.confirmLabel} aria-live="polite">
                        Recusar este convite?
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isResolving}
                        onClick={() => setConfirmingInviteId(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={isResolving}
                        disabled={isResolving}
                        onClick={async () => {
                          await onResolveInvite(invite.id, 'REJECT')
                          setConfirmingInviteId(null)
                        }}
                      >
                        Confirmar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actionInviteId !== null}
                        onClick={() => setConfirmingInviteId(invite.id)}
                      >
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        loading={isResolving}
                        disabled={isResolving || invite.isExpired}
                        onClick={() => onResolveInvite(invite.id, 'ACCEPT')}
                      >
                        Aceitar
                      </Button>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {scrollState.canScroll && (
          <div
            className={`${s.scrollbar} ${scrollState.isScrolling ? s.scrollbarVisible : ''}`}
            aria-hidden="true"
          >
            <div
              className={s.scrollbarThumb}
              style={{
                height: scrollState.thumbHeight,
                transform: `translateY(${scrollState.thumbTop}px)`,
              }}
            />
          </div>
        )}
      </div>
    </>
  )
}
