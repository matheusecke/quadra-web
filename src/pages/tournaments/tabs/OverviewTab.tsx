import { Link } from 'react-router-dom'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { BracketBoard } from '../../../features/sports/components/BracketBoard'
import type { Tournament, TournamentFormat, Team } from '../../../features/sports/types'
import { hasGroupStage, hasKnockout } from '../../../features/sports/sportsUtils'
import {
  useStandingsQuery,
  useTournamentLeadersQuery,
  useTournamentMatchesPreviewQuery,
} from '../../../features/sports/queries'
import { useBracketView } from '../../../features/sports/useBracketView'
import { LeadersGrid } from '../parts/LeadersGrid'
import { StandingsTable } from '../parts/StandingsTable'
import { MatchList } from '../parts/MatchList'
import s from '../tournaments.module.css'

interface OverviewTabProps {
  tournament: Tournament
  teams: Map<number, Team>
}

/** Destination of the Grupos section link, by format. No destination tab, no link. */
function groupsLinkFor(format: TournamentFormat): { tab: string; label: string } | null {
  if (hasGroupStage(format)) return { tab: 'groups', label: 'Ver todos os grupos' }
  if (format === 'LEAGUE') return { tab: 'standings', label: 'Ver classificação completa' }
  return null
}

/**
 * Overview — the main reading surface. Fixed section order:
 * 1. Grupos → 2. Chaveamento → 3. Líderes → 4. Partidas → 5. Regulamento.
 */
export function OverviewTab({ tournament, teams }: OverviewTabProps) {
  const leadersQuery = useTournamentLeadersQuery(tournament.id)
  const leaders = leadersQuery.data
  const hasLeaders = leaders !== undefined
    && Object.values(leaders.perGame).some((rows) => rows.length > 0)
  const bracket = useBracketView(tournament.id)
  const isKnockout = hasKnockout(tournament.format)
  const groupsLink = groupsLinkFor(tournament.format)
  // One page of ten, in server order. The full list lives on the Partidas tab.
  const matchesQuery = useTournamentMatchesPreviewQuery(tournament.id)
  const matches = matchesQuery.data?.data ?? []
  // Ranked by the API, one envelope per group (one with group: null in LEAGUE).
  const { data: envelopes, isPending: isStandingsPending, isError: isStandingsError, refetch: refetchStandings } =
    useStandingsQuery(tournament.id)
  const tables = envelopes ?? []

  return (
    <>
      {/* 1. Grupos e classificação resumida */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Grupos</h2>
          <div className={s.sectionMeta}>
            <span className={s.sectionHint}>Ordenação FIBA por pontos de classificação</span>
            {groupsLink && (
              <Link to={`?tab=${groupsLink.tab}`} replace className={s.sectionLink}>
                {groupsLink.label}
              </Link>
            )}
          </div>
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
            <Link to="?tab=bracket" replace className={s.sectionLink}>Ver chaveamento completo</Link>
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
              <BracketBoard rounds={bracket.rounds} slots={bracket.slots} championTournamentTeamId={tournament.championTournamentTeamId} />
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
          <div className={s.sectionMeta}>
            <span className={s.sectionHint}>Médias por jogo, clique no atleta para o perfil</span>
            <Link to="?tab=stats" replace className={s.sectionLink}>Ver todas as estatísticas</Link>
          </div>
        </div>
        {leadersQuery.isPending ? (
          <div className={s.tabEmpty}><Skeleton width="100%" height={220} /></div>
        ) : leadersQuery.isError ? (
          <div className={s.tabEmpty}>
            <ErrorState title="Não foi possível carregar os líderes." onRetry={() => leadersQuery.refetch()} />
          </div>
        ) : hasLeaders ? (
          <LeadersGrid leaders={leaders} group="perGame" limit={3} />
        ) : (
          <div className={s.tabEmpty}>
            <EmptyState
              title="Sem líderes estatísticos ainda."
              description="Os líderes aparecem após as primeiras partidas com estatísticas."
            />
          </div>
        )}
      </section>

      {/* 4. Lista de partidas, na ordem entregue pela API */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Partidas</h2>
          <Link to="?tab=matches" replace className={s.sectionLink}>Ver todas as partidas</Link>
        </div>
        {matchesQuery.isPending ? (
          <div className={s.tabEmpty}>
            <Skeleton width="100%" height={160} />
          </div>
        ) : matchesQuery.isError ? (
          <div className={s.tabEmpty}>
            <ErrorState title="Não foi possível carregar as partidas." onRetry={() => void matchesQuery.refetch()} />
          </div>
        ) : matches.length > 0 ? (
          <MatchList matches={matches} />
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
