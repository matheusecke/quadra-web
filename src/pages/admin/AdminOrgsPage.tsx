import { useCallback, useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import * as adminApi from '../../services/adminApi'
import type { AdminOrg, EntityStatus } from '../../types/admin'
import { OrgDrawer } from '../../components/admin/OrgDrawer'
import s from './adminList.module.css'

export function AdminOrgsPage() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<EntityStatus | ''>('')
  const [selected, setSelected] = useState<AdminOrg | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(t)
  }, [q])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-orgs', debouncedQ, status],
      queryFn: ({ pageParam }) =>
        adminApi.listOrgs({ page: pageParam as number, limit: 20, q: debouncedQ || undefined, status: (status as EntityStatus) || undefined }),
      initialPageParam: 1,
      getNextPageParam: (last) => last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined,
      gcTime: 0,
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
            <h1 className={s.title}>Organizações</h1>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>+ Criar organização</Button>
        </div>
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>⌕</span>
            <input className={s.searchInput} type="search" placeholder="Buscar organização..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar organização" />
            {q && (
              <button type="button" className={s.searchClear} onClick={() => setQ('')} aria-label="Limpar busca">✕</button>
            )}
          </div>
          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar por status" options={[{ value: '', label: 'Status' }, { value: 'ACTIVE', label: 'Ativo' }, { value: 'INACTIVE', label: 'Inativo' }]} value={status || null} onChange={(value) => setStatus(value as EntityStatus | '')} />
          </div>
        </div>
      </div>

      <div className={s.body}>
        {isError ? (
          <div className={s.bodyFill}>
            <ErrorState title="Não foi possível carregar as organizações." onRetry={refetch} />
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>Nome <span className={s.sortIcon}>⇅</span></th>
                  <th className={`${s.th} ${s.thStatus}`}>Status <span className={s.sortIcon}>⇅</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className={s.skRow}>
                        <td><Skeleton width={180} height={14} /></td>
                        <td><Skeleton width={56} height={20} /></td>
                      </tr>
                    ))
                  : items.map((org) => (
                      <tr key={org.id} className={s.tr} tabIndex={0} onClick={() => setSelected(org)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(org) }}>
                        <td className={s.td}><span className={s.nameText}>{org.name}</span></td>
                        <td className={s.tdStatus}>
                          <Badge variant={org.status === 'ACTIVE' ? 'success' : 'danger'}>{org.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</Badge>
                        </td>
                      </tr>
                    ))}
                <tr><td colSpan={2} style={{ padding: 0 }}><div ref={sentinelRef} style={{ height: 1 }} /></td></tr>
              </tbody>
            </table>
            {isFetchingNextPage && <div className={s.spinner}><div className={s.spinnerDot} /></div>}
            {!isLoading && items.length === 0 && <EmptyState title="Nenhuma organização encontrada." />}
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <p className={s.counter}>{items.length} de {total} carregados</p>
        )}
      </div>

      <OrgDrawer org={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); refetch() }} mode="edit" />
      <OrgDrawer org={null} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); refetch() }} mode="create" open={showCreate} />
    </div>
  )
}
