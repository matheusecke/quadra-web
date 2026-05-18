import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button/Button'
import { Field } from '../ui/Field/Field'
import { Input } from '../ui/Input/Input'
import { ErrorState } from '../ui/ErrorState/ErrorState'
import { Skeleton } from '../ui/Skeleton/Skeleton'
import * as adminApi from '../../services/adminApi'
import type { AdminTeam } from '../../types/admin'
import s from './UserDrawer.module.css'

type Props = {
  team: AdminTeam | null
  onClose: () => void
  onSaved: () => void
  mode: 'edit' | 'create'
  open?: boolean
}

function TeamEditForm({ team, onSaved }: { team: AdminTeam; onSaved: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(team.name)
  const [saveError, setSaveError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateTeam(team.id, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-team', team.id] }); onSaved() },
    onError: () => setSaveError('Não foi possível salvar.'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') => adminApi.updateTeamStatus(team.id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-team', team.id] }); queryClient.invalidateQueries({ queryKey: ['admin-teams'] }) },
  })

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da equipe" />
      </Field>
      <div className={s.toggleRow}>
        <span className={s.toggleLabel}>Status</span>
        <button
          type="button"
          className={`${s.toggleBtn} ${team.status === 'ACTIVE' ? s.toggleActive : s.toggleInactive}`}
          onClick={() => statusMutation.mutate(team.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
          disabled={statusMutation.isPending}
        >
          {team.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
        </button>
      </div>
      <div className={s.footer}>
        <Button variant="primary" onClick={() => { setSaveError(null); updateMutation.mutate() }} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </>
  )
}

function TeamCreateForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => adminApi.createTeam({ name }),
    onSuccess: () => onSaved(),
    onError: () => setSaveError('Não foi possível criar a equipe.'),
  })

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da equipe" />
      </Field>
      <div className={s.footer}>
        <Button variant="primary" onClick={() => { setSaveError(null); createMutation.mutate() }} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </>
  )
}

export function TeamDrawer({ team, onClose, onSaved, mode, open }: Props) {
  const isOpen = mode === 'edit' ? team !== null : (open ?? false)

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ['admin-team', team?.id],
    queryFn: () => adminApi.getTeam(team!.id),
    enabled: mode === 'edit' && team !== null,
  })

  const title = mode === 'create' ? 'Criar equipe' : (detail?.name ?? team?.name ?? '—')

  return (
    <Drawer open={isOpen} onClose={onClose} title={title}>
      {mode === 'edit' && isLoading && (
        <div className={s.skeletonWrap}><Skeleton height={36} /><Skeleton height={36} /></div>
      )}
      {mode === 'edit' && isError && <ErrorState title="Não foi possível carregar os dados." />}
      {mode === 'edit' && detail && (
        <TeamEditForm key={detail.id} team={detail} onSaved={onSaved} />
      )}
      {mode === 'create' && (
        <TeamCreateForm key="create" onSaved={onSaved} />
      )}
    </Drawer>
  )
}
