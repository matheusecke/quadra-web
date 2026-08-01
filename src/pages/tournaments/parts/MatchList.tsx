import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge/Badge'
import type { MatchSummary } from '../../../features/sports/types'
import {
  formatDateTime,
  MATCH_STATUS_LABELS,
  matchPhaseName,
  matchStatusVariant,
} from '../../../features/sports/sportsUtils'
import s from '../tournaments.module.css'

interface MatchListProps {
  matches: MatchSummary[]
}

/** Compact match list used on the overview tab. */
export function MatchList({ matches }: MatchListProps) {
  return (
    <div className={s.matchList}>
      {matches.map((m) => {
        const homeName = m.homeTeam.teamName
        const awayName = m.awayTeam.teamName
        const hasScore = m.homeTeam.score !== null && m.awayTeam.score !== null
        const isForfeit = m.homeTeam.lossType === 'FORFEIT' || m.awayTeam.lossType === 'FORFEIT'
        const matchupLabel = hasScore
          ? `${homeName} ${m.homeTeam.score} - ${m.awayTeam.score} ${awayName}`
          : `${homeName} vs ${awayName}`
        return (
          <Link key={m.id} to={`/matches/${m.id}`} className={s.matchRow}>
            <span className={s.matchDate}>{formatDateTime(m.scheduledAt)}</span>
            <span className={s.matchup} aria-label={matchupLabel}>
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
            </span>
            <span className={s.matchPhase}>{matchPhaseName(m) ?? ''}</span>
            <span className={s.matchStatusCell}>
              <Badge variant={matchStatusVariant(m.status)}>{MATCH_STATUS_LABELS[m.status]}</Badge>
              {isForfeit && <Badge variant="warning">W.O.</Badge>}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
