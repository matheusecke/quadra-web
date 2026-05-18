import { useCallback, useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Avatar } from '../../components/ui/Avatar/Avatar'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import * as adminApi from '../../services/adminApi'
import type { AdminUser, EntityStatus, OrgRole } from '../../types/admin'
import { UserDrawer } from '../../components/admin/UserDrawer'
import s from './adminList.module.css'

function getInitials(name: string) {
  const w = name.trim().split(/\s+/)
  return ((w[0]?.[0] ?? '') + (w[1]?.[0] ?? '')).toUpperCase()
}

function statusVariant(status: EntityStatus) {
  return status === 'ACTIVE' ? 'success' as const : 'danger' as const
}

function statusLabel(status: EntityStatus) {
  return status === 'ACTIVE' ? 'Ativo' : 'Inativo'
}

const LIMIT = 20

export function AdminUsersPage() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<EntityStatus | ''>('')
  const [role, setRole] = useState<OrgRole | ''>('')
  const [isSystemAdmin, setIsSystemAdmin] = useState<'' | 'true' | 'false'>('')
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(t)
  }, [q])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['admin-users', debouncedQ, status, role, isSystemAdmin],
    queryFn: ({ pageParam }) =>
      adminApi.listUsers({
        page: pageParam as number,
        limit: LIMIT,
        q: debouncedQ || undefined,
        status: (status as EntityStatus) || undefined,
        role: (role as OrgRole) || undefined,
        isSystemAdmin: isSystemAdmin === 'true' ? true : isSystemAdmin === 'false' ? false : undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined,
  })

  const items = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.meta.totalItems ?? 0

  const loadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }, [fetchNextPage, hasNextPage, isFetchingNextPage])
  const sentinelRef = useInfiniteScroll(loadMore, hasNextPage ?? false)

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div className={s.headerRow}>
          <div>
            <p className={s.kicker}>Administração</p>
            <h1 className={s.title}>Usuários</h1>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>+ Criar usuário</Button>
        </div>
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>⌕</span>
            <input
              className={s.searchInput}
              type="search"
              placeholder="Buscar por nome ou email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar usuários"
            />
          </div>
          <select className={s.filterSelect} value={status} onChange={(e) => setStatus(e.target.value as EntityStatus | '')} aria-label="Filtrar por status">
            <option value="">Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </select>
          <select className={s.filterSelect} value={role} onChange={(e) => setRole(e.target.value as OrgRole | '')} aria-label="Filtrar por papel">
            <option value="">Papel</option>
            <option value="ORG_ADMIN">ORG_ADMIN</option>
            <option value="TEAM_ADMIN">TEAM_ADMIN</option>
            <option value="ATHLETE">ATHLETE</option>
            <option value="COACHING_STAFF">COACHING_STAFF</option>
          </select>
          <select className={s.filterSelect} value={isSystemAdmin} onChange={(e) => setIsSystemAdmin(e.target.value as '' | 'true' | 'false')} aria-label="Filtrar por admin">
            <option value="">Admin</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>
      </div>

      <div className={s.body}>
        {isError ? (
          <ErrorState title="Não foi possível carregar os usuários." onRetry={refetch} />
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>Nome <span className={s.sortIcon}>⇅</span></th>
                  <th className={s.th}>Email <span className={s.sortIcon}>⇅</span></th>
                  <th className={s.th}>Papel <span className={s.sortIcon}>⇅</span></th>
                  <th className={`${s.th} ${s.thStatus}`}>Status <span className={s.sortIcon}>⇅</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className={s.skRow}>
                        <td><Skeleton width={140} height={14} /></td>
                        <td><Skeleton width={180} height={14} /></td>
                        <td><Skeleton width={80} height={20} /></td>
                        <td><Skeleton width={56} height={20} /></td>
                      </tr>
                    ))
                  : items.map((user) => (
                      <tr
                        key={user.id}
                        className={s.tr}
                        tabIndex={0}
                        onClick={() => setSelected(user)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(user) }}
                      >
                        <td className={s.td}>
                          <div className={s.nameCell}>
                            <Avatar initials={getInitials(user.name)} size="sm" />
                            <div className={s.nameMeta}>
                              <span className={s.nameText}>{user.name}</span>
                              {user.isSystemAdmin && <span className={s.adminTag}>⚡ System admin</span>}
                            </div>
                          </div>
                        </td>
                        <td className={s.td}>{user.email}</td>
                        <td className={s.td}>—</td>
                        <td className={s.tdStatus}>
                          <Badge variant={statusVariant(user.status)}>{statusLabel(user.status)}</Badge>
                        </td>
                      </tr>
                    ))}
                <tr><td colSpan={4} style={{ padding: 0 }}><div ref={sentinelRef} style={{ height: 1 }} /></td></tr>
              </tbody>
            </table>

            {isFetchingNextPage && (
              <div className={s.spinner}><div className={s.spinnerDot} /></div>
            )}

            {!isLoading && items.length === 0 && (
              <EmptyState title="Nenhum usuário encontrado." />
            )}
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <p className={s.counter}>{items.length} de {total} carregados</p>
        )}
      </div>

      <UserDrawer
        user={selected}
        onClose={() => setSelected(null)}
        onSaved={() => { setSelected(null); refetch() }}
        mode="edit"
      />
      <UserDrawer
        user={null}
        onClose={() => setShowCreate(false)}
        onSaved={() => { setShowCreate(false); refetch() }}
        mode="create"
        open={showCreate}
      />
    </div>
  )
}
