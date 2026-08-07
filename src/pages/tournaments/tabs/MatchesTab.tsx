import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { parsePositiveId } from '../../../features/sports/parsePositiveId'
import type { Tournament, MatchSummary, MatchStatus } from '../../../features/sports/types'
import {
  formatDateTime,
  MATCH_STATUS_LABELS,
  matchPhaseName,
  matchStatusVariant,
} from '../../../features/sports/sportsUtils'
import s from '../tournaments.module.css'

interface MatchesTabProps {
  tournament: Tournament
  matches: MatchSummary[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
  isOrgAdmin: boolean
}

const STATUS_OPTIONS: MatchStatus[] = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED']
const GROUP_PHASE_FILTER = '__group__'

export function MatchesTab({ tournament, matches, isPending, isError, onRetry, isOrgAdmin }: MatchesTabProps) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [team, setTeam] = useState<number | null>(null)
  const [status, setStatus] = useState<MatchStatus | ''>('')
  const [phase, setPhase] = useState('')

  const teamOptions = useMemo(() => {
    const options = new Map<number, string>()
    for (const m of matches) {
      options.set(m.homeTeam.tournamentTeamId, m.homeTeam.teamName)
      options.set(m.awayTeam.tournamentTeamId, m.awayTeam.teamName)
    }
    return [...options.entries()].map(([value, label]) => ({ value: String(value), label }))
  }, [matches])

  const phases = useMemo(() => {
    const options = new Map<string, string>()
    for (const m of matches) {
      if (m.bracketRound) {
        const label = m.bracketRound.label ?? `Rodada ${m.bracketRound.number}`
        options.set(String(m.bracketRound.id), label)
      } else if (m.tournamentGroupId) {
        options.set(GROUP_PHASE_FILTER, 'Fase de grupos')
      }
    }
    return [...options.entries()].map(([value, label]) => ({ value, label }))
  }, [matches])

  const filtered = useMemo(() => matches.filter((m) => {
    if (team != null && m.homeTeam.tournamentTeamId !== team && m.awayTeam.tournamentTeamId !== team) return false
    if (status && m.status !== status) return false
    if (phase === GROUP_PHASE_FILTER) {
      if (!m.tournamentGroupId || m.bracketRound) return false
    } else if (phase && String(m.bracketRound?.id) !== phase) {
      return false
    }
    if (q) {
      const home = m.homeTeam.teamName.toLowerCase()
      const away = m.awayTeam.teamName.toLowerCase()
      const needle = q.toLowerCase()
      if (!home.includes(needle) && !away.includes(needle)) return false
    }
    return true
  }), [matches, team, status, phase, q])

  const hasFilters = Boolean(q || team != null || status || phase)

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

      {isPending ? (
        <div className={s.tabEmpty}>
          <Skeleton width="100%" height={240} />
        </div>
      ) : isError ? (
        <div className={s.tabEmpty}>
          <ErrorState title="Não foi possível carregar as partidas." onRetry={onRetry} />
        </div>
      ) : (
        <>
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
                <Combobox aria-label="Filtrar por fase" options={[{ value: '', label: 'Fase' }, ...phases]} value={phase || null} onChange={setPhase} />
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className={s.tabEmpty}>
              <EmptyState
                title={hasFilters ? 'Nenhuma partida encontrada com os filtros atuais.' : 'Nenhuma partida agendada.'}
                description={hasFilters ? 'Ajuste os filtros para ver outras partidas.' : undefined}
              />
            </div>
          ) : (
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
                  {filtered.map((m) => {
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
          )}
        </>
      )}
    </>
  )
}
