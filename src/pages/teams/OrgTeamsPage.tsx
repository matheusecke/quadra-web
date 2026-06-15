import { useCallback, useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { listOrgTeams } from '../../services/orgApi'
import type { AffiliationStatus } from '../../types/admin'
import s from '../admin/adminList.module.css'

const LIMIT = 20

function affiliationStatusVariant(status: AffiliationStatus) {
  if (status === 'ACTIVE') return 'success' as const
  if (status === 'PENDING') return 'warning' as const
  return 'danger' as const
}

function affiliationStatusLabel(status: AffiliationStatus) {
  if (status === 'ACTIVE') return 'Ativo'
  if (status === 'PENDING') return 'Pendente'
  return 'Rejeitado'
}

export function OrgTeamsPage() {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<AffiliationStatus | ''>('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(timer)
  }, [q])

  const { data, error, fetchNextPage, hasNextPage, isError, isLoading, refetch } = useInfiniteQuery({
    queryKey: ['org-teams', user?.organizationId, debouncedQ, status],
    queryFn: ({ pageParam }) =>
      listOrgTeams({
        page: pageParam as number,
        limit: LIMIT,
        q: debouncedQ || undefined,
        status: (status as AffiliationStatus) || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (
      last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined
    ),
    enabled: user?.organizationId !== null,
    gcTime: 0,
  })

  const items = data?.pages.flatMap((page) => page.data) ?? []
  const total = data?.pages[0]?.meta.totalItems ?? 0
  const errorStatus = typeof error === 'object' && error !== null && 'response' in error
    ? (error.response as { status?: number } | undefined)?.status
    : undefined
  const loadMore = useCallback(() => {
    if (hasNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage])
  const sentinelRef = useInfiniteScroll(loadMore, hasNextPage ?? false)

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div className={s.headerRow}>
          <div>
            <p className={s.kicker}>Organização</p>
            <h1 className={s.title}>Equipes</h1>
            <p className={s.subtitle}>Equipes vinculadas à organização.</p>
          </div>
        </div>
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>⌕</span>
            <input
              className={s.searchInput}
              type="search"
              placeholder="Buscar equipe..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
              aria-label="Buscar equipes da organização"
            />
            {q && (
              <button type="button" className={s.searchClear} onClick={() => setQ('')} aria-label="Limpar busca">
                ✕
              </button>
            )}
          </div>
          <select
            className={s.filterSelect}
            value={status}
            onChange={(event) => setStatus(event.target.value as AffiliationStatus | '')}
            aria-label="Filtrar equipes por status"
          >
            <option value="">Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="PENDING">Pendente</option>
            <option value="REJECTED">Rejeitado</option>
          </select>
        </div>
      </div>

      <div className={s.body}>
        {isError ? (
          <div className={s.bodyFill}>
            <ErrorState
              title={
                errorStatus === 403
                  ? 'Seu papel atual não permite carregar a lista de equipes desta organização.'
                  : 'Não foi possível carregar as equipes desta organização.'
              }
              onRetry={() => {
                void refetch()
              }}
            />
          </div>
        ) : !isLoading && items.length === 0 ? (
          <div className={s.bodyFill}>
            <EmptyState title="Nenhuma equipe encontrada nesta organização." />
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>Equipe</th>
                  <th className={`${s.th} ${s.thStatus}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <tr key={index} className={s.skRow}>
                        <td><Skeleton width={180} height={14} /></td>
                        <td><Skeleton width={64} height={20} /></td>
                      </tr>
                    ))
                  : items.map((affiliation) => (
                      <tr key={affiliation.id} className={s.tr}>
                        <td className={s.td}>{affiliation.team.name}</td>
                        <td className={s.tdStatus}>
                          <Badge variant={affiliationStatusVariant(affiliation.status)}>
                            {affiliationStatusLabel(affiliation.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                <tr>
                  <td colSpan={2} style={{ padding: 0 }}>
                    <div ref={sentinelRef} style={{ height: 1 }} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <p className={s.counter}>
            {items.length} de {total} carregados
          </p>
        )}
      </div>
    </div>
  )
}
