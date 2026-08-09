import { useEffect, useRef, useState } from 'react'
import { InlineConfirm } from './InlineConfirm'
import { TeamOnboardingDrawer } from './TeamOnboardingDrawer'
import { Button } from '../ui/Button'
import { orgWriteErrorMessage } from '../../features/org/orgWriteErrorMessage'
import type { OrgWriteOperation } from '../../features/org/orgWriteErrorMessage'
import { useOrgMutation } from '../../features/org/queries'
import {
  activateTeamAffiliation,
  cancelTeamInclusion,
  deactivateTeamAffiliation,
  resendTeamInvites,
} from '../../services/orgApi'
import type { OrgTeamAffiliation } from '../../types/org'
import s from './rowActions.module.css'

type ActionKind = 'resendAll' | 'cancelTeam' | 'deactivate' | 'activate'

const ACTIONS: Record<ActionKind, {
  label: string
  message: string
  operation: OrgWriteOperation
  variant?: 'danger'
  run: (affiliationId: number) => Promise<unknown>
}> = {
  resendAll: {
    label: 'Reenviar todos',
    message:
      'Todos os convites pendentes desta equipe receberão um novo prazo para serem respondidos.',
    operation: 'resendAll',
    run: resendTeamInvites,
  },
  cancelTeam: {
    label: 'Cancelar inclusão',
    message: 'Todos os convites pendentes desta equipe serão cancelados.',
    operation: 'cancelTeam',
    variant: 'danger',
    run: cancelTeamInclusion,
  },
  deactivate: {
    label: 'Desativar',
    message: 'Membros ativos serão desativados e convites pendentes serão cancelados.',
    operation: 'deactivate',
    variant: 'danger',
    run: deactivateTeamAffiliation,
  },
  activate: {
    label: 'Ativar',
    message: 'Os membros permanecerão inativos e deverão ser ativados individualmente.',
    operation: 'activate',
    run: activateTeamAffiliation,
  },
}

const ACTIONS_BY_STATUS: Record<string, ActionKind[]> = {
  PENDING: ['resendAll', 'cancelTeam'],
  ACTIVE: ['deactivate'],
  INACTIVE: ['activate'],
}

export function TeamRowActions({ affiliation }: { affiliation: OrgTeamAffiliation }) {
  const [pendingAction, setPendingAction] = useState<ActionKind | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const restoreActionRef = useRef<ActionKind | null>(null)
  const mutation = useOrgMutation((kind: ActionKind) => ACTIONS[kind].run(affiliation.id))

  const available = ACTIONS_BY_STATUS[affiliation.status] ?? []
  // Spec §6.2: an inactive team affiliation offers no administrator invite until it is activated.
  const canInviteAdmin = affiliation.status === 'PENDING' || affiliation.status === 'ACTIVE'
  const confirm = pendingAction ? ACTIONS[pendingAction] : null

  useEffect(() => {
    if (!pendingAction && restoreActionRef.current) {
      wrapRef.current?.querySelector<HTMLButtonElement>(`button[data-action="${restoreActionRef.current}"]`)?.focus()
      restoreActionRef.current = null
    }
  }, [pendingAction])

  const close = () => {
    restoreActionRef.current = pendingAction
    setPendingAction(null)
    setErrorMessage(null)
  }

  const closeAfterSuccess = () => {
    wrapRef.current?.closest<HTMLElement>('[data-org-list-focus-target]')?.focus()
    setPendingAction(null)
    setErrorMessage(null)
  }

  if (confirm) {
    return (
      <div ref={wrapRef} className={s.wrap}>
        <InlineConfirm
          message={confirm.message}
          confirmLabel="Confirmar"
          variant={confirm.variant ?? 'primary'}
          isPending={mutation.isPending}
          errorMessage={errorMessage}
          onCancel={close}
          onConfirm={() => {
            setErrorMessage(null)
            mutation.mutate(pendingAction as ActionKind, {
              onSuccess: closeAfterSuccess,
              onError: (error) => setErrorMessage(orgWriteErrorMessage(error, confirm.operation)),
            })
          }}
        />
      </div>
    )
  }

  return (
    <div ref={wrapRef} className={s.wrap}>
      {canInviteAdmin && (
        <Button size="sm" variant="ghost" onClick={() => setIsInviteOpen(true)}>
          Convidar administrador
        </Button>
      )}
      {available.map((kind) => (
        <Button key={kind} data-action={kind} size="sm" variant="ghost" onClick={() => setPendingAction(kind)}>
          {ACTIONS[kind].label}
        </Button>
      ))}
      {canInviteAdmin && isInviteOpen && (
        <TeamOnboardingDrawer
          open
          onClose={() => setIsInviteOpen(false)}
          fixedTeam={{ id: affiliation.teamId, name: affiliation.team.name }}
        />
      )}
    </div>
  )
}
