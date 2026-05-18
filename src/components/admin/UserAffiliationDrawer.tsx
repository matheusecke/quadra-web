import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button/Button'
import { Field } from '../ui/Field/Field'
import { Input } from '../ui/Input/Input'
import * as adminApi from '../../services/adminApi'
import type { AdminUserAffiliation, AffiliationStatus, OrgRole } from '../../types/admin'
import s from './UserDrawer.module.css'

type Props = {
  affiliation: AdminUserAffiliation | null
  orgId: number
  onClose: () => void
  onSaved: () => void
  mode: 'edit' | 'invite'
  open?: boolean
}

type EditFormProps = {
  affiliation: AdminUserAffiliation
  orgId: number
  onSaved: () => void
}

type InviteFormProps = {
  orgId: number
  onSaved: () => void
}

function UserAffiliationEditForm({ affiliation, orgId, onSaved }: EditFormProps) {
  const queryClient = useQueryClient()
  const [role, setRole] = useState<OrgRole>(affiliation.role)
  const [teamId, setTeamId] = useState(affiliation.teamId?.toString() ?? '')
  const [saveError, setSaveError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateUserAffiliation(orgId, affiliation.id, {
        role,
        teamId: teamId ? Number(teamId) : null,
      }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-user-affiliations', orgId] }); onSaved() },
    onError: () => setSaveError('Não foi possível salvar.'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: AffiliationStatus) => adminApi.updateUserAffiliationStatus(orgId, affiliation.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user-affiliations', orgId] }),
  })

  const resendMutation = useMutation({
    mutationFn: () => adminApi.resendUserAffiliationInvite(orgId, affiliation.id),
  })

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="Papel">
        <select className={s.select} value={role} onChange={(e) => setRole(e.target.value as OrgRole)} aria-label="Papel">
          <option value="ORG_ADMIN">ORG_ADMIN</option>
          <option value="TEAM_ADMIN">TEAM_ADMIN</option>
          <option value="ATHLETE">ATHLETE</option>
          <option value="COACHING_STAFF">COACHING_STAFF</option>
        </select>
      </Field>
      <Field label="ID da equipe (opcional)">
        <Input type="number" value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="Deixe em branco para nenhuma" />
      </Field>
      <div className={s.toggleRow}>
        <span className={s.toggleLabel}>Status</span>
        <button
          type="button"
          className={`${s.toggleBtn} ${affiliation.status === 'ACTIVE' ? s.toggleActive : s.toggleInactive}`}
          onClick={() => statusMutation.mutate(affiliation.status === 'ACTIVE' ? 'REJECTED' : 'ACTIVE')}
          disabled={statusMutation.isPending}
        >
          {affiliation.status === 'ACTIVE' ? 'Ativo' : affiliation.status === 'PENDING' ? 'Pendente' : 'Rejeitado'}
        </button>
      </div>
      {affiliation.status === 'PENDING' && (
        <Button variant="ghost" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>
          {resendMutation.isPending ? 'Reenviando...' : 'Reenviar convite'}
        </Button>
      )}
      <div className={s.footer}>
        <Button variant="primary" onClick={() => { setSaveError(null); updateMutation.mutate() }} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </>
  )
}

function UserAffiliationInviteForm({ orgId, onSaved }: InviteFormProps) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<OrgRole>('ATHLETE')
  const [teamId, setTeamId] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const inviteMutation = useMutation({
    mutationFn: () =>
      adminApi.createUserAffiliation(orgId, {
        userId: Number(userId),
        role,
        teamId: teamId ? Number(teamId) : undefined,
      }),
    onSuccess: () => onSaved(),
    onError: () => setSaveError('Não foi possível criar o vínculo.'),
  })

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="ID do usuário">
        <Input
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="ID numérico do usuário"
        />
      </Field>
      <Field label="Papel">
        <select className={s.select} value={role} onChange={(e) => setRole(e.target.value as OrgRole)} aria-label="Papel">
          <option value="ORG_ADMIN">ORG_ADMIN</option>
          <option value="TEAM_ADMIN">TEAM_ADMIN</option>
          <option value="ATHLETE">ATHLETE</option>
          <option value="COACHING_STAFF">COACHING_STAFF</option>
        </select>
      </Field>
      <Field label="ID da equipe (opcional)">
        <Input type="number" value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="Deixe em branco para nenhuma" />
      </Field>
      <div className={s.footer}>
        <Button variant="primary" onClick={() => { setSaveError(null); inviteMutation.mutate() }} disabled={inviteMutation.isPending}>
          {inviteMutation.isPending ? 'Convidando...' : 'Convidar'}
        </Button>
      </div>
    </>
  )
}

export function UserAffiliationDrawer({ affiliation, orgId, onClose, onSaved, mode, open }: Props) {
  const isOpen = mode === 'edit' ? affiliation !== null : (open ?? false)
  const title = mode === 'invite' ? 'Convidar usuário' : `Vínculo #${affiliation?.id ?? ''}`

  return (
    <Drawer open={isOpen} onClose={onClose} title={title}>
      {mode === 'edit' && affiliation && (
        <UserAffiliationEditForm key={affiliation.id} affiliation={affiliation} orgId={orgId} onSaved={onSaved} />
      )}
      {mode === 'invite' && (
        <UserAffiliationInviteForm key="invite" orgId={orgId} onSaved={onSaved} />
      )}
    </Drawer>
  )
}
