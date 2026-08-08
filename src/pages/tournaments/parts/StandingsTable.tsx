import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { StandingRow, Team } from '../../../features/sports/types'
import { cn } from '../../../components/ui/cn'
import { formatDiff, formatPct } from '../../../features/sports/sportsUtils'
import s from '../tournaments.module.css'

interface StandingsTableProps {
  /** Already ranked by the data layer (FIBA Appendix D). This component never sorts. */
  rows: StandingRow[]
  teams: Map<number, Team>
  /** 'compact' (overview) hides PP/PC/% ; 'full' (standings tab) shows all. */
  variant?: 'compact' | 'full'
  /** Rendered in the row's action slot — used for the draw affordance. */
  renderRowAction?: (row: StandingRow) => ReactNode
}

export function StandingsTable({ rows, teams, variant = 'compact', renderRowAction }: StandingsTableProps) {
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
            <th className={s.standPtsCol}>PTS</th>
            {full && <th>PP</th>}
            {full && <th>PC</th>}
            <th>Saldo</th>
            {full && <th>%</th>}
            {renderRowAction && <th aria-label="Ações" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const team = teams.get(row.teamId)
            return (
              <tr key={row.teamId} className={cn(row.isTiedUnresolved && s.standTied)}>
                <td className={s.standPos}>{row.position ?? '—'}</td>
                <td className={s.standTeam}>
                  <Link to={`/teams/${row.teamId}`} className={`${s.standTeamName} ${s.teamLink}`}>
                    {team?.name ?? row.teamName}
                  </Link>
                  <span className={s.standTeamTag}>{team?.shortName}</span>
                  {row.isTiedUnresolved && <span className={s.standTieChip}>⇅ empate</span>}
                </td>
                <td className={s.numCell}>{row.played}</td>
                <td className={s.numCell}>{row.wins}</td>
                <td className={s.numCell}>{row.losses}</td>
                <td className={cn(s.numCell, s.standPts)}>{row.classificationPoints}</td>
                {full && <td className={s.numCell}>{row.pointsFor}</td>}
                {full && <td className={s.numCell}>{row.pointsAgainst}</td>}
                <td className={cn(s.numCell, row.pointDiff > 0 && s.posDiff, row.pointDiff < 0 && s.negDiff)}>
                  {formatDiff(row)}
                </td>
                {full && <td className={s.numCell}>{formatPct(row)}</td>}
                {renderRowAction && <td className={s.standAction}>{renderRowAction(row)}</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className={s.standLegend}>PTS = 2 vitória · 1 derrota · 0 derrota por W.O.</p>
    </div>
  )
}
