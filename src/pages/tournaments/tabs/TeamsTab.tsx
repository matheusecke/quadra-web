import { useMemo } from 'react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { cn } from '../../../components/ui/cn'
import type { Tournament, StandingRow, Team } from '../../../features/sports/types'
import { formatDiff } from '../../../features/sports/sportsUtils'
import { useStandingsQuery, useTournamentTeamsQuery } from '../../../features/sports/queries'
import s from '../tournaments.module.css'

interface TeamsTabProps {
  tournament: Tournament
  teams: Map<number, Team>
}

export function TeamsTab({ tournament, teams }: TeamsTabProps) {
  const { data: envelopes } = useStandingsQuery(tournament.id, tournament.format)
  const { data: tournamentTeams } = useTournamentTeamsQuery(tournament.id)
  const standingsByTeam = useMemo(() => {
    const map = new Map<number, StandingRow>()
    ;(envelopes ?? []).forEach((envelope) => envelope.rows.forEach((row) => map.set(row.tournamentTeamId, row)))
    return map
  }, [envelopes])

  if ((tournamentTeams ?? []).length === 0) {
    return (
      <div className={s.tabEmpty}>
        <EmptyState title="Nenhuma equipe participante." />
      </div>
    )
  }

  return (
    <div className={s.tableWrap} style={{ maxHeight: 'none' }}>
      <table className={s.table}>
        <thead className={s.thead}>
          <tr>
            <th className={s.th}>Equipe</th>
            <th className={s.th}>Status</th>
            <th className={`${s.th} ${s.thNum}`}>J</th>
            <th className={`${s.th} ${s.thNum}`}>V</th>
            <th className={`${s.th} ${s.thNum}`}>D</th>
            <th className={`${s.th} ${s.thNum}`}>PP</th>
            <th className={`${s.th} ${s.thNum}`}>PC</th>
            <th className={`${s.th} ${s.thNum}`}>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {(tournamentTeams ?? []).map((entry) => {
            const team = teams.get(entry.teamId)
            const row = standingsByTeam.get(entry.id)
            const diff = row?.pointDiff ?? 0
            return (
              <tr key={entry.id} className={s.tr} style={{ cursor: 'default' }}>
                <td className={s.td}>
                  <span className={s.cName}>{team?.name ?? '—'}</span>
                  <span className={s.standTeamTag}>{team?.shortName}</span>
                </td>
                <td className={s.td}>
                  <Badge variant="success">Ativa</Badge>
                </td>
                <td className={`${s.td} ${s.tdNum} ${s.mono}`}>{row?.played ?? '—'}</td>
                <td className={`${s.td} ${s.tdNum} ${s.mono}`}>{row?.wins ?? '—'}</td>
                <td className={`${s.td} ${s.tdNum} ${s.mono}`}>{row?.losses ?? '—'}</td>
                <td className={`${s.td} ${s.tdNum} ${s.mono}`}>{row?.pointsFor ?? '—'}</td>
                <td className={`${s.td} ${s.tdNum} ${s.mono}`}>{row?.pointsAgainst ?? '—'}</td>
                <td className={cn(s.td, s.tdNum, s.mono, row && diff > 0 && s.posDiff, row && diff < 0 && s.negDiff)}>
                  {row ? formatDiff(row) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
