import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { parsePositiveId } from '../../../features/sports/parsePositiveId'
import {
  useBracketQuery,
  useGroupsQuery,
  useMatchesInfiniteQuery,
  useTournamentTeamsQuery,
} from '../../../features/sports/queries'
import type { Tournament, MatchStatus } from '../../../features/sports/types'
import {
  formatDateTime,
  hasGroupStage,
  hasKnockout,
  MATCH_STATUS_LABELS,
  matchPhaseName,
  matchStatusVariant,
  roundDisplayName,
} from '../../../features/sports/sportsUtils'
import s from '../tournaments.module.css'

interface MatchesTabProps {
  tournament: Tournament
  isOrgAdmin: boolean
}

const STATUS_OPTIONS: MatchStatus[] = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED']
const GROUP_PHASE_FILTER = '__group__'

export function MatchesTab({ tournament, isOrgAdmin }: MatchesTabProps) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [team, setTeam] = useState<number | null>(null)
  const [status, setStatus] = useState<MatchStatus | ''>('')
  const [phase, setPhase] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 280)
    return () => clearTimeout(timer)
  }, [q])

  // The options come from the catalogs, not from the loaded matches: with server-side
  // pagination there is no complete array left to derive them from.
  const { data: tournamentTeams } = useTournamentTeamsQuery(tournament.id)
  const { data: groups } = useGroupsQuery(hasGroupStage(tournament.format) ? tournament.id : undefined)
  const { data: bracket } = useBracketQuery(hasKnockout(tournament.format) ? tournament.id : undefined)

  const teamOptions = useMemo(
    () => (tournamentTeams ?? []).map((entry) => ({ value: String(entry.id), label: entry.displayNameSnapshot })),
    [tournamentTeams],
  )

  const groupIds = useMemo(() => (groups ?? []).map((group) => group.id), [groups])

  const phases = useMemo(
    () => [
      ...(groupIds.length > 0 ? [{ value: GROUP_PHASE_FILTER, label: 'Fase de grupos' }] : []),
      ...(bracket?.rounds ?? []).map((round) => ({ value: String(round.id), label: roundDisplayName(round) })),
    ],
    [groupIds, bracket],
  )

  // A phase whose option no longer exists (its group or round was deleted) must read as no filter:
  // an empty id list serialises to nothing and would silently widen the list instead of narrowing it.
  const activePhase = phases.some((option) => option.value === phase) ? phase : ''

  const matchesQuery = useMatchesInfiniteQuery({
    tournamentId: tournament.id,
    q: debouncedQ.trim() || undefined,
    tournamentTeamIds: team != null ? [team] : undefined,
    status: status || undefined,
    tournamentGroupIds: activePhase === GROUP_PHASE_FILTER ? groupIds : undefined,
    bracketRoundIds: activePhase && activePhase !== GROUP_PHASE_FILTER ? [Number(activePhase)] : undefined,
  })
  const matches = matchesQuery.data?.pages.flatMap((page) => page.data) ?? []

  const hasFilters = Boolean(debouncedQ || team != null || status || activePhase)

  return (
    <>
      {isOrgAdmin && (
        <div className={s.tabActions}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/tournaments/${tournament.id}/matches/new`)}
          >
            Nova partida
          </Button>
        </div>
      )}

      {/* The bar stays outside the conditional block: switching a filter returns isPending,
          and unmounting it would steal the focus from the search field. */}
      <div className={s.tabToolbar}>
        <div className={s.searchWrap}>
          <span className={s.searchIcon} aria-hidden="true">
            <Search size={14} strokeWidth={1.7} />
          </span>
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
              <X size={13} strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className={s.filterControl}>
          <Combobox aria-label="Filtrar por equipe" options={[{ value: '', label: 'Equipe' }, ...teamOptions]} value={team == null ? null : String(team)} onChange={(raw) => setTeam(parsePositiveId(raw))} />
        </div>
        <div className={s.filterControl}>
          <Combobox aria-label="Filtrar por status" options={[{ value: '', label: 'Status' }, ...STATUS_OPTIONS.map((value) => ({ value, label: MATCH_STATUS_LABELS[value] }))]} value={status || null} onChange={(value) => setStatus(value as MatchStatus | '')} />
        </div>
        {phases.length > 0 && (
          <div className={s.filterControl}>
            <Combobox aria-label="Filtrar por fase" options={[{ value: '', label: 'Fase' }, ...phases]} value={activePhase || null} onChange={setPhase} />
          </div>
        )}
      </div>

      {matchesQuery.isError ? (
        <div className={s.tabEmpty}>
          <ErrorState title="Não foi possível carregar as partidas." onRetry={() => void matchesQuery.refetch()} />
        </div>
      ) : matchesQuery.isPending ? (
        <div className={s.tabEmpty}>
          <Skeleton width="100%" height={240} />
        </div>
      ) : matches.length === 0 ? (
        <div className={s.tabEmpty}>
          <EmptyState
            title={hasFilters ? 'Nenhuma partida encontrada com os filtros atuais.' : 'Nenhuma partida agendada.'}
            description={hasFilters ? 'Ajuste os filtros para ver outras partidas.' : undefined}
          />
        </div>
      ) : (
        <>
          <div className={s.tableWrap} style={{ maxHeight: 'none' }}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={`${s.th} ${s.matchesDateCol}`}>Data</th>
                  <th className={`${s.th} ${s.matchesMatchupCol}`}>Partida</th>
                  <th className={`${s.th} ${s.matchesPhaseCol}`}>Fase</th>
                  <th className={`${s.th} ${s.matchesStatusCol}`}>Status</th>
                  <th className={`${s.th} ${s.matchesVenueCol}`}>Local</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const homeName = m.homeTeam.teamName
                  const awayName = m.awayTeam.teamName
                  const hasScore = m.homeTeam.score !== null && m.awayTeam.score !== null
                  const matchupLabel = hasScore
                    ? `${homeName} ${m.homeTeam.score} - ${m.awayTeam.score} ${awayName}`
                    : `${homeName} vs ${awayName}`
                  return (
                    <tr key={m.id} className={s.tr}>
                      <td className={`${s.td} ${s.mono} ${s.matchesDateCol}`}>{formatDateTime(m.scheduledAt)}</td>
                      <td className={`${s.td} ${s.matchesMatchupCol}`}>
                        <Link to={`/matches/${m.id}`} className={`${s.matchup} ${s.matchupLink}`} aria-label={matchupLabel}>
                          {hasScore ? (
                            <>
                              <span className={s.matchTeamName}>{homeName}</span>
                              <span className={s.matchScoreInline}>
                                {m.homeTeam.score} - {m.awayTeam.score}
                              </span>
                              <span className={s.matchTeamName}>{awayName}</span>
                            </>
                          ) : (
                            <>
                              <span className={s.matchTeamName}>{homeName}</span>
                              <span className={s.matchVs}>vs</span>
                              <span className={s.matchTeamName}>{awayName}</span>
                            </>
                          )}
                        </Link>
                      </td>
                      <td className={`${s.tdMuted} ${s.matchesPhaseCol}`}>{matchPhaseName(m) ?? ''}</td>
                      <td className={`${s.td} ${s.matchesStatusCol}`}>
                        <Badge variant={matchStatusVariant(m.status)}>{MATCH_STATUS_LABELS[m.status]}</Badge>
                      </td>
                      <td className={`${s.tdMuted} ${s.matchesVenueCol}`}>
                        <Link to={`/matches/${m.id}`} className={s.athleteLink}>
                          {m.venueName ?? '—'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {matchesQuery.hasNextPage && (
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
        </>
      )}
    </>
  )
}
