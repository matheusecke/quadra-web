import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge/Badge'
import type { Match, Team } from '../../../features/sports/types'
import {
  formatDateTime,
  MATCH_STATUS_LABELS,
  matchStatusVariant,
} from '../../../features/sports/sportsUtils'
import s from '../tournaments.module.css'

interface MatchListProps {
  matches: Match[]
  teams: Map<string, Team>
}

/** Compact match list used on the overview tab. */
export function MatchList({ matches, teams }: MatchListProps) {
  return (
    <div className={s.matchList}>
      {matches.map((m) => {
        const home = teams.get(m.homeTeamId)
        const away = teams.get(m.awayTeamId)
        const homeName = home?.name ?? 'A definir'
        const awayName = away?.name ?? 'A definir'
        const hasScore = m.homeScore !== null && m.awayScore !== null
        const matchupLabel = hasScore
          ? `${homeName} ${m.homeScore} - ${m.awayScore} ${awayName}`
          : `${homeName} vs ${awayName}`
        return (
          <Link key={m.id} to={`/matches/${m.id}`} className={s.matchRow}>
            <span className={s.matchDate}>{formatDateTime(m.date)}</span>
            <span className={s.matchup} aria-label={matchupLabel}>
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
            </span>
            <span className={s.matchPhase}>{m.phase}</span>
            <span className={s.matchStatusCell}>
              <Badge variant={matchStatusVariant(m.status)}>{MATCH_STATUS_LABELS[m.status]}</Badge>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
