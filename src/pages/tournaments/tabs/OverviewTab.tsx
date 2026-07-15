import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import type { Tournament, Match, Team } from '../../../features/sports/types'
import { sortMatchesByDateDesc } from '../../../features/sports/sportsUtils'
import { useStandingsQuery } from '../../../features/sports/queries'
import { LeadersGrid } from '../parts/LeadersGrid'
import { StandingsTable } from '../parts/StandingsTable'
import { MatchList } from '../parts/MatchList'
import s from '../tournaments.module.css'

interface OverviewTabProps {
  tournament: Tournament
  matches: Match[]
  teams: Map<string, Team>
}

/**
 * Overview — the main reading surface. Fixed section order:
 * 1. Grupos → 2. Líderes → 3. Partidas recentes → 4. Regulamento.
 */
export function OverviewTab({ tournament, matches, teams }: OverviewTabProps) {
  const recentMatches = sortMatchesByDateDesc(matches)
  const hasLeaders = tournament.leaders.ppg.length > 0
  // Ranked by the data layer, one envelope per group (one with group: null in LEAGUE).
  const { data: envelopes, isPending: isStandingsPending, isError: isStandingsError, refetch: refetchStandings } =
    useStandingsQuery(tournament.id)
  const tables = envelopes ?? []

  return (
    <>
      {/* 1. Grupos e classificação resumida */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Grupos</h2>
          <span className={s.sectionHint}>Ordenação FIBA por pontos de classificação</span>
        </div>
        {isStandingsPending && (
          <div className={s.tabEmpty}>
            <Skeleton width="100%" height={200} />
          </div>
        )}
        {isStandingsError && (
          <div className={s.tabEmpty}>
            <ErrorState title="Não foi possível carregar a classificação." onRetry={() => refetchStandings()} />
          </div>
        )}
        {!isStandingsPending && !isStandingsError && (
          tables.length > 0 ? (
            <div className={s.groupsGrid}>
              {tables.map((envelope) => (
                <div key={envelope.group?.id ?? tournament.id} className={s.standCard}>
                  <div className={s.standCardHead}>{envelope.group?.name ?? 'Classificação'}</div>
                  <StandingsTable rows={envelope.rows} teams={teams} variant="compact" />
                </div>
              ))}
            </div>
          ) : (
            <div className={s.tabEmpty}>
              <EmptyState title="Grupos ainda não definidos." />
            </div>
          )
        )}
      </section>

      {/* 2. Líderes estatísticos principais */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Líderes</h2>
          <span className={s.sectionHint}>Médias por jogo, clique no atleta para o perfil</span>
        </div>
        {hasLeaders ? (
          <LeadersGrid leaders={tournament.leaders} teams={teams} perCard={3} />
        ) : (
          <div className={s.tabEmpty}>
            <EmptyState title="Sem líderes estatísticos ainda." description="Os líderes aparecem após as primeiras partidas com estatísticas." />
          </div>
        )}
      </section>

      {/* 3. Lista de partidas, mais recente para mais antiga */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Partidas</h2>
          <span className={s.sectionHint}>Mais recentes primeiro</span>
        </div>
        {recentMatches.length > 0 ? (
          <MatchList matches={recentMatches} teams={teams} />
        ) : (
          <div className={s.tabEmpty}>
            <EmptyState title="Nenhuma partida cadastrada." />
          </div>
        )}
      </section>

      {/* 4. Regulamento */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Regulamento</h2>
        </div>
        <div className={s.regulation}>{tournament.regulation}</div>
      </section>
    </>
  )
}
