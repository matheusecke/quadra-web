import { useCallback, useEffect, useState } from 'react'
import { Avatar } from '../../components/ui/Avatar/Avatar'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import {
  ORG_ROLE_LABELS,
  affiliationStatusVariant,
  membershipLabel,
  userAffiliationStatusLabel,
} from '../../features/org/labels'
import { useOrgTeamOptionsQuery, useOrgUsersInfiniteQuery } from '../../features/org/queries'
import { useActiveOrgAffiliation } from '../../hooks/useActiveOrgAffiliation'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { apiErrorStatus } from '../../services/apiError'
import type { AffiliationStatus, OrgRole } from '../../types/admin'
import s from '../admin/adminList.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Status' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
]

const ROLE_OPTIONS = [
  { value: '', label: 'Papel' },
  ...(['ORG_ADMIN', 'TEAM_ADMIN', 'ATHLETE', 'COACHING_STAFF'] as const).map((role) => ({
    value: role,
    label: ORG_ROLE_LABELS[role],
  })),
]

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()
}

export function OrgUsersPage() {
  const { role: actorRole } = useActiveOrgAffiliation()
  const isTeamAdmin = actorRole === 'TEAM_ADMIN'
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<AffiliationStatus | ''>('')
  const [role, setRole] = useState<OrgRole | ''>('')
  const [teamId, setTeamId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(timer)
  }, [q])

  // A TEAM_ADMIN is scoped by the service; sending a teamId would only invite a wider request.
  const { data, error, fetchNextPage, hasNextPage, isError, isLoading, refetch } =
    useOrgUsersInfiniteQuery({ q: debouncedQ, status, role, teamId: isTeamAdmin ? null : teamId })
  const teamOptionsQuery = useOrgTeamOptionsQuery(!isTeamAdmin)

  const items = data?.pages.flatMap((page) => page.data) ?? []
  const total = data?.pages[0]?.meta.totalItems ?? 0
  const errorStatus = apiErrorStatus(error)
  const loadMore = useCallback(() => {
    if (hasNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage])
  const sentinelRef = useInfiniteScroll(loadMore, hasNextPage ?? false)

  const teamOptions = [
    { value: '', label: 'Equipe' },
    ...(teamOptionsQuery.data ?? []).map((affiliation) => ({
      value: String(affiliation.teamId),
      label: affiliation.team.name,
    })),
  ]

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
            <Combobox
              aria-label="Filtrar usuários por status"
              options={STATUS_OPTIONS}
              value={status || null}
              onChange={(value) => setStatus(value as AffiliationStatus | '')}
            />
          </div>
          <div className={s.filterControl}>
            <Combobox
              aria-label="Filtrar usuários por papel"
              options={ROLE_OPTIONS}
              value={role || null}
              onChange={(value) => setRole(value as OrgRole | '')}
            />
          </div>
          {!isTeamAdmin && (
            <div className={s.filterControl}>
              <Combobox
                aria-label="Filtrar usuários por equipe"
                options={teamOptions}
                value={teamId === null ? null : String(teamId)}
                onChange={(value) => setTeamId(value ? Number(value) : null)}
                searchable
              />
            </div>
          )}
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
                  <th className={s.th}>Camisa/Posição</th>
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
                        <td><Skeleton width={60} height={14} /></td>
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
                              <span className={s.subText}>{affiliation.user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className={s.td}>
                          <Badge variant="default">{ORG_ROLE_LABELS[affiliation.role]}</Badge>
                        </td>
                        <td className={s.td}>{affiliation.team?.name ?? '-'}</td>
                        <td className={s.td}>
                          {membershipLabel(affiliation.jerseyNumber, affiliation.position)}
                        </td>
                        <td className={s.tdStatus}>
                          <Badge
                            variant={affiliationStatusVariant(affiliation.status, affiliation.isInviteExpired)}
                          >
                            {userAffiliationStatusLabel(affiliation.status, affiliation.isInviteExpired)}
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
