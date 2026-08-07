import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { useTournamentLeadersQuery } from '../../../features/sports/queries'
import type { Tournament } from '../../../features/sports/types'
import { LeadersGrid } from '../parts/LeadersGrid'
import s from '../tournaments.module.css'

export function StatsTab({ tournament }: { tournament: Tournament }) {
  const leadersQuery = useTournamentLeadersQuery(tournament.id)
  const leaders = leadersQuery.data
  const hasLeaders = leaders !== undefined && [
    ...Object.values(leaders.perGame),
    ...Object.values(leaders.totals),
  ].some((rows) => rows.length > 0)

  if (leadersQuery.isPending) {
    return <div className={s.tabEmpty}><Skeleton width="100%" height={320} /></div>
  }
  if (leadersQuery.isError) {
    return (
      <div className={s.tabEmpty}>
        <ErrorState title="Não foi possível carregar os líderes." onRetry={() => leadersQuery.refetch()} />
      </div>
    )
  }
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
        <span className={s.sectionHint}>Top 5 fixo · ordem do servidor · clique no atleta</span>
      </div>
      <div className={s.leaderGroups}>
        <section>
          <h3 className={s.leaderGroupTitle}>Médias por jogo</h3>
          <LeadersGrid leaders={leaders} group="perGame" />
        </section>
        <section>
          <h3 className={s.leaderGroupTitle}>Totais</h3>
          <LeadersGrid leaders={leaders} group="totals" />
        </section>
      </div>
    </section>
  )
}
