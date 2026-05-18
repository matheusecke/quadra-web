import { useCallback, useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import * as adminApi from '../../services/adminApi'
import type { AdminTeam, EntityStatus } from '../../types/admin'
import { TeamDrawer } from '../../components/admin/TeamDrawer'
import s from './adminList.module.css'

export function AdminTeamsPage() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<EntityStatus | ''>('')
  const [selected, setSelected] = useState<AdminTeam | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(t)
  }, [q])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-teams', debouncedQ, status],
      queryFn: ({ pageParam }) =>
        adminApi.listTeams({ page: pageParam as number, limit: 20, q: debouncedQ || undefined, status: (status as EntityStatus) || undefined }),
      initialPageParam: 1,
      getNextPageParam: (last) => last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined,
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
            <h1 className={s.title}>Equipes</h1>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>+ Criar equipe</Button>
        </div>
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>⌕</span>
            <input className={s.searchInput} type="search" placeholder="Buscar equipe..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar equipe" />
            {q && (
              <button type="button" className={s.searchClear} onClick={() => setQ('')} aria-label="Limpar busca">✕</button>
            )}
          </div>
          <select className={s.filterSelect} value={status} onChange={(e) => setStatus(e.target.value as EntityStatus | '')} aria-label="Filtrar por status">
            <option value="">Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </select>
        </div>
      </div>

      <div className={s.body}>
        {isError ? (
          <div className={s.bodyFill}>
            <ErrorState title="Não foi possível carregar as equipes." onRetry={refetch} />
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
                  : items.map((team) => (
                      <tr key={team.id} className={s.tr} tabIndex={0} onClick={() => setSelected(team)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(team) }}>
                        <td className={s.td}><span className={s.nameText}>{team.name}</span></td>
                        <td className={s.tdStatus}>
                          <Badge variant={team.status === 'ACTIVE' ? 'success' : 'danger'}>{team.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</Badge>
                        </td>
                      </tr>
                    ))}
                <tr><td colSpan={2} style={{ padding: 0 }}><div ref={sentinelRef} style={{ height: 1 }} /></td></tr>
              </tbody>
            </table>
            {isFetchingNextPage && <div className={s.spinner}><div className={s.spinnerDot} /></div>}
            {!isLoading && items.length === 0 && <EmptyState title="Nenhuma equipe encontrada." />}
          </div>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <p className={s.counter}>{items.length} de {total} carregados</p>
        )}
      </div>

      <TeamDrawer team={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); refetch() }} mode="edit" />
      <TeamDrawer team={null} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); refetch() }} mode="create" open={showCreate} />
    </div>
  )
}
