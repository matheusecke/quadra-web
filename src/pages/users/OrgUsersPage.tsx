import { useCallback, useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Avatar } from '../../components/ui/Avatar/Avatar'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { listOrgUsers } from '../../services/orgApi'
import type { AffiliationStatus, OrgRole } from '../../types/admin'
import s from '../admin/adminList.module.css'

const LIMIT = 20

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()
}

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

export function OrgUsersPage() {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<AffiliationStatus | ''>('')
  const [role, setRole] = useState<OrgRole | ''>('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(timer)
  }, [q])

  const { data, error, fetchNextPage, hasNextPage, isError, isLoading, refetch } = useInfiniteQuery({
    queryKey: ['org-users', user?.organizationId, debouncedQ, status, role],
    queryFn: ({ pageParam }) =>
      listOrgUsers({
        page: pageParam as number,
        limit: LIMIT,
        q: debouncedQ || undefined,
        status: (status as AffiliationStatus) || undefined,
        role: (role as OrgRole) || undefined,
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
            <h1 className={s.title}>Usuários</h1>
            <p className={s.subtitle}>Pessoas vinculadas à organização.</p>
          </div>
        </div>
        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>⌕</span>
            <input
              className={s.searchInput}
              type="search"
              placeholder="Buscar por nome ou email..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
              aria-label="Buscar usuários da organização"
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
            aria-label="Filtrar usuários por status"
          >
            <option value="">Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="PENDING">Pendente</option>
            <option value="REJECTED">Rejeitado</option>
          </select>
          <select
            className={s.filterSelect}
            value={role}
            onChange={(event) => setRole(event.target.value as OrgRole | '')}
            aria-label="Filtrar usuários por papel"
          >
            <option value="">Papel</option>
            <option value="ORG_ADMIN">ORG_ADMIN</option>
            <option value="TEAM_ADMIN">TEAM_ADMIN</option>
            <option value="ATHLETE">ATHLETE</option>
            <option value="COACHING_STAFF">COACHING_STAFF</option>
          </select>
        </div>
      </div>

      <div className={s.body}>
        {isError ? (
          <div className={s.bodyFill}>
            <ErrorState
              title={
                errorStatus === 403
                  ? 'Seu papel atual não permite carregar a lista de usuários desta organização.'
                  : 'Não foi possível carregar os usuários desta organização.'
              }
              onRetry={() => {
                void refetch()
              }}
            />
          </div>
        ) : !isLoading && items.length === 0 ? (
          <div className={s.bodyFill}>
            <EmptyState title="Nenhum usuário encontrado nesta organização." />
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>Usuário</th>
                  <th className={s.th}>Papel</th>
                  <th className={s.th}>Equipe</th>
                  <th className={s.th}>Camisa</th>
                  <th className={`${s.th} ${s.thStatus}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <tr key={index} className={s.skRow}>
                        <td><Skeleton width={180} height={14} /></td>
                        <td><Skeleton width={88} height={20} /></td>
                        <td><Skeleton width={100} height={14} /></td>
                        <td><Skeleton width={40} height={14} /></td>
                        <td><Skeleton width={64} height={20} /></td>
                      </tr>
                    ))
                  : items.map((affiliation) => (
                      <tr key={affiliation.id} className={s.tr}>
                        <td className={s.td}>
                          <div className={s.nameCell}>
                            <Avatar initials={getInitials(affiliation.user.name)} size="sm" />
                            <div className={s.nameMeta}>
                              <span className={s.nameText}>{affiliation.user.name}</span>
                              <span className={s.userEmail}>{affiliation.user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className={s.td}>
                          <Badge variant="default">{affiliation.role}</Badge>
                        </td>
                        <td className={s.td}>{affiliation.team?.name ?? '-'}</td>
                        <td className={s.td}>{affiliation.jerseyNumber ?? '-'}</td>
                        <td className={s.tdStatus}>
                          <Badge variant={affiliationStatusVariant(affiliation.status)}>
                            {affiliationStatusLabel(affiliation.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                <tr>
                  <td colSpan={5} style={{ padding: 0 }}>
                    <div ref={sentinelRef} style={{ height: 1 }} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <p className={s.counter}>
            {items.length} de {total} carregados
          </p>
        )}
      </div>
    </div>
  )
}
