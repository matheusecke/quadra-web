import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { getTeams } from '../../features/sports/mock-sports-data'
import { useMatchesQuery, useTournamentsQuery } from '../../features/sports/queries'
import { useIsOrgAdmin } from '../../features/sports/useIsOrgAdmin'
import type { MatchStatus } from '../../features/sports/types'
import {
  formatDateTime,
  matchDisplayStatus,
  matchDisplayStatusVariant,
  matchPhaseName,
  sortMatchesByDateDesc,
  teamMap,
} from '../../features/sports/sportsUtils'
import s from './matches.module.css'

type StatusFilter = MatchStatus | 'WAITING_STATS' | ''

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'SCHEDULED',     label: 'Agendada' },
  { value: 'LIVE',          label: 'Ao vivo' },
  { value: 'FINISHED',      label: 'Finalizada' },
  { value: 'WAITING_STATS', label: 'Aguardando estatísticas' },
  { value: 'POSTPONED',     label: 'Adiada' },
]

export function MatchesPage() {
  const navigate = useNavigate()

  const [q, setQ]                       = useState('')
  const [debouncedQ, setDebouncedQ]     = useState('')
  const [tournamentId, setTournamentId] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 280)
    return () => clearTimeout(t)
  }, [q])

  const { data: matches, isPending: isLoading, isError, refetch } = useMatchesQuery()
  const { data: tournaments } = useTournamentsQuery()
  const isOrgAdmin = useIsOrgAdmin()

  const champMap = useMemo(
    () => new Map((tournaments ?? []).map((c) => [c.id, c])),
    [tournaments],
  )
  const teams = useMemo(() => teamMap(getTeams()), [])

  const items = useMemo(() => {
    const all = sortMatchesByDateDesc(matches ?? [])
    return all.filter((m) => {
      if (tournamentId && m.tournamentId !== tournamentId) return false
      if (statusFilter === 'WAITING_STATS') {
        if (!(m.status === 'FINISHED' && m.statsStatus === 'PENDING')) return false
      } else if (statusFilter && m.status !== statusFilter) {
        return false
      }
      if (debouncedQ) {
        const home   = teams.get(m.homeTeamId)?.name.toLowerCase() ?? ''
        const away   = teams.get(m.awayTeamId)?.name.toLowerCase() ?? ''
        const needle = debouncedQ.toLowerCase()
        if (!home.includes(needle) && !away.includes(needle)) return false
      }
      return true
    })
  }, [matches, tournamentId, statusFilter, debouncedQ, teams])

  const total      = matches?.length ?? 0
  const hasFilters = Boolean(debouncedQ || tournamentId || statusFilter)

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
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar partida por equipe"
            />
            {q && (
              <button type="button" className={s.searchClear} onClick={() => setQ('')} aria-label="Limpar busca">
                ✕
              </button>
            )}
          </div>

          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar por campeonato" options={[{ value: '', label: 'Campeonato' }, ...(tournaments ?? []).map((tournament) => ({ value: tournament.id, label: tournament.name }))]} value={tournamentId || null} onChange={setTournamentId} />
          </div>
          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar por status" options={[{ value: '', label: 'Status' }, ...STATUS_OPTIONS]} value={statusFilter || null} onChange={(value) => setStatusFilter(value as StatusFilter)} />
          </div>
        </div>
      </div>

      <div className={s.body}>
        {isError ? (
          <div className={s.bodyFill}>
            <ErrorState title="Não foi possível carregar as partidas." onRetry={refetch} />
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
                {isLoading
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
                  : items.map((m) => {
                      const home     = teams.get(m.homeTeamId)
                      const away     = teams.get(m.awayTeamId)
                      const champ    = champMap.get(m.tournamentId)
                      const hasScore = m.homeScore !== null && m.awayScore !== null
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
                          <td className={`${s.td} ${s.mono}`}>{formatDateTime(m.date)}</td>
                          <td className={s.tdMuted}>{champ?.name ?? '—'}</td>
                          <td className={s.td}>{home?.name ?? 'A definir'}</td>
                          <td className={s.td}>{away?.name ?? 'A definir'}</td>
                          <td className={`${s.td} ${s.tdNum} ${s.mono}`}>
                            {hasScore
                              ? <strong>{m.homeScore} – {m.awayScore}</strong>
                              : <span className={s.scorePending}>—</span>
                            }
                          </td>
                          <td className={s.tdMuted}>{matchPhaseName(m) ?? ''}</td>
                          <td className={s.td}>
                            <Badge variant={matchDisplayStatusVariant(m.status, m.statsStatus)}>
                              {matchDisplayStatus(m.status, m.statsStatus)}
                            </Badge>
                          </td>
                          <td className={s.tdMuted}>{m.venue ?? '—'}</td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>

            {!isLoading && items.length === 0 && (
              <EmptyState
                title={hasFilters ? 'Nenhuma partida encontrada.' : 'Nenhuma partida cadastrada.'}
                description={
                  hasFilters
                    ? 'Ajuste a busca ou os filtros para ver outras partidas.'
                    : 'As partidas dos campeonatos aparecerão aqui.'
                }
                icon={<CalendarDays size={20} strokeWidth={1.6} />}
              />
            )}
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <p className={s.counter}>
            {items.length}
            {items.length !== total ? ` de ${total}` : ''} partida{items.length === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  )
}
