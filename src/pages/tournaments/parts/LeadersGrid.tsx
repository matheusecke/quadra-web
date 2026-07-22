import { Link } from 'react-router-dom'
import type { StatLeaders, Team } from '../../../features/sports/types'
import { LEADER_STAT_META, LEADER_STAT_ORDER } from '../../../features/sports/sportsUtils'
import s from '../tournaments.module.css'

interface LeadersGridProps {
  leaders: StatLeaders
  teams: Map<number, Team>
  /** Max leaders shown per category. Overview uses 3; Stats tab uses 5. */
  perCard?: number
}

/**
 * Statistical leaders — basic per-game categories ONLY (PPG, RPG, APG, STG, BPG).
 * Advanced efficiency and shooting splits are intentionally excluded this round.
 */
export function LeadersGrid({ leaders, teams, perCard = 3 }: LeadersGridProps) {
  return (
    <div className={s.leadersGrid}>
      {LEADER_STAT_ORDER.map((stat) => {
        const meta = LEADER_STAT_META[stat]
        const rows = leaders[stat].slice(0, perCard)
        return (
          <div key={stat} className={s.leaderCard}>
            <div className={s.leaderHead}>
              <span className={s.leaderStat}>{meta.label}</span>
              <span className={s.leaderStatFull}>{meta.full}</span>
            </div>
            <div className={s.leaderList}>
              {rows.map((leader, i) => {
                const team = teams.get(leader.teamId)
                return (
                  <div key={leader.athleteId} className={s.leaderRow}>
                    <span className={s.leaderRank}>{i + 1}</span>
                    <span className={s.leaderAthlete}>
                      <Link to={`/athletes/${leader.athleteId}`} className={s.athleteLink}>
                        {leader.athleteName}
                      </Link>
                      <span className={s.leaderTeam}>{team?.shortName ?? '—'}</span>
                    </span>
                    <span className={s.leaderValue}>{leader.value === null ? 'N/A' : leader.value.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
