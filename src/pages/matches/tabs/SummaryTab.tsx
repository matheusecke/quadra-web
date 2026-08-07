import { EmptyState } from '../../../components/ui'
import type { MatchDetail } from '../../../features/sports/types'
import { getPeriodLabel } from '../../../features/sports/sportsUtils'
import s from '../matches.module.css'

interface SummaryTabProps {
  match: MatchDetail
}

export function SummaryTab({ match }: SummaryTabProps) {
  if (match.periods.length === 0 && match.mvp === null) {
    return <EmptyState title="Nenhum resumo disponível." description="O placar por período e o MVP aparecem após a súmula." />
  }

  return (
    <>
      {match.periods.length > 0 && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>Placar por período</h2>
          </div>
          <div className={s.quarterWrap}>
            <table className={s.quarterTable}>
              <thead>
                <tr>
                  <th>Equipe</th>
                  {match.periods.map((period) => (
                    <th key={`${period.periodType}-${period.periodNumber}`}>{getPeriodLabel(period)}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{match.homeTeam.teamName}</td>
                  {match.periods.map((period) => (
                    <td key={`${period.periodType}-${period.periodNumber}`}>{period.homePoints}</td>
                  ))}
                  <td className={s.quarterTotal}>{match.homeTeam.score ?? '—'}</td>
                </tr>
                <tr>
                  <td>{match.awayTeam.teamName}</td>
                  {match.periods.map((period) => (
                    <td key={`${period.periodType}-${period.periodNumber}`}>{period.awayPoints}</td>
                  ))}
                  <td className={s.quarterTotal}>{match.awayTeam.score ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {match.mvp && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>Melhor em quadra</h2>
          </div>
          <div className={s.mvpCard}>
            <span className={s.mvpBadge}>MVP</span>
            <span className={s.mvpName}>{match.mvp.displayName}</span>
          </div>
        </section>
      )}
    </>
  )
}
