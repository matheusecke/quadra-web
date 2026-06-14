import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trophy, X } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { getSeasons } from '../../features/sports/mockSportsData'
import { useChampionships } from '../../features/sports/useSportsData'
import type { ChampionshipStatus } from '../../features/sports/types'
import {
  CHAMPIONSHIP_STATUS_LABELS,
  championshipStatusVariant,
  formatDate,
  formatRelative,
  matchProgress,
  PHASE_LABELS,
} from '../../features/sports/sportsUtils'
import s from './championships.module.css'

const STATUS_OPTIONS: ChampionshipStatus[] = [
  'SCHEDULED',
  'IN_PROGRESS',
  'PLAYOFFS',
  'FINISHED',
  'CANCELED',
]

export function ChampionshipsPage() {
  const navigate = useNavigate()
  const { user, organizations } = useAuth()
  const activeOrg = organizations.find((o) => o.organizationId === user?.organizationId) ?? null
  const activeOrgName = activeOrg?.organizationName ?? (user?.organizationId ? `Organização #${user.organizationId}` : 'Sem organização')

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<ChampionshipStatus | ''>('')
  const [season, setSeason] = useState('')

  const { data, isLoading, isError, refetch } = useChampionships()
  const seasons = useMemo(() => getSeasons(), [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const items = useMemo(() => {
    const all = data ?? []
    return all.filter((c) => {
      if (debouncedQ && !c.name.toLowerCase().includes(debouncedQ.toLowerCase())) return false
      if (status && c.status !== status) return false
      if (season && c.season !== season) return false
      return true
    })
  }, [data, debouncedQ, status, season])

  const total = data?.length ?? 0
  const hasFilters = Boolean(debouncedQ || status || season)

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div className={s.headerRow}>
          <div>
            <p className={s.kicker}>Esportivo · Campeonatos</p>
            <h1 className={s.title}>Campeonatos</h1>
            <p className={s.subtitle}>
              Competições da organização ativa, com status, fase e progresso das partidas.
            </p>
          </div>
          <div className={s.orgContext} title="Organização ativa">
            <span className={s.orgDot} aria-hidden="true" />
            <div className={s.orgContextText}>
              <span className={s.orgContextLabel}>Organização ativa</span>
              <span className={s.orgContextName}>{activeOrgName}</span>
            </div>
          </div>
        </div>

        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon} aria-hidden="true">
              <Search size={14} strokeWidth={1.7} />
            </span>
            <input
              className={s.searchInput}
              type="search"
              placeholder="Buscar campeonato por nome..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar campeonato"
            />
            {q && (
              <button type="button" className={s.searchClear} onClick={() => setQ('')} aria-label="Limpar busca">
                <X size={13} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
          </div>
          <select
            className={s.filterSelect}
            value={status}
            onChange={(e) => setStatus(e.target.value as ChampionshipStatus | '')}
            aria-label="Filtrar por status"
          >
            <option value="">Status</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {CHAMPIONSHIP_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
          <select
            className={s.filterSelect}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            aria-label="Filtrar por temporada"
          >
            <option value="">Temporada</option>
            {seasons.map((sea) => (
              <option key={sea} value={sea}>
                {sea}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={s.body}>
        {isError ? (
          <div className={s.bodyFill}>
            <ErrorState title="Não foi possível carregar os campeonatos." onRetry={refetch} />
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>Campeonato</th>
                  <th className={s.th}>Temporada</th>
                  <th className={s.th}>Categoria</th>
                  <th className={s.th}>Status</th>
                  <th className={`${s.th} ${s.thNum}`}>Equipes</th>
                  <th className={`${s.th} ${s.thNum}`}>Partidas</th>
                  <th className={s.th}>Fase</th>
                  <th className={s.th}>Período</th>
                  <th className={s.th}>Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className={s.skRow}>
                        <td><Skeleton width={200} height={14} /></td>
                        <td><Skeleton width={56} height={14} /></td>
                        <td><Skeleton width={120} height={14} /></td>
                        <td><Skeleton width={84} height={20} /></td>
                        <td><Skeleton width={28} height={14} /></td>
                        <td><Skeleton width={44} height={14} /></td>
                        <td><Skeleton width={96} height={14} /></td>
                        <td><Skeleton width={150} height={14} /></td>
                        <td><Skeleton width={70} height={14} /></td>
                      </tr>
                    ))
                  : items.map((c) => (
                      <tr
                        key={c.id}
                        className={s.tr}
                        tabIndex={0}
                        onClick={() => navigate(`/championships/${c.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate(`/championships/${c.id}`)
                          }
                        }}
                      >
                        <td className={s.td}>
                          <span className={s.cName}>{c.name}</span>
                        </td>
                        <td className={`${s.td} ${s.mono}`}>{c.season}</td>
                        <td className={s.tdMuted}>{c.category}</td>
                        <td className={s.td}>
                          <Badge variant={championshipStatusVariant(c.status)}>
                            {CHAMPIONSHIP_STATUS_LABELS[c.status]}
                          </Badge>
                        </td>
                        <td className={`${s.td} ${s.tdNum} ${s.mono}`}>{c.teamIds.length}</td>
                        <td className={`${s.td} ${s.tdNum} ${s.mono}`}>
                          {matchProgress(c)}
                          <span className={s.numSub}>fin./total</span>
                        </td>
                        <td className={s.tdMuted}>{PHASE_LABELS[c.currentPhase]}</td>
                        <td className={s.tdMuted}>
                          <span className={s.mono}>{formatDate(c.startDate)}</span>
                          <span className={s.periodSep}>-</span>
                          <span className={s.mono}>{formatDate(c.endDate)}</span>
                        </td>
                        <td className={s.tdMuted}>{formatRelative(c.updatedAt)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {!isLoading && items.length === 0 && (
              <EmptyState
                title={hasFilters ? 'Nenhum campeonato encontrado.' : 'Nenhum campeonato cadastrado.'}
                description={
                  hasFilters
                    ? 'Ajuste a busca ou os filtros para ver outros campeonatos.'
                    : 'Os campeonatos da organização aparecerão aqui quando forem criados.'
                }
                icon={<Trophy size={20} strokeWidth={1.6} />}
              />
            )}
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <p className={s.counter}>
            {items.length}
            {items.length !== total ? ` de ${total}` : ''} campeonato{items.length === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  )
}
