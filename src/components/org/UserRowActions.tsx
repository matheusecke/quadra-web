import { useEffect, useRef, useState } from 'react'
import { EditMembershipDrawer } from './EditMembershipDrawer'
import { InlineConfirm } from './InlineConfirm'
import { Button } from '../ui/Button'
import { orgWriteErrorMessage } from '../../features/org/orgWriteErrorMessage'
import type { OrgWriteOperation } from '../../features/org/orgWriteErrorMessage'
import { useOrgMutation } from '../../features/org/queries'
import { useActiveOrgAffiliation } from '../../hooks/useActiveOrgAffiliation'
import {
  activateUserAffiliation,
  cancelUserInvite,
  deactivateUserAffiliation,
  resendUserInvite,
} from '../../services/orgApi'
import type { OrgUserAffiliation } from '../../types/org'
import s from './rowActions.module.css'

type ActionKind = 'resend' | 'cancel' | 'deactivate' | 'activate'

const ACTIONS: Record<ActionKind, {
  label: string
  message: string
  operation: OrgWriteOperation
  variant?: 'danger'
  run: (affiliationId: number) => Promise<unknown>
}> = {
  resend: {
    label: 'Reenviar convite',
    message: 'Este convite receberá um novo prazo para ser respondido.',
    operation: 'resend',
    run: resendUserInvite,
  },
  cancel: {
    label: 'Cancelar convite',
    message: 'O convite desta pessoa será cancelado.',
    operation: 'cancel',
    variant: 'danger',
    run: cancelUserInvite,
  },
  deactivate: {
    label: 'Desativar',
    message: 'O acesso desta pessoa à organização será suspenso.',
    operation: 'deactivate',
    variant: 'danger',
    run: deactivateUserAffiliation,
  },
  activate: {
    label: 'Ativar',
    message: 'O papel e a equipe anteriores desta pessoa serão restaurados.',
    operation: 'activate',
    run: activateUserAffiliation,
  },
}

const ACTIONS_BY_STATUS: Record<string, ActionKind[]> = {
  PENDING: ['resend', 'cancel'],
  ACTIVE: ['deactivate'],
  INACTIVE: ['activate'],
}

export function UserRowActions({ affiliation }: { affiliation: OrgUserAffiliation }) {
  const [pendingAction, setPendingAction] = useState<ActionKind | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const restoreActionRef = useRef<ActionKind | null>(null)
  const mutation = useOrgMutation((kind: ActionKind) => ACTIONS[kind].run(affiliation.id))

  const [isEditOpen, setIsEditOpen] = useState(false)
  const { role: actorRole } = useActiveOrgAffiliation()
  const canEditMembership =
    affiliation.canManage &&
    actorRole === 'TEAM_ADMIN' &&
    affiliation.status === 'ACTIVE' &&
    (affiliation.role === 'ATHLETE' || affiliation.role === 'COACHING_STAFF')

  useEffect(() => {
    if (!pendingAction && restoreActionRef.current) {
      wrapRef.current?.querySelector<HTMLButtonElement>(`button[data-action="${restoreActionRef.current}"]`)?.focus()
      restoreActionRef.current = null
    }
  }, [pendingAction])

  const available = affiliation.canManage ? ACTIONS_BY_STATUS[affiliation.status] ?? [] : []
  if (available.length === 0 && !canEditMembership) return null

  const confirm = pendingAction ? ACTIONS[pendingAction] : null

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

  return (
    <div ref={wrapRef} className={s.wrap}>
      {confirm ? (
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
      ) : (
        <>
          {canEditMembership && (
            <Button size="sm" variant="ghost" onClick={() => setIsEditOpen(true)}>
              Editar
            </Button>
          )}
          {available.map((kind) => (
            <Button key={kind} data-action={kind} size="sm" variant="ghost" onClick={() => setPendingAction(kind)}>
              {ACTIONS[kind].label}
            </Button>
          ))}
          {canEditMembership && isEditOpen && (
            <EditMembershipDrawer
              affiliation={affiliation}
              open={isEditOpen}
              onClose={() => setIsEditOpen(false)}
            />
          )}
        </>
      )}
    </div>
  )
}
