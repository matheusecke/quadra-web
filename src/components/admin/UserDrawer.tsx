import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button/Button'
import { Field } from '../ui/Field/Field'
import { Input } from '../ui/Input/Input'
import { ErrorState } from '../ui/ErrorState/ErrorState'
import { Skeleton } from '../ui/Skeleton/Skeleton'
import * as adminApi from '../../services/adminApi'
import type { AdminUser } from '../../types/admin'
import s from './UserDrawer.module.css'

type Props = {
  user: AdminUser | null
  onClose: () => void
  onSaved: () => void
  mode: 'edit' | 'create'
  open?: boolean
}

type FormProps = {
  user: AdminUser
  onClose: () => void
  onSaved: () => void
}

type CreateFormProps = {
  onClose: () => void
  onSaved: () => void
}

function UserEditForm({ user, onSaved }: FormProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(user.name)
  const [saveError, setSaveError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateUser(user.id, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-user', user.id] }); onSaved() },
    onError: () => setSaveError('Não foi possível salvar. Tente novamente.'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') => adminApi.updateUserStatus(user.id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-user', user.id] }); queryClient.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  const adminMutation = useMutation({
    mutationFn: (val: boolean) => adminApi.updateUserSystemAdmin(user.id, val),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-user', user.id] }); queryClient.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
      </Field>
      <Field label="Email">
        <Input value={user.email} readOnly disabled />
      </Field>
      <div className={s.toggleRow}>
        <span className={s.toggleLabel}>Status</span>
        <button
          type="button"
          className={`${s.toggleBtn} ${user.status === 'ACTIVE' ? s.toggleActive : s.toggleInactive}`}
          onClick={() => statusMutation.mutate(user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
          disabled={statusMutation.isPending}
        >
          {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
        </button>
      </div>
      <div className={s.toggleRow}>
        <span className={s.toggleLabel}>System admin</span>
        <button
          type="button"
          className={`${s.toggleBtn} ${user.isSystemAdmin ? s.toggleActive : s.toggleInactive}`}
          onClick={() => adminMutation.mutate(!user.isSystemAdmin)}
          disabled={adminMutation.isPending}
        >
          {user.isSystemAdmin ? 'Sim' : 'Não'}
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

function UserCreateForm({ onSaved }: CreateFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser({ name, email, password }),
    onSuccess: () => onSaved(),
    onError: () => setSaveError('Não foi possível criar o usuário. Verifique os dados.'),
  })

  return (
    <>
      {saveError && <p className={s.saveError}>{saveError}</p>}
      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
      </Field>
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
      </Field>
      <Field label="Senha">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
      </Field>
      <div className={s.footer}>
        <Button variant="primary" onClick={() => { setSaveError(null); createMutation.mutate() }} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </>
  )
}

export function UserDrawer({ user, onClose, onSaved, mode, open }: Props) {
  const isOpen = mode === 'edit' ? user !== null : (open ?? false)

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ['admin-user', user?.id],
    queryFn: () => adminApi.getUser(user!.id),
    enabled: mode === 'edit' && user !== null,
  })

  const title = mode === 'create' ? 'Criar usuário' : (detail?.name ?? user?.name ?? '—')

  return (
    <Drawer open={isOpen} onClose={onClose} title={title}>
      {mode === 'edit' && isLoading && (
        <div className={s.skeletonWrap}>
          <Skeleton height={36} />
          <Skeleton height={36} />
          <Skeleton height={36} />
        </div>
      )}
      {mode === 'edit' && isError && <ErrorState title="Não foi possível carregar os dados." />}
      {mode === 'edit' && detail && (
        <UserEditForm key={detail.id} user={detail} onClose={onClose} onSaved={onSaved} />
      )}
      {mode === 'create' && (
        <UserCreateForm key="create" onClose={onClose} onSaved={onSaved} />
      )}
    </Drawer>
  )
}
