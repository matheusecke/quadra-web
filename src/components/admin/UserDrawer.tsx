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
  const [localStatus, setLocalStatus] = useState(user.status)
  const [localIsAdmin, setLocalIsAdmin] = useState(user.isSystemAdmin)
  const [saveError, setSaveError] = useState<string | null>(null)

  const saveMutation = useMutation({
    mutationFn: () => Promise.all([
      adminApi.updateUser(user.id, { name }),
      ...(localStatus !== user.status ? [adminApi.updateUserStatus(user.id, localStatus)] : []),
      ...(localIsAdmin !== user.isSystemAdmin ? [adminApi.updateUserSystemAdmin(user.id, localIsAdmin)] : []),
    ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', user.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onSaved()
    },
    onError: () => setSaveError('Não foi possível salvar. Tente novamente.'),
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
          className={`${s.toggleBtn} ${localStatus === 'ACTIVE' ? s.toggleActive : s.toggleInactive}`}
          onClick={() => setLocalStatus(localStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
        >
          {localStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}
        </button>
      </div>
      <div className={s.toggleRow}>
        <span className={s.toggleLabel}>System admin</span>
        <button
          type="button"
          className={`${s.toggleBtn} ${localIsAdmin ? s.toggleActive : s.toggleInactive}`}
          onClick={() => setLocalIsAdmin(!localIsAdmin)}
        >
          {localIsAdmin ? 'Sim' : 'Não'}
        </button>
      </div>
      <div className={s.footer}>
        <Button variant="primary" onClick={() => { setSaveError(null); saveMutation.mutate() }} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Salvando...' : <><em>Salvar</em> →</>}
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
          {createMutation.isPending ? 'Salvando...' : <><em>Salvar</em> →</>}
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
