import type { StandingRow, Team } from '../../../features/sports/types'
import { cn } from '../../../components/ui/cn'
import { formatDiff, formatPct, pointDiff, rankStandings } from '../../../features/sports/sportsUtils'
import s from '../championships.module.css'

interface StandingsTableProps {
  rows: StandingRow[]
  teams: Map<string, Team>
  /** 'compact' (overview) hides PF/PA/% ; 'full' (standings tab) shows all. */
  variant?: 'compact' | 'full'
  /** Top N positions flagged as qualified for the playoffs. */
  qualified?: number
}

export function StandingsTable({ rows, teams, variant = 'compact', qualified = 2 }: StandingsTableProps) {
  const ranked = rankStandings(rows)
  const full = variant === 'full'

  return (
    <div className={s.standScroll}>
      <table className={s.standTable}>
        <thead>
          <tr>
            <th className={s.standPosCol}>#</th>
            <th className={s.standTeamCol}>Equipe</th>
            <th>J</th>
            <th>V</th>
            <th>D</th>
            {full && <th>PP</th>}
            {full && <th>PC</th>}
            <th>Saldo</th>
            {full && <th>%</th>}
          </tr>
        </thead>
        <tbody>
          {ranked.map((row) => {
            const team = teams.get(row.teamId)
            const diff = pointDiff(row)
            return (
              <tr key={row.teamId} className={cn(row.position <= qualified && s.standQualified)}>
                <td className={s.standPos}>{row.position}</td>
                <td className={s.standTeam}>
                  <span className={s.standTeamName}>{team?.name ?? '—'}</span>
                  <span className={s.standTeamTag}>{team?.shortName}</span>
                </td>
                <td className={s.numCell}>{row.played}</td>
                <td className={s.numCell}>{row.wins}</td>
                <td className={s.numCell}>{row.losses}</td>
                {full && <td className={s.numCell}>{row.pointsFor}</td>}
                {full && <td className={s.numCell}>{row.pointsAgainst}</td>}
                <td className={cn(s.numCell, diff > 0 && s.posDiff, diff < 0 && s.negDiff)}>
                  {formatDiff(row)}
                </td>
                {full && <td className={s.numCell}>{formatPct(row)}</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
