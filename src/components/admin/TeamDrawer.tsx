import { useEffect, useState } from 'react'
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

export function TeamDrawer({ team, onClose, onSaved, mode, open }: Props) {
  const isOpen = mode === 'edit' ? team !== null : (open ?? false)
  const queryClient = useQueryClient()

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ['admin-team', team?.id],
    queryFn: () => adminApi.getTeam(team!.id),
    enabled: mode === 'edit' && team !== null,
  })

  const [name, setName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'edit' && detail) setName(detail.name)
    else if (mode === 'create') setName('')
    setSaveError(null)
  }, [detail, mode, isOpen])

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateTeam(team!.id, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-team', team?.id] }); onSaved() },
    onError: () => setSaveError('Não foi possível salvar.'),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createTeam({ name }),
    onSuccess: () => onSaved(),
    onError: () => setSaveError('Não foi possível criar a equipe.'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') => adminApi.updateTeamStatus(team!.id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-team', team?.id] }); queryClient.invalidateQueries({ queryKey: ['admin-teams'] }) },
  })

  const isSaving = updateMutation.isPending || createMutation.isPending
  const title = mode === 'create' ? 'Criar equipe' : (detail?.name ?? team?.name ?? '—')

  return (
    <Drawer open={isOpen} onClose={onClose} title={title}>
      {mode === 'edit' && isLoading ? (
        <div className={s.skeletonWrap}><Skeleton height={36} /><Skeleton height={36} /></div>
      ) : mode === 'edit' && isError ? (
        <ErrorState title="Não foi possível carregar os dados." />
      ) : (
        <>
          {saveError && <p className={s.saveError}>{saveError}</p>}
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da equipe" />
          </Field>
          {mode === 'edit' && detail && (
            <div className={s.toggleRow}>
              <span className={s.toggleLabel}>Status</span>
              <button
                type="button"
                className={`${s.toggleBtn} ${detail.status === 'ACTIVE' ? s.toggleActive : s.toggleInactive}`}
                onClick={() => statusMutation.mutate(detail.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                disabled={statusMutation.isPending}
              >
                {detail.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          )}
          <div className={s.footer}>
            <Button variant="primary" onClick={() => { setSaveError(null); mode === 'edit' ? updateMutation.mutate() : createMutation.mutate() }} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  )
}
