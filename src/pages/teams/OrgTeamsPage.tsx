import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TeamOnboardingDrawer } from '../../components/org/TeamOnboardingDrawer'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { affiliationStatusVariant, teamAffiliationStatusLabel } from '../../features/org/labels'
import { useOrgTeamsInfiniteQuery } from '../../features/org/queries'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { apiErrorStatus } from '../../services/apiError'
import type { AffiliationStatus } from '../../types/admin'
import type { OrgTeamAffiliationTeam } from '../../types/org'
import s from '../admin/adminList.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Status' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'INACTIVE', label: 'Inativa' },
]

function teamSubtitle(team: OrgTeamAffiliationTeam) {
  const place = team.city && team.state ? `${team.city}/${team.state}` : team.city ?? team.state
  return place ? `${team.shortName} · ${place}` : team.shortName
}

export function OrgTeamsPage() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<AffiliationStatus | ''>('')
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(timer)
  }, [q])

  const { data, error, fetchNextPage, hasNextPage, isError, isLoading, refetch } =
    useOrgTeamsInfiniteQuery({ q: debouncedQ, status })

  const items = data?.pages.flatMap((page) => page.data) ?? []
  const total = data?.pages[0]?.meta.totalItems ?? 0
  const errorStatus = apiErrorStatus(error)
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
          <Button onClick={() => setIsOnboardingOpen(true)}>Adicionar equipe</Button>
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
          <div className={s.filterControl}>
            <Combobox
              aria-label="Filtrar equipes por status"
              options={STATUS_OPTIONS}
              value={status || null}
              onChange={(value) => setStatus(value as AffiliationStatus | '')}
            />
          </div>
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
                  <th className={s.th}>Membros ativos</th>
                  <th className={s.th}>Convites pendentes</th>
                  <th className={`${s.th} ${s.thStatus}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <tr key={index} className={s.skRow}>
                        <td><Skeleton width={180} height={14} /></td>
                        <td><Skeleton width={40} height={14} /></td>
                        <td><Skeleton width={40} height={14} /></td>
                        <td><Skeleton width={64} height={20} /></td>
                      </tr>
                    ))
                  : items.map((affiliation) => (
                      <tr key={affiliation.id} className={s.tr}>
                        <td className={s.td}>
                          <div className={s.nameMeta}>
                            <Link to={`/teams/${affiliation.teamId}`} className={s.teamLink}>
                              {affiliation.team.name}
                            </Link>
                            <span className={s.subText}>{teamSubtitle(affiliation.team)}</span>
                          </div>
                        </td>
                        <td className={s.td}>{affiliation.activeUserCount}</td>
                        <td className={s.td}>{affiliation.pendingAdminInviteCount}</td>
                        <td className={s.tdStatus}>
                          <Badge variant={affiliationStatusVariant(affiliation.status)}>
                            {teamAffiliationStatusLabel(affiliation.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                <tr>
                  <td colSpan={4} style={{ padding: 0 }}>
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

      <TeamOnboardingDrawer open={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
    </div>
  )
}
