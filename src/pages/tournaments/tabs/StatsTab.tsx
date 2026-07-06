import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import type { Tournament, Team } from '../../../features/sports/types'
import { LeadersGrid } from '../parts/LeadersGrid'
import s from '../tournaments.module.css'

interface StatsTabProps {
  tournament: Tournament
  teams: Map<string, Team>
}

/**
 * Statistics tab — basic per-game rankings ONLY (PPG, RPG, APG, STG, BPG).
 * Efficiency / shooting-percentage metrics are intentionally out of scope.
 */
export function StatsTab({ tournament, teams }: StatsTabProps) {
  const hasLeaders = tournament.leaders.ppg.length > 0

  if (!hasLeaders) {
    return (
      <div className={s.tabEmpty}>
        <EmptyState
          title="Sem estatísticas disponíveis."
          description="Os rankings aparecem após as primeiras partidas com estatísticas registradas."
        />
      </div>
    )
  }

  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>Rankings por categoria</h2>
        <span className={s.sectionHint}>Médias por jogo · top 5 · clique no atleta</span>
      </div>
      <LeadersGrid leaders={tournament.leaders} teams={teams} perCard={5} />
    </section>
  )
}
