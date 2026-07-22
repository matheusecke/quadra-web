import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trophy, X } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { getCategoryName, getSeasonLabel, getSeasons } from '../../features/sports/mock-sports-data'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { useTournamentsQuery } from '../../features/sports/queries'
import { useIsOrgAdmin } from '../../features/sports/useIsOrgAdmin'
import type { TournamentStatus } from '../../features/sports/types'
import {
  TOURNAMENT_STATUS_LABELS,
  tournamentStatusVariant,
  formatDate,
  formatRelative,
  matchProgress,
} from '../../features/sports/sportsUtils'
import s from './tournaments.module.css'

const STATUS_OPTIONS: TournamentStatus[] = [
  'DRAFT',
  'REGISTRATION',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]

export function TournamentsPage() {
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<TournamentStatus | ''>('')
  const [season, setSeason] = useState<number | null>(null)

  const { data, isPending: isLoading, isError, refetch } = useTournamentsQuery()
  const isOrgAdmin = useIsOrgAdmin()
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
      if (season != null && c.seasonId !== season) return false
      return true
    })
  }, [data, debouncedQ, status, season])

  const total = data?.length ?? 0
  const hasFilters = Boolean(debouncedQ || status || season != null)

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div className={s.headerRow}>
          <div>
            <p className={s.kicker}>Esportivo</p>
            <h1 className={s.title}>Campeonatos</h1>
            <p className={s.subtitle}>
              Competições da organização, com status, fase e progresso das partidas.
            </p>
          </div>
          {isOrgAdmin && (
            <div className={s.headerActions}>
              <Button variant="secondary" size="sm" onClick={() => navigate('/tournaments/seasons')}>
                Temporadas
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/tournaments/categories')}>
                Categorias
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/tournaments/new')}>
                Novo campeonato
              </Button>
            </div>
          )}
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
          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar por temporada" options={[{ value: '', label: 'Temporada' }, ...seasons.map((opt) => ({ value: String(opt.id), label: opt.label }))]} value={season == null ? null : String(season)} onChange={(raw) => setSeason(parsePositiveId(raw))} />
          </div>
          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar por status" options={[{ value: '', label: 'Status' }, ...STATUS_OPTIONS.map((value) => ({ value, label: TOURNAMENT_STATUS_LABELS[value] }))]} value={status || null} onChange={(value) => setStatus(value as TournamentStatus | '')} />
          </div>
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
                        <td><Skeleton width={150} height={14} /></td>
                        <td><Skeleton width={70} height={14} /></td>
                      </tr>
                    ))
                  : items.map((c) => (
                      <tr
                        key={c.id}
                        className={s.tr}
                        tabIndex={0}
                        onClick={() => navigate(`/tournaments/${c.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate(`/tournaments/${c.id}`)
                          }
                        }}
                      >
                        <td className={s.td}>
                          <span className={s.cName}>{c.name}</span>
                        </td>
                        <td className={`${s.td} ${s.mono}`}>{getSeasonLabel(c.seasonId)}</td>
                        <td className={s.tdMuted}>{getCategoryName(c.categoryId)}</td>
                        <td className={s.td}>
                          <Badge variant={tournamentStatusVariant(c.status)}>
                            {TOURNAMENT_STATUS_LABELS[c.status]}
                          </Badge>
                        </td>
                        <td className={`${s.td} ${s.tdNum} ${s.mono}`}>{c.teamIds.length}</td>
                        <td className={`${s.td} ${s.tdNum} ${s.mono}`}>
                          {matchProgress(c)}
                          <span className={s.numSub}>fin./total</span>
                        </td>
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
