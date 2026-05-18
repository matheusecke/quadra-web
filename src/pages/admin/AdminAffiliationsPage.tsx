import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import * as adminApi from '../../services/adminApi'
import type { AdminUserAffiliation, AdminTeamAffiliation, AffiliationStatus, OrgRole } from '../../types/admin'
import { UserAffiliationDrawer } from '../../components/admin/UserAffiliationDrawer'
import { TeamAffiliationDrawer } from '../../components/admin/TeamAffiliationDrawer'
import s from './AdminAffiliationsPage.module.css'
import ls from './adminList.module.css'

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

function UserAffiliationsTab({ orgId }: { orgId: number }) {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<AffiliationStatus | ''>('')
  const [role, setRole] = useState<OrgRole | ''>('')
  const [selected, setSelected] = useState<AdminUserAffiliation | null>(null)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(t)
  }, [q])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-user-affiliations', orgId, debouncedQ, status, role],
      queryFn: ({ pageParam }) =>
        adminApi.listUserAffiliations(orgId, {
          page: pageParam as number,
          limit: 20,
          q: debouncedQ || undefined,
          status: (status as AffiliationStatus) || undefined,
          role: (role as OrgRole) || undefined,
        }),
      initialPageParam: 1,
      getNextPageParam: (last) => last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined,
      gcTime: 0,
    })

  const items = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.meta.totalItems ?? 0
  const loadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }, [fetchNextPage, hasNextPage, isFetchingNextPage])
  const sentinelRef = useInfiniteScroll(loadMore, hasNextPage ?? false)

  return (
    <div className={s.tabBody}>
      <div className={s.tabToolbar}>
        <div className={ls.searchWrap}>
          <span className={ls.searchIcon}>⌕</span>
          <input className={ls.searchInput} type="search" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar vínculo" />
          {q && (
            <button type="button" className={ls.searchClear} onClick={() => setQ('')} aria-label="Limpar busca">✕</button>
          )}
        </div>
        <select className={ls.filterSelect} value={status} onChange={(e) => setStatus(e.target.value as AffiliationStatus | '')} aria-label="Filtrar por status">
          <option value="">Status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="PENDING">Pendente</option>
          <option value="REJECTED">Rejeitado</option>
        </select>
        <select className={ls.filterSelect} value={role} onChange={(e) => setRole(e.target.value as OrgRole | '')} aria-label="Filtrar por papel">
          <option value="">Papel</option>
          <option value="ORG_ADMIN">ORG_ADMIN</option>
          <option value="TEAM_ADMIN">TEAM_ADMIN</option>
          <option value="ATHLETE">ATHLETE</option>
          <option value="COACHING_STAFF">COACHING_STAFF</option>
        </select>
        <Button variant="primary" onClick={() => setShowInvite(true)}>+ Convidar usuário</Button>
      </div>

      {isError ? (
        <ErrorState title="Não foi possível carregar os vínculos." onRetry={refetch} />
      ) : (
        <div className={ls.tableWrap}>
          <table className={ls.table}>
            <thead className={ls.thead}>
              <tr>
                <th className={ls.th}>Usuário <span className={ls.sortIcon}>⇅</span></th>
                <th className={ls.th}>Papel <span className={ls.sortIcon}>⇅</span></th>
                <th className={ls.th}>Equipe <span className={ls.sortIcon}>⇅</span></th>
                <th className={`${ls.th} ${ls.thStatus}`}>Status <span className={ls.sortIcon}>⇅</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className={ls.skRow}>
                      <td><Skeleton width={60} height={14} /></td>
                      <td><Skeleton width={80} height={20} /></td>
                      <td><Skeleton width={60} height={14} /></td>
                      <td><Skeleton width={64} height={20} /></td>
                    </tr>
                  ))
                : items.map((aff) => (
                    <tr key={aff.id} className={ls.tr} tabIndex={0} onClick={() => setSelected(aff)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(aff) }}>
                      <td className={ls.td}>
                        <span className={s.userName}>{aff.user.name}</span>
                        <span className={s.userEmail}>{aff.user.email}</span>
                      </td>
                      <td className={ls.td}><Badge variant="default">{aff.role}</Badge></td>
                      <td className={ls.td}>{aff.team?.name ?? '—'}</td>
                      <td className={ls.tdStatus}><Badge variant={affiliationStatusVariant(aff.status)}>{affiliationStatusLabel(aff.status)}</Badge></td>
                    </tr>
                  ))}
              <tr><td colSpan={4} style={{ padding: 0 }}><div ref={sentinelRef} style={{ height: 1 }} /></td></tr>
            </tbody>
          </table>
          {isFetchingNextPage && <div className={ls.spinner}><div className={ls.spinnerDot} /></div>}
          {!isLoading && items.length === 0 && <EmptyState title="Nenhum vínculo encontrado." />}
        </div>
      )}
      {!isLoading && !isError && items.length > 0 && <p className={ls.counter}>{items.length} de {total} carregados</p>}

      <UserAffiliationDrawer affiliation={selected} orgId={orgId} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); refetch() }} mode="edit" />
      <UserAffiliationDrawer affiliation={null} orgId={orgId} onClose={() => setShowInvite(false)} onSaved={() => { setShowInvite(false); refetch() }} mode="invite" open={showInvite} />
    </div>
  )
}

function TeamAffiliationsTab({ orgId }: { orgId: number }) {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<AffiliationStatus | ''>('')
  const [selected, setSelected] = useState<AdminTeamAffiliation | null>(null)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(t)
  }, [q])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-team-affiliations', orgId, debouncedQ, status],
      queryFn: ({ pageParam }) =>
        adminApi.listTeamAffiliations(orgId, {
          page: pageParam as number,
          limit: 20,
          q: debouncedQ || undefined,
          status: (status as AffiliationStatus) || undefined,
        }),
      initialPageParam: 1,
      getNextPageParam: (last) => last.meta.currentPage < last.meta.totalPages ? last.meta.currentPage + 1 : undefined,
      gcTime: 0,
    })

  const items = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.meta.totalItems ?? 0
  const loadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }, [fetchNextPage, hasNextPage, isFetchingNextPage])
  const sentinelRef = useInfiniteScroll(loadMore, hasNextPage ?? false)

  return (
    <div className={s.tabBody}>
      <div className={s.tabToolbar}>
        <div className={ls.searchWrap}>
          <span className={ls.searchIcon}>⌕</span>
          <input className={ls.searchInput} type="search" placeholder="Buscar equipe..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar vínculo de equipe" />
          {q && (
            <button type="button" className={ls.searchClear} onClick={() => setQ('')} aria-label="Limpar busca">✕</button>
          )}
        </div>
        <select className={ls.filterSelect} value={status} onChange={(e) => setStatus(e.target.value as AffiliationStatus | '')} aria-label="Filtrar por status">
          <option value="">Status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="PENDING">Pendente</option>
          <option value="REJECTED">Rejeitado</option>
        </select>
        <Button variant="primary" onClick={() => setShowInvite(true)}>+ Convidar equipe</Button>
      </div>

      {isError ? (
        <ErrorState title="Não foi possível carregar os vínculos." onRetry={refetch} />
      ) : (
        <div className={ls.tableWrap}>
          <table className={ls.table}>
            <thead className={ls.thead}>
              <tr>
                <th className={ls.th}>Equipe <span className={ls.sortIcon}>⇅</span></th>
                <th className={`${ls.th} ${ls.thStatus}`}>Status <span className={ls.sortIcon}>⇅</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className={ls.skRow}>
                      <td><Skeleton width={60} height={14} /></td>
                      <td><Skeleton width={64} height={20} /></td>
                    </tr>
                  ))
                : items.map((aff) => (
                    <tr key={aff.id} className={ls.tr} tabIndex={0} onClick={() => setSelected(aff)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(aff) }}>
                      <td className={ls.td}>{aff.team.name}</td>
                      <td className={ls.tdStatus}><Badge variant={affiliationStatusVariant(aff.status)}>{affiliationStatusLabel(aff.status)}</Badge></td>
                    </tr>
                  ))}
              <tr><td colSpan={2} style={{ padding: 0 }}><div ref={sentinelRef} style={{ height: 1 }} /></td></tr>
            </tbody>
          </table>
          {isFetchingNextPage && <div className={ls.spinner}><div className={ls.spinnerDot} /></div>}
          {!isLoading && items.length === 0 && <EmptyState title="Nenhum vínculo de equipe encontrado." />}
        </div>
      )}
      {!isLoading && !isError && items.length > 0 && <p className={ls.counter}>{items.length} de {total} carregados</p>}

      <TeamAffiliationDrawer affiliation={selected} orgId={orgId} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); refetch() }} mode="edit" />
      <TeamAffiliationDrawer affiliation={null} orgId={orgId} onClose={() => setShowInvite(false)} onSaved={() => { setShowInvite(false); refetch() }} mode="invite" open={showInvite} />
    </div>
  )
}

const TABS = [
  { id: 'users', label: 'Usuários' },
  { id: 'teams', label: 'Equipes' },
]

export function AdminAffiliationsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const numericOrgId = Number(orgId)
  const [activeTab, setActiveTab] = useState('users')

  const { data: org } = useQuery({
    queryKey: ['admin-org', numericOrgId],
    queryFn: () => adminApi.getOrg(numericOrgId),
    enabled: !isNaN(numericOrgId),
  })

  if (isNaN(numericOrgId)) return <ErrorState title="ID de organização inválido." />

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <button type="button" className={s.backBtn} onClick={() => navigate('/admin/organizations')}>
          <ArrowLeft size={14} strokeWidth={1.6} /> Organizações
        </button>
        <p className={s.kicker}>{org?.name ?? '—'}</p>
        <h1 className={s.title}>Vínculos{org?.name ? <span className={s.titleOrg}> - {org.name}</span> : ''}</h1>
      </div>
      <div className={s.body}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        <div className={s.tabContent}>
          {activeTab === 'users' && <UserAffiliationsTab orgId={numericOrgId} />}
          {activeTab === 'teams' && <TeamAffiliationsTab orgId={numericOrgId} />}
        </div>
      </div>
    </div>
  )
}
