import { useCallback, useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Avatar } from '../../components/ui/Avatar/Avatar'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { listOrgUsers } from '../../services/orgApi'
import { affiliationStatusVariant, userAffiliationStatusLabel } from '../../features/org/labels'
import s from '../admin/adminList.module.css'
import type { AffiliationStatus, OrgRole } from '../../types/admin'

const LIMIT = 20

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()
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
          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar usuários por status" options={[{ value: '', label: 'Status' }, { value: 'ACTIVE', label: 'Ativo' }, { value: 'PENDING', label: 'Pendente' }, { value: 'REJECTED', label: 'Rejeitado' }]} value={status || null} onChange={(value) => setStatus(value as AffiliationStatus | '')} />
          </div>
          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar usuários por papel" options={[{ value: '', label: 'Papel' }, { value: 'ORG_ADMIN', label: 'ORG_ADMIN' }, { value: 'TEAM_ADMIN', label: 'TEAM_ADMIN' }, { value: 'ATHLETE', label: 'ATHLETE' }, { value: 'COACHING_STAFF', label: 'COACHING_STAFF' }]} value={role || null} onChange={(value) => setRole(value as OrgRole | '')} />
          </div>
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
                            {userAffiliationStatusLabel(affiliation.status)}
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
