import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button/Button'
import { Field } from '../ui/Field/Field'
import { Input } from '../ui/Input/Input'
import { ErrorState } from '../ui/ErrorState/ErrorState'
import { Skeleton } from '../ui/Skeleton/Skeleton'
import * as adminApi from '../../services/adminApi'
import type { AdminOrg } from '../../types/admin'
import s from './UserDrawer.module.css'

type Props = {
  org: AdminOrg | null
  onClose: () => void
  onSaved: () => void
  mode: 'edit' | 'create'
  open?: boolean
}

export function OrgDrawer({ org, onClose, onSaved, mode, open }: Props) {
  const isOpen = mode === 'edit' ? org !== null : (open ?? false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ['admin-org', org?.id],
    queryFn: () => adminApi.getOrg(org!.id),
    enabled: mode === 'edit' && org !== null,
  })

  const [name, setName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'edit' && detail) setName(detail.name)
    else if (mode === 'create') setName('')
    setSaveError(null)
  }, [detail, mode, isOpen])

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateOrg(org!.id, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-org', org?.id] }); onSaved() },
    onError: () => setSaveError('Não foi possível salvar. Tente novamente.'),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createOrg({ name }),
    onSuccess: () => onSaved(),
    onError: () => setSaveError('Não foi possível criar a organização.'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') => adminApi.updateOrgStatus(org!.id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-org', org?.id] }); queryClient.invalidateQueries({ queryKey: ['admin-orgs'] }) },
  })

  const isSaving = updateMutation.isPending || createMutation.isPending
  const title = mode === 'create' ? 'Criar organização' : (detail?.name ?? org?.name ?? '—')

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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da organização" />
          </Field>
          {mode === 'edit' && detail && (
            <>
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
              <Button
                variant="ghost"
                onClick={() => { onClose(); navigate(`/admin/organizations/${org!.id}/affiliations`) }}
              >
                Gerenciar vínculos →
              </Button>
            </>
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
