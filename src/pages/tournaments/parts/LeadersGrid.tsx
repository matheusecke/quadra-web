import { Link } from 'react-router-dom'
import type { TournamentLeader, TournamentLeaders } from '../../../features/sports/types'
import { formatMeasuredGames, formatServerDecimal } from '../../../features/sports/sportsUtils'
import s from '../tournaments.module.css'

const PER_GAME = [
  ['ppg', 'PPG', 'Pontos por jogo'],
  ['rpg', 'RPG', 'Rebotes por jogo'],
  ['apg', 'APG', 'Assistências por jogo'],
  ['stg', 'STG', 'Roubos por jogo'],
  ['bpg', 'BPG', 'Tocos por jogo'],
] as const

const TOTALS = [
  ['pts', 'PTS', 'Pontos totais'],
  ['reb', 'REB', 'Rebotes totais'],
  ['ast', 'AST', 'Assistências totais'],
  ['stl', 'STL', 'Roubos totais'],
  ['blk', 'BLK', 'Tocos totais'],
] as const

interface LeadersGridProps {
  leaders: TournamentLeaders
  group: 'perGame' | 'totals'
  limit?: number
}

function LeaderRows({ rows }: { rows: TournamentLeader[] }) {
  if (rows.length === 0) return <div className={s.leaderEmpty}>Sem dados medidos.</div>

  return (
    <div className={s.leaderList}>
      {rows.map((leader, index) => (
        <div key={`${leader.athleteId}-${leader.tournamentTeamId}`} className={s.leaderRow}>
          <span className={s.leaderRank}>{index + 1}</span>
          <span className={s.leaderAthlete}>
            <Link to={`/athletes/${leader.athleteId}`} className={s.athleteLink}>
              {leader.athleteName}
            </Link>
            <span className={s.leaderTeam}>{leader.teamName}</span>
            <span className={s.leaderMeasured}>{formatMeasuredGames(leader.gamesPlayed)}</span>
          </span>
          <span className={s.leaderValue}>{formatServerDecimal(leader.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function LeadersGrid({ leaders, group, limit }: LeadersGridProps) {
  const cards = group === 'perGame'
    ? PER_GAME.map(([key, label, full]) => ({ key, label, full, rows: leaders.perGame[key] }))
    : TOTALS.map(([key, label, full]) => ({ key, label, full, rows: leaders.totals[key] }))
  return (
    <div className={s.leadersGrid}>
      {cards.map(({ key, label, full, rows: serverRows }) => {
        const rows = limit === undefined ? serverRows : serverRows.slice(0, limit)
        return (
          <div key={key} className={s.leaderCard} data-testid="leader-card">
            <div className={s.leaderHead}>
              <span className={s.leaderStat}>{label}</span>
              <span className={s.leaderStatFull}>{full}</span>
            </div>
            <LeaderRows rows={rows} />
          </div>
        )
      })}
    </div>
  )
}
