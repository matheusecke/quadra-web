import { useState } from 'react'
import { Drawer } from '../admin/Drawer'
import { Button } from '../ui/Button'
import { UserLookupField } from './UserLookupField'
import { orgWriteErrorMessage } from '../../features/org/orgWriteErrorMessage'
import { useOrgMutation } from '../../features/org/queries'
import { useActiveOrgAffiliation } from '../../hooks/useActiveOrgAffiliation'
import { inviteOrgAdmin } from '../../services/orgApi'
import type { UserLookupResult } from '../../types/org'
import s from './orgForm.module.css'

type InvitePersonDrawerProps = {
  open: boolean
  onClose: () => void
}

export function InvitePersonDrawer({ open, onClose }: InvitePersonDrawerProps) {
  const { role } = useActiveOrgAffiliation()
  const [selectedUser, setSelectedUser] = useState<UserLookupResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inviteAdmin = useOrgMutation((input: { userId: number }) => inviteOrgAdmin(input))

  const close = () => {
    setSelectedUser(null)
    setErrorMessage(null)
    onClose()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedUser) return
    setErrorMessage(null)
    inviteAdmin.mutate(
      { userId: selectedUser.id },
      {
        onSuccess: close,
        onError: (error) => setErrorMessage(orgWriteErrorMessage(error, 'invite')),
      },
    )
  }

  return (
    <Drawer open={open} onClose={close} title="Convidar pessoa">
      <form className={s.form} onSubmit={handleSubmit}>
        <UserLookupField
          value={selectedUser}
          onChange={setSelectedUser}
          disabled={inviteAdmin.isPending}
        />
        {role === 'ORG_ADMIN' && (
          <p className={s.hint}>A pessoa convidada terá o papel de administrador da organização.</p>
        )}
        {errorMessage && (
          <p className={s.error} role="alert">
            {errorMessage}
          </p>
        )}
        <div className={s.actions}>
          <Button type="button" variant="ghost" onClick={close} disabled={inviteAdmin.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!selectedUser || inviteAdmin.isPending}
            loading={inviteAdmin.isPending}
          >
            Enviar convite
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
