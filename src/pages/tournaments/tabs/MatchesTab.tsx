import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import type { Tournament, Match, MatchStatus, Team } from '../../../features/sports/types'
import {
  formatDateTime,
  MATCH_STATUS_LABELS,
  matchPhaseName,
  matchStatusVariant,
  sortMatchesByDateDesc,
} from '../../../features/sports/sportsUtils'
import s from '../tournaments.module.css'

interface MatchesTabProps {
  tournament: Tournament
  matches: Match[]
  teams: Map<string, Team>
}

const STATUS_OPTIONS: MatchStatus[] = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED']
const GROUP_PHASE_FILTER = '__group__'

export function MatchesTab({ tournament, matches, teams }: MatchesTabProps) {
  const [q, setQ] = useState('')
  const [team, setTeam] = useState('')
  const [status, setStatus] = useState<MatchStatus | ''>('')
  const [phase, setPhase] = useState('')

  const phases = useMemo(() => {
    const options = new Map<string, string>()
    for (const m of matches) {
      if (m.bracketRound) {
        const label = m.bracketRound.label ?? `Rodada ${m.bracketRound.number}`
        options.set(m.bracketRound.id, label)
      } else if (m.tournamentGroupId) {
        options.set(GROUP_PHASE_FILTER, 'Fase de grupos')
      }
    }
    return [...options.entries()].map(([value, label]) => ({ value, label }))
  }, [matches])

  const filtered = useMemo(() => {
    const sorted = sortMatchesByDateDesc(matches)
    return sorted.filter((m) => {
      if (team && m.homeTeamId !== team && m.awayTeamId !== team) return false
      if (status && m.status !== status) return false
      if (phase === GROUP_PHASE_FILTER) {
        if (!m.tournamentGroupId || m.bracketRound) return false
      } else if (phase && m.bracketRound?.id !== phase) {
        return false
      }
      if (q) {
        const home = teams.get(m.homeTeamId)?.name.toLowerCase() ?? ''
        const away = teams.get(m.awayTeamId)?.name.toLowerCase() ?? ''
        const needle = q.toLowerCase()
        if (!home.includes(needle) && !away.includes(needle)) return false
      }
      return true
    })
  }, [matches, team, status, phase, q, teams])

  return (
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
          <Combobox aria-label="Filtrar por equipe" options={[{ value: '', label: 'Equipe' }, ...tournament.teamIds.map((id) => ({ value: id, label: teams.get(id)?.name ?? id }))]} value={team || null} onChange={setTeam} />
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
          <EmptyState title="Nenhuma partida encontrada." description="Ajuste os filtros para ver outras partidas." />
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
                const home = teams.get(m.homeTeamId)
                const away = teams.get(m.awayTeamId)
                const homeName = home?.name ?? 'A definir'
                const awayName = away?.name ?? 'A definir'
                const hasScore = m.homeScore !== null && m.awayScore !== null
                const matchupLabel = hasScore
                  ? `${homeName} ${m.homeScore} - ${m.awayScore} ${awayName}`
                  : `${homeName} vs ${awayName}`
                return (
                  <tr key={m.id} className={s.tr}>
                    <td className={`${s.td} ${s.mono} ${s.matchesDateCol}`}>{formatDateTime(m.date)}</td>
                    <td className={`${s.td} ${s.matchesMatchupCol}`}>
                      <Link to={`/matches/${m.id}`} className={`${s.matchup} ${s.matchupLink}`} aria-label={matchupLabel}>
                        {hasScore ? (
                          <>
                            <span className={s.matchTeamName}>{homeName}</span>
                            <span className={s.matchScoreInline}>
                              {m.homeScore} - {m.awayScore}
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
                        {m.venue ?? '—'}
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
  )
}
