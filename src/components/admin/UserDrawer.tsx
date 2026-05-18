import { useEffect, useState } from 'react'
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

export function UserDrawer({ user, onClose, onSaved, mode, open }: Props) {
  const isOpen = mode === 'edit' ? user !== null : (open ?? false)
  const queryClient = useQueryClient()

  const { data: detail, isLoading: loadingDetail, isError: errorDetail } = useQuery({
    queryKey: ['admin-user', user?.id],
    queryFn: () => adminApi.getUser(user!.id),
    enabled: mode === 'edit' && user !== null,
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'edit' && detail) {
      setName(detail.name)
      setEmail(detail.email)
    } else if (mode === 'create') {
      setName('')
      setEmail('')
      setPassword('')
    }
    setSaveError(null)
  }, [detail, mode, isOpen])

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateUser(user!.id, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-user', user?.id] }); onSaved() },
    onError: () => setSaveError('Não foi possível salvar. Tente novamente.'),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser({ name, email, password }),
    onSuccess: () => onSaved(),
    onError: () => setSaveError('Não foi possível criar o usuário. Verifique os dados.'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') => adminApi.updateUserStatus(user!.id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-user', user?.id] }); queryClient.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  const adminMutation = useMutation({
    mutationFn: (val: boolean) => adminApi.updateUserSystemAdmin(user!.id, val),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-user', user?.id] }); queryClient.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  const handleSave = () => {
    setSaveError(null)
    if (mode === 'edit') updateMutation.mutate()
    else createMutation.mutate()
  }

  const isSaving = updateMutation.isPending || createMutation.isPending
  const title = mode === 'create' ? 'Criar usuário' : (detail?.name ?? user?.name ?? '—')

  return (
    <Drawer open={isOpen} onClose={onClose} title={title}>
      {mode === 'edit' && loadingDetail ? (
        <div className={s.skeletonWrap}>
          <Skeleton height={36} />
          <Skeleton height={36} />
          <Skeleton height={36} />
        </div>
      ) : mode === 'edit' && errorDetail ? (
        <ErrorState title="Não foi possível carregar os dados." />
      ) : (
        <>
          {saveError && <p className={s.saveError}>{saveError}</p>}

          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </Field>

          {mode === 'create' ? (
            <>
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </Field>
              <Field label="Senha">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              </Field>
            </>
          ) : (
            <Field label="Email">
              <Input value={detail?.email ?? ''} readOnly disabled />
            </Field>
          )}

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
              <div className={s.toggleRow}>
                <span className={s.toggleLabel}>System admin</span>
                <button
                  type="button"
                  className={`${s.toggleBtn} ${detail.isSystemAdmin ? s.toggleActive : s.toggleInactive}`}
                  onClick={() => adminMutation.mutate(!detail.isSystemAdmin)}
                  disabled={adminMutation.isPending}
                >
                  {detail.isSystemAdmin ? 'Sim' : 'Não'}
                </button>
              </div>
            </>
          )}

          <div className={s.footer}>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  )
}
