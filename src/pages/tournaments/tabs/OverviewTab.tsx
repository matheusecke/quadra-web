import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { BracketBoard } from '../../../features/sports/components/BracketBoard'
import type { Tournament, Match, Team } from '../../../features/sports/types'
import { hasKnockout, sortMatchesByDateDesc } from '../../../features/sports/sportsUtils'
import { useStandingsQuery, useTournamentLeadersQuery } from '../../../features/sports/queries'
import { useBracketView } from '../../../features/sports/useBracketView'
import { LeadersGrid } from '../parts/LeadersGrid'
import { StandingsTable } from '../parts/StandingsTable'
import { MatchList } from '../parts/MatchList'
import s from '../tournaments.module.css'

interface OverviewTabProps {
  tournament: Tournament
  matches: Match[]
  teams: Map<number, Team>
  tournamentTeams: Map<number, { name: string; shortName: string }>
  onSeeBracket: () => void
}

/**
 * Overview — the main reading surface. Fixed section order:
 * 1. Grupos → 2. Chaveamento → 3. Líderes → 4. Partidas recentes → 5. Regulamento.
 */
export function OverviewTab({ tournament, matches, teams, tournamentTeams, onSeeBracket }: OverviewTabProps) {
  const recentMatches = sortMatchesByDateDesc(matches)
  const { data: leaders } = useTournamentLeadersQuery(tournament.id)
  const hasLeaders = (leaders?.ppg.length ?? 0) > 0
  const bracket = useBracketView(tournament.id)
  const isKnockout = hasKnockout(tournament.format)
  // Ranked by the data layer, one envelope per group (one with group: null in LEAGUE).
  const { data: envelopes, isPending: isStandingsPending, isError: isStandingsError, refetch: refetchStandings } =
    useStandingsQuery(tournament.id, tournament.format)
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

      {/* 2. Chaveamento, somente leitura — a continuação dos grupos */}
      {isKnockout && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>Chaveamento</h2>
            <button type="button" className={s.sectionLink} onClick={onSeeBracket}>Ver chaveamento completo</button>
          </div>
          {bracket.isPending && (
            <div className={s.tabEmpty}>
              <Skeleton width="100%" height={240} />
            </div>
          )}
          {bracket.isError && (
            <div className={s.tabEmpty}>
              <ErrorState title="Não foi possível carregar o chaveamento." onRetry={bracket.refetch} />
            </div>
          )}
          {!bracket.isPending && !bracket.isError && (
            bracket.slots.length > 0 ? (
              <BracketBoard rounds={bracket.rounds} slots={bracket.slots} teams={bracket.teams} championTournamentTeamId={tournament.championTournamentTeamId} />
            ) : (
              <div className={s.tabEmpty}>
                <EmptyState title="Chaveamento ainda não montado." />
              </div>
            )
          )}
        </section>
      )}

      {/* 3. Líderes estatísticos principais */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Líderes</h2>
          <span className={s.sectionHint}>Médias por jogo, clique no atleta para o perfil</span>
        </div>
        {hasLeaders ? (
          <LeadersGrid leaders={leaders!} teams={teams} perCard={3} />
        ) : (
          <div className={s.tabEmpty}>
            <EmptyState title="Sem líderes estatísticos ainda." description="Os líderes aparecem após as primeiras partidas com estatísticas." />
          </div>
        )}
      </section>

      {/* 4. Lista de partidas, mais recente para mais antiga */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Partidas</h2>
          <span className={s.sectionHint}>Mais recentes primeiro</span>
        </div>
        {recentMatches.length > 0 ? (
          <MatchList matches={recentMatches} tournamentTeams={tournamentTeams} />
        ) : (
          <div className={s.tabEmpty}>
            <EmptyState title="Nenhuma partida cadastrada." />
          </div>
        )}
      </section>

      {/* 5. Regulamento */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Regulamento</h2>
        </div>
        <div className={s.regulation}>{tournament.regulation ?? 'Regulamento não informado.'}</div>
      </section>
    </>
  )
}
