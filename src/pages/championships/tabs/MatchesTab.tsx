import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import type { Championship, Match, MatchStatus, Team } from '../../../features/sports/types'
import {
  formatDateTime,
  MATCH_STATUS_LABELS,
  matchStatusVariant,
  sortMatchesByDateDesc,
} from '../../../features/sports/sportsUtils'
import s from '../championships.module.css'

interface MatchesTabProps {
  championship: Championship
  matches: Match[]
  teams: Map<string, Team>
}

const STATUS_OPTIONS: MatchStatus[] = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']

export function MatchesTab({ championship, matches, teams }: MatchesTabProps) {
  const [q, setQ] = useState('')
  const [team, setTeam] = useState('')
  const [status, setStatus] = useState<MatchStatus | ''>('')
  const [phase, setPhase] = useState('')

  const phases = useMemo(() => [...new Set(matches.map((m) => m.phase))], [matches])

  const filtered = useMemo(() => {
    const sorted = sortMatchesByDateDesc(matches)
    return sorted.filter((m) => {
      if (team && m.homeTeamId !== team && m.awayTeamId !== team) return false
      if (status && m.status !== status) return false
      if (phase && m.phase !== phase) return false
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
        <select className={s.filterSelect} value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Filtrar por equipe">
          <option value="">Equipe</option>
          {championship.teamIds.map((id) => (
            <option key={id} value={id}>
              {teams.get(id)?.name ?? id}
            </option>
          ))}
        </select>
        <select className={s.filterSelect} value={status} onChange={(e) => setStatus(e.target.value as MatchStatus | '')} aria-label="Filtrar por status">
          <option value="">Status</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {MATCH_STATUS_LABELS[st]}
            </option>
          ))}
        </select>
        <select className={s.filterSelect} value={phase} onChange={(e) => setPhase(e.target.value)} aria-label="Filtrar por fase">
          <option value="">Fase</option>
          {phases.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
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
                <th className={s.th}>Data</th>
                <th className={s.th}>Fase</th>
                <th className={s.th}>Mandante</th>
                <th className={s.th}>Visitante</th>
                <th className={`${s.th} ${s.thNum}`}>Placar</th>
                <th className={s.th}>Status</th>
                <th className={s.th}>Local</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const home = teams.get(m.homeTeamId)
                const away = teams.get(m.awayTeamId)
                const hasScore = m.homeScore !== null && m.awayScore !== null
                return (
                  <tr key={m.id} className={s.tr}>
                    <td className={`${s.td} ${s.mono}`}>{formatDateTime(m.date)}</td>
                    <td className={s.tdMuted}>{m.phase}</td>
                    <td className={s.td}>{home?.name ?? 'A definir'}</td>
                    <td className={s.td}>{away?.name ?? 'A definir'}</td>
                    <td className={`${s.td} ${s.tdNum} ${s.mono}`}>
                      {hasScore ? `${m.homeScore} - ${m.awayScore}` : '—'}
                    </td>
                    <td className={s.td}>
                      <Badge variant={matchStatusVariant(m.status)}>{MATCH_STATUS_LABELS[m.status]}</Badge>
                    </td>
                    <td className={s.tdMuted}>
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
