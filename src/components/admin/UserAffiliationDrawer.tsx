import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button/Button'
import { Field } from '../ui/Field/Field'
import { SearchSelect, type SearchSelectOption } from './SearchSelect'
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

const searchUsers = (q: string): Promise<SearchSelectOption[]> =>
  adminApi.listUsers({ page: 1, limit: 10, q }).then((res) =>
    res.data.map((u) => ({ id: u.id, label: u.name, secondary: u.email })),
  )

const searchTeams = (q: string): Promise<SearchSelectOption[]> =>
  adminApi.listTeams({ page: 1, limit: 10, q }).then((res) =>
    res.data.map((t) => ({ id: t.id, label: t.name })),
  )

function UserAffiliationEditForm({ affiliation, orgId, onSaved }: EditFormProps) {
  const queryClient = useQueryClient()
  const [role, setRole] = useState<OrgRole>(affiliation.role)
  const [selectedTeam, setSelectedTeam] = useState<SearchSelectOption | null>(
    affiliation.team ? { id: affiliation.team.id, label: affiliation.team.name } : null,
  )
  const [localStatus, setLocalStatus] = useState<AffiliationStatus>(affiliation.status)
  const [saveError, setSaveError] = useState<string | null>(null)

  const saveMutation = useMutation({
    mutationFn: () => Promise.all([
      adminApi.updateUserAffiliation(orgId, affiliation.id, {
        role,
        teamId: selectedTeam?.id ?? null,
      }),
      ...(localStatus !== affiliation.status
        ? [adminApi.updateUserAffiliationStatus(orgId, affiliation.id, localStatus)]
        : []),
    ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-affiliations', orgId] })
      onSaved()
    },
    onError: () => setSaveError('Não foi possível salvar.'),
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
      {role !== 'ORG_ADMIN' && (
        <Field label="Equipe (opcional)">
          <SearchSelect
            value={selectedTeam}
            onChange={setSelectedTeam}
            onSearch={searchTeams}
            placeholder="Buscar equipe por nome..."
          />
        </Field>
      )}
      <div className={s.toggleRow}>
        <span className={s.toggleLabel}>Status</span>
        <button
          type="button"
          className={`${s.toggleBtn} ${localStatus === 'ACTIVE' ? s.toggleActive : s.toggleInactive}`}
          onClick={() => setLocalStatus(localStatus === 'ACTIVE' ? 'REJECTED' : 'ACTIVE')}
        >
          {localStatus === 'ACTIVE' ? 'Ativo' : localStatus === 'PENDING' ? 'Pendente' : 'Rejeitado'}
        </button>
      </div>
      {affiliation.status === 'PENDING' && (
        <Button variant="ghost" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>
          {resendMutation.isPending ? 'Reenviando...' : 'Reenviar convite'}
        </Button>
      )}
      <div className={s.footer}>
        <Button
          variant="primary"
          onClick={() => { setSaveError(null); saveMutation.mutate() }}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Salvando...' : <><em>Salvar</em> →</>}
        </Button>
      </div>
    </>
  )
}

function UserAffiliationInviteForm({ orgId, onSaved }: InviteFormProps) {
  const [selectedUser, setSelectedUser] = useState<SearchSelectOption | null>(null)
  const [role, setRole] = useState<OrgRole>('ATHLETE')
  const [selectedTeam, setSelectedTeam] = useState<SearchSelectOption | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const inviteMutation = useMutation({
    mutationFn: () =>
      adminApi.createUserAffiliation(orgId, {
        userId: selectedUser!.id,
        role,
        teamId: selectedTeam?.id,
      }),
    onSuccess: () => onSaved(),
    onError: () => setSaveError('Não foi possível criar o vínculo.'),
  })

  const canSubmit = selectedUser !== null && (role === 'ORG_ADMIN' || selectedTeam !== null)

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="Usuário">
        <SearchSelect
          value={selectedUser}
          onChange={setSelectedUser}
          onSearch={searchUsers}
          placeholder="Buscar usuário por nome ou email..."
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
      {role !== 'ORG_ADMIN' && (
        <Field label="Equipe">
          <SearchSelect
            value={selectedTeam}
            onChange={setSelectedTeam}
            onSearch={searchTeams}
            placeholder="Buscar equipe por nome..."
          />
        </Field>
      )}
      <div className={s.footer}>
        <Button
          variant="primary"
          onClick={() => { setSaveError(null); inviteMutation.mutate() }}
          disabled={inviteMutation.isPending || !canSubmit}
        >
          {inviteMutation.isPending ? 'Convidando...' : <><em>Convidar</em> →</>}
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
