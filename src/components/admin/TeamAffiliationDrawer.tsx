import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button/Button'
import { Field } from '../ui/Field/Field'
import { Input } from '../ui/Input/Input'
import { SearchSelect, type SearchSelectOption } from './SearchSelect'
import * as adminApi from '../../services/adminApi'
import type { AdminTeamAffiliation, AffiliationStatus } from '../../types/admin'
import s from './UserDrawer.module.css'

type Props = {
  affiliation: AdminTeamAffiliation | null
  orgId: number
  onClose: () => void
  onSaved: () => void
  mode: 'edit' | 'invite'
  open?: boolean
}

const searchTeams = (q: string): Promise<SearchSelectOption[]> =>
  adminApi.listTeams({ page: 1, limit: 10, q }).then((res) =>
    res.data.map((t) => ({ id: t.id, label: t.name })),
  )

function TeamAffiliationEditForm({
  affiliation,
  orgId,
  onSaved,
}: {
  affiliation: AdminTeamAffiliation
  orgId: number
  onSaved: () => void
}) {
  const queryClient = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: (status: AffiliationStatus) =>
      adminApi.updateTeamAffiliationStatus(orgId, affiliation.id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-team-affiliations', orgId] }),
  })

  const resendMutation = useMutation({
    mutationFn: () => adminApi.resendTeamAffiliationInvite(orgId, affiliation.id),
  })

  void onSaved

  return (
    <>
      <Field label="Equipe">
        <Input type="text" value={affiliation.team.name} readOnly disabled />
      </Field>
      <div className={s.toggleRow}>
        <span className={s.toggleLabel}>Status</span>
        <button
          type="button"
          className={`${s.toggleBtn} ${affiliation.status === 'ACTIVE' ? s.toggleActive : s.toggleInactive}`}
          onClick={() =>
            statusMutation.mutate(affiliation.status === 'ACTIVE' ? 'REJECTED' : 'ACTIVE')
          }
          disabled={statusMutation.isPending}
        >
          {affiliation.status === 'ACTIVE'
            ? 'Ativo'
            : affiliation.status === 'PENDING'
              ? 'Pendente'
              : 'Rejeitado'}
        </button>
      </div>
      {affiliation.status === 'PENDING' && (
        <Button
          variant="ghost"
          onClick={() => resendMutation.mutate()}
          disabled={resendMutation.isPending}
        >
          {resendMutation.isPending ? 'Reenviando...' : 'Reenviar convite'}
        </Button>
      )}
    </>
  )
}

function TeamAffiliationInviteForm({
  orgId,
  onSaved,
}: {
  orgId: number
  onSaved: () => void
}) {
  const [selectedTeam, setSelectedTeam] = useState<SearchSelectOption | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const inviteMutation = useMutation({
    mutationFn: () => adminApi.createTeamAffiliation(orgId, { teamId: selectedTeam!.id }),
    onSuccess: () => onSaved(),
    onError: () => setSaveError('Não foi possível criar o vínculo.'),
  })

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="Equipe">
        <SearchSelect
          value={selectedTeam}
          onChange={setSelectedTeam}
          onSearch={searchTeams}
          placeholder="Buscar equipe por nome..."
        />
      </Field>
      <div className={s.footer}>
        <Button
          variant="primary"
          onClick={() => { setSaveError(null); inviteMutation.mutate() }}
          disabled={inviteMutation.isPending || selectedTeam === null}
        >
          {inviteMutation.isPending ? 'Convidando...' : <><em>Convidar</em> →</>}
        </Button>
      </div>
    </>
  )
}

export function TeamAffiliationDrawer({
  affiliation,
  orgId,
  onClose,
  onSaved,
  mode,
  open,
}: Props) {
  const isOpen = mode === 'edit' ? affiliation !== null : (open ?? false)
  const title = mode === 'invite' ? 'Convidar equipe' : `Vínculo #${affiliation?.id ?? ''}`

  return (
    <Drawer open={isOpen} onClose={onClose} title={title}>
      {mode === 'edit' && affiliation && (
        <TeamAffiliationEditForm
          key={affiliation.id}
          affiliation={affiliation}
          orgId={orgId}
          onSaved={onSaved}
        />
      )}
      {mode === 'invite' && (
        <TeamAffiliationInviteForm key="invite" orgId={orgId} onSaved={onSaved} />
      )}
    </Drawer>
  )
}
