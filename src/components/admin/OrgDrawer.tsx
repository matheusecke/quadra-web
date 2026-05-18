import { useState } from 'react'
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

type EditFormProps = {
  org: AdminOrg
  onClose: () => void
  onSaved: () => void
}

function OrgEditForm({ org, onClose, onSaved }: EditFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState(org.name)
  const [localStatus, setLocalStatus] = useState(org.status)
  const [saveError, setSaveError] = useState<string | null>(null)

  const saveMutation = useMutation({
    mutationFn: () => Promise.all([
      adminApi.updateOrg(org.id, { name }),
      ...(localStatus !== org.status ? [adminApi.updateOrgStatus(org.id, localStatus)] : []),
    ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-org', org.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-orgs'] })
      onSaved()
    },
    onError: () => setSaveError('Não foi possível salvar. Tente novamente.'),
  })

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da organização" />
      </Field>
      <div className={s.toggleRow}>
        <span className={s.toggleLabel}>Status</span>
        <button
          type="button"
          className={`${s.toggleBtn} ${localStatus === 'ACTIVE' ? s.toggleActive : s.toggleInactive}`}
          onClick={() => setLocalStatus(localStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
        >
          {localStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}
        </button>
      </div>
      <Button
        variant="ghost"
        onClick={() => { onClose(); navigate(`/admin/organizations/${org.id}/affiliations`) }}
      >
        Gerenciar vínculos →
      </Button>
      <div className={s.footer}>
        <Button variant="primary" onClick={() => { setSaveError(null); saveMutation.mutate() }} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Salvando...' : <><em>Salvar</em> →</>}
        </Button>
      </div>
    </>
  )
}

function OrgCreateForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => adminApi.createOrg({ name }),
    onSuccess: () => onSaved(),
    onError: () => setSaveError('Não foi possível criar a organização.'),
  })

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da organização" />
      </Field>
      <div className={s.footer}>
        <Button variant="primary" onClick={() => { setSaveError(null); createMutation.mutate() }} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Salvando...' : <><em>Salvar</em> →</>}
        </Button>
      </div>
    </>
  )
}

export function OrgDrawer({ org, onClose, onSaved, mode, open }: Props) {
  const isOpen = mode === 'edit' ? org !== null : (open ?? false)

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ['admin-org', org?.id],
    queryFn: () => adminApi.getOrg(org!.id),
    enabled: mode === 'edit' && org !== null,
  })

  const title = mode === 'create' ? 'Criar organização' : (detail?.name ?? org?.name ?? '—')

  return (
    <Drawer open={isOpen} onClose={onClose} title={title}>
      {mode === 'edit' && isLoading && (
        <div className={s.skeletonWrap}><Skeleton height={36} /><Skeleton height={36} /></div>
      )}
      {mode === 'edit' && isError && <ErrorState title="Não foi possível carregar os dados." />}
      {mode === 'edit' && detail && (
        <OrgEditForm key={detail.id} org={detail} onClose={onClose} onSaved={onSaved} />
      )}
      {mode === 'create' && (
        <OrgCreateForm key="create" onSaved={onSaved} />
      )}
    </Drawer>
  )
}
