import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { useMatchesInfiniteQuery, useTournamentsQuery } from '../../features/sports/queries'
import { useIsOrgAdmin } from '../../features/sports/useIsOrgAdmin'
import type { MatchStatus } from '../../features/sports/types'
import {
  formatDateTime,
  MATCH_STATUS_LABELS,
  matchPhaseName,
  matchStatusVariant,
} from '../../features/sports/sportsUtils'
import s from './matches.module.css'

type StatusFilter = MatchStatus | ''

const STATUS_OPTIONS: Array<{ value: MatchStatus; label: string }> = [
  { value: 'SCHEDULED',     label: 'Agendada' },
  { value: 'LIVE',          label: 'Ao vivo' },
  { value: 'FINISHED',      label: 'Finalizada' },
  { value: 'POSTPONED',     label: 'Adiada' },
  { value: 'CANCELLED',     label: 'Cancelada' },
]

export function MatchesPage() {
  const navigate = useNavigate()

  const [search, setSearch]             = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tournamentId, setTournamentId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 280)
    return () => clearTimeout(t)
  }, [search])

  const handleClearSearch = () => {
    setSearch('')
    setDebouncedSearch('')
  }

  const filters = {
    q: debouncedSearch.trim() || undefined,
    tournamentId: tournamentId || undefined,
    status: statusFilter || undefined,
  }
  const matchesQuery = useMatchesInfiniteQuery(filters)
  const matches = matchesQuery.data?.pages.flatMap((page) => page.data) ?? []
  const totalItems = matchesQuery.data?.pages[0]?.meta.totalItems ?? 0

  const { data: tournaments } = useTournamentsQuery()
  const isOrgAdmin = useIsOrgAdmin()

  const champMap = useMemo(
    () => new Map((tournaments ?? []).map((c) => [c.id, c])),
    [tournaments],
  )

  const hasFilters = Boolean(debouncedSearch || tournamentId != null || statusFilter)

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <div className={s.headerRow}>
          <div>
            <p className={s.kicker}>Esportivo</p>
            <h1 className={s.title}>Partidas</h1>
            <p className={s.subtitle}>
              Todas as partidas dos campeonatos da organização.
            </p>
          </div>
          {isOrgAdmin && (
            <Button variant="primary" size="sm" onClick={() => navigate('/matches/new')}>
              Nova partida
            </Button>
          )}
        </div>

        <div className={s.toolbar}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>⌕</span>
            <input
              className={s.searchInput}
              type="search"
              placeholder="Buscar por equipe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar partida por equipe"
            />
            {search && (
              <button type="button" className={s.searchClear} onClick={handleClearSearch} aria-label="Limpar busca">
                ✕
              </button>
            )}
          </div>

          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar por campeonato" options={[{ value: '', label: 'Campeonato' }, ...(tournaments ?? []).map((tournament) => ({ value: String(tournament.id), label: tournament.name }))]} value={tournamentId == null ? null : String(tournamentId)} onChange={(raw) => setTournamentId(parsePositiveId(raw))} />
          </div>
          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar por status" options={[{ value: '', label: 'Status' }, ...STATUS_OPTIONS]} value={statusFilter || null} onChange={(value) => setStatusFilter(value as StatusFilter)} />
          </div>
        </div>
      </div>

      <div className={s.body}>
        {matchesQuery.isError ? (
          <div className={s.bodyFill}>
            <ErrorState title="Não foi possível carregar as partidas." onRetry={() => void matchesQuery.refetch()} />
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>Data</th>
                  <th className={s.th}>Campeonato</th>
                  <th className={s.th}>Mandante</th>
                  <th className={s.th}>Visitante</th>
                  <th className={`${s.th} ${s.thNum}`}>Placar</th>
                  <th className={s.th}>Fase</th>
                  <th className={s.th}>Status</th>
                  <th className={s.th}>Local</th>
                </tr>
              </thead>
              <tbody>
                {matchesQuery.isPending
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className={s.skRow}>
                        <td><Skeleton width={110} height={13} /></td>
                        <td><Skeleton width={130} height={13} /></td>
                        <td><Skeleton width={120} height={13} /></td>
                        <td><Skeleton width={120} height={13} /></td>
                        <td><Skeleton width={56}  height={13} /></td>
                        <td><Skeleton width={100} height={13} /></td>
                        <td><Skeleton width={90}  height={20} /></td>
                        <td><Skeleton width={110} height={13} /></td>
                      </tr>
                    ))
                  : matches.map((m) => {
                      const champ    = champMap.get(m.tournamentId)
                      const hasScore = m.homeTeam.score !== null && m.awayTeam.score !== null
                      return (
                        <tr
                          key={m.id}
                          className={s.tr}
                          tabIndex={0}
                          onClick={() => navigate(`/matches/${m.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              navigate(`/matches/${m.id}`)
                            }
                          }}
                        >
                          <td className={`${s.td} ${s.mono}`}>{formatDateTime(m.scheduledAt)}</td>
                          <td className={s.tdMuted}>{champ?.name ?? '—'}</td>
                          <td className={s.td}>
                            <Link
                              to={`/teams/${m.homeTeam.teamId}`}
                              className={s.teamLink}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {m.homeTeam.teamName}
                            </Link>
                          </td>
                          <td className={s.td}>
                            <Link
                              to={`/teams/${m.awayTeam.teamId}`}
                              className={s.teamLink}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {m.awayTeam.teamName}
                            </Link>
                          </td>
                          <td className={`${s.td} ${s.tdNum} ${s.mono}`}>
                            {hasScore
                              ? <strong>{m.homeTeam.score} – {m.awayTeam.score}</strong>
                              : <span className={s.scorePending}>—</span>
                            }
                          </td>
                          <td className={s.tdMuted}>{matchPhaseName(m) ?? ''}</td>
                          <td className={s.td}>
                            <Badge variant={matchStatusVariant(m.status)}>
                              {MATCH_STATUS_LABELS[m.status]}
                            </Badge>
                          </td>
                          <td className={s.tdMuted}>{m.venueName ?? '—'}</td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>

            {!matchesQuery.isPending && matches.length === 0 && (
              <EmptyState
                title={hasFilters ? 'Nenhuma partida encontrada com os filtros atuais.' : 'Nenhuma partida agendada.'}
                description={
                  hasFilters
                    ? 'Ajuste a busca ou os filtros para ver outras partidas.'
                    : 'As partidas dos campeonatos aparecerão aqui.'
                }
                icon={<CalendarDays size={20} strokeWidth={1.6} />}
              />
            )}

            {!matchesQuery.isPending && matchesQuery.hasNextPage && (
              <div className={s.loadMoreRow}>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={matchesQuery.isFetchingNextPage}
                  onClick={() => void matchesQuery.fetchNextPage()}
                >
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        )}

        {!matchesQuery.isPending && !matchesQuery.isError && matches.length > 0 && (
          <p className={s.counter}>
            {matches.length}
            {matches.length !== totalItems ? ` de ${totalItems}` : ''} partida{matches.length === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  )
}
