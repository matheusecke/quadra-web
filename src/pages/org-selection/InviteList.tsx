import { useEffect } from 'react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { getInitials } from './orgSelectionUtils'
import { inviteStatusLabel, inviteStatusVariant, roleLabel } from './inviteLabels'
import { useScrollChrome } from './useScrollChrome'
import type { InviteResolutionStatus, OrgSelectionInvite } from './types'
import s from './InviteList.module.css'

type InviteListProps = {
  invites: OrgSelectionInvite[]
  onResolveInvite: (inviteId: number, status: InviteResolutionStatus) => void
}

export function InviteList({ invites, onResolveInvite }: InviteListProps) {
  const { scrollRef, state: scrollState, refresh } = useScrollChrome()

  useEffect(() => {
    refresh(false)
  }, [invites.length, refresh])

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
    <div
      className={`${s.wrap} ${scrollState.fadeTop ? s.fadeTop : s.noFadeTop} ${
        scrollState.fadeBottom ? '' : s.noFadeBottom
      }`}
    >
      <div ref={scrollRef} className={s.list}>
        {invites.map((invite) => (
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
              <Badge variant={inviteStatusVariant(invite.status)} dot>
                {inviteStatusLabel(invite.status)}
              </Badge>
            </div>

            <div className={s.details}>
              <Badge variant="ghost">{roleLabel(invite.role)}</Badge>
              <span>{invite.sentAt}</span>
              {invite.expiresAt && <span>{invite.expiresAt}</span>}
            </div>

            <div className={s.actions}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onResolveInvite(invite.id, 'REJECTED')}
              >
                Recusar
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onResolveInvite(invite.id, 'ACTIVE')}
              >
                Aceitar
              </Button>
            </div>
          </article>
        ))}
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
  )
}
