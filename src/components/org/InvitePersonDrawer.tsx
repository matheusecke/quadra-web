import { useEffect, useRef, useState } from 'react'
import { Drawer } from '../admin/Drawer'
import { Button } from '../ui/Button'
import { Combobox } from '../ui/Combobox/Combobox'
import { Field } from '../ui/Field'
import { NumberField } from '../ui/NumberField'
import { UserLookupField } from './UserLookupField'
import { orgWriteErrorMessage } from '../../features/org/orgWriteErrorMessage'
import { useOrgMutation } from '../../features/org/queries'
import { useActiveOrgAffiliation } from '../../hooks/useActiveOrgAffiliation'
import { inviteOrgAdmin, inviteTeamMember } from '../../services/orgApi'
import type { BasketballPosition, InviteTeamMemberInput, UserLookupResult } from '../../types/org'
import s from './orgForm.module.css'

type InvitePersonDrawerProps = {
  open: boolean
  onClose: () => void
}

const MEMBER_ROLE_OPTIONS = [
  { value: 'ATHLETE', label: 'Atleta' },
  { value: 'COACHING_STAFF', label: 'Comissão técnica' },
]

const POSITION_OPTIONS = (['PG', 'SG', 'SF', 'PF', 'C'] as const).map((position) => ({
  value: position,
  label: position,
}))

export function InvitePersonDrawer({ open, onClose }: InvitePersonDrawerProps) {
  const { role, teamId } = useActiveOrgAffiliation()
  const [selectedUser, setSelectedUser] = useState<UserLookupResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const [memberRole, setMemberRole] = useState<'ATHLETE' | 'COACHING_STAFF'>('ATHLETE')
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('')
  const [position, setPosition] = useState<BasketballPosition | null>(null)

  const inviteAdmin = useOrgMutation((input: { userId: number }) => inviteOrgAdmin(input))
  const isTeamAdmin = role === 'TEAM_ADMIN'
  const inviteMember = useOrgMutation((input: InviteTeamMemberInput) =>
    inviteTeamMember(teamId as number, input),
  )
  const isPending = inviteAdmin.isPending || inviteMember.isPending
  const isAthlete = isTeamAdmin && memberRole === 'ATHLETE'
  const canSubmit =
    selectedUser !== null && (!isAthlete || (jerseyNumber !== '' && position !== null))

  useEffect(() => {
    if (errorMessage) errorRef.current?.focus()
  }, [errorMessage])

  const close = () => {
    setSelectedUser(null)
    setErrorMessage(null)
    setMemberRole('ATHLETE')
    setJerseyNumber('')
    setPosition(null)
    onClose()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedUser || !canSubmit) return
    setErrorMessage(null)

    const handlers = {
      onSuccess: close,
      onError: (error: unknown) => setErrorMessage(orgWriteErrorMessage(error, 'invite')),
    }

    if (!isTeamAdmin) {
      inviteAdmin.mutate({ userId: selectedUser.id }, handlers)
      return
    }

    inviteMember.mutate(
      isAthlete
        ? {
            userId: selectedUser.id,
            role: 'ATHLETE',
            jerseyNumber: jerseyNumber as number,
            position: position as BasketballPosition,
          }
        : { userId: selectedUser.id, role: 'COACHING_STAFF' },
      handlers,
    )
  }

  return (
    <Drawer open={open} onClose={close} title="Convidar pessoa">
      <form className={s.form} onSubmit={handleSubmit}>
        <UserLookupField value={selectedUser} onChange={setSelectedUser} disabled={isPending} />
        {!isTeamAdmin && (
          <p className={s.hint}>A pessoa convidada terá o papel de administrador da organização.</p>
        )}
        {isTeamAdmin && (
          <>
            <Field label="Papel" id="invite-role">
              <Combobox
                id="invite-role"
                aria-label="Papel"
                options={MEMBER_ROLE_OPTIONS}
                value={memberRole}
                onChange={(value) => setMemberRole(value as 'ATHLETE' | 'COACHING_STAFF')}
                disabled={isPending}
              />
            </Field>
            {isAthlete && (
              <>
                <Field label="Camisa" id="invite-jersey" required>
                  <NumberField
                    id="invite-jersey"
                    aria-label="Camisa"
                    value={jerseyNumber}
                    onValueChange={setJerseyNumber}
                    min={0}
                    max={99}
                    controlLabel="camisa"
                    disabled={isPending}
                  />
                </Field>
                <Field label="Posição" id="invite-position" required>
                  <Combobox
                    id="invite-position"
                    aria-label="Posição"
                    options={POSITION_OPTIONS}
                    value={position}
                    onChange={(value) => setPosition(value as BasketballPosition)}
                    disabled={isPending}
                  />
                </Field>
              </>
            )}
          </>
        )}
        {errorMessage && (
          <p ref={errorRef} className={s.error} role="alert" tabIndex={-1}>
            {errorMessage}
          </p>
        )}
        <div className={s.actions}>
          <Button type="button" variant="ghost" onClick={close} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit || isPending} loading={isPending}>
            Enviar convite
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
