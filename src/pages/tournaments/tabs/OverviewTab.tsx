import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import type { Tournament, Match, Team } from '../../../features/sports/types'
import { sortMatchesByDateDesc } from '../../../features/sports/sportsUtils'
import { LeadersGrid } from '../parts/LeadersGrid'
import { StandingsTable } from '../parts/StandingsTable'
import { BracketView } from '../parts/BracketView'
import { MatchList } from '../parts/MatchList'
import s from '../tournaments.module.css'

interface OverviewTabProps {
  tournament: Tournament
  matches: Match[]
  teams: Map<string, Team>
}

/**
 * Overview — the main reading surface. Fixed section order:
 * 1. Grupos → 2. Chaveamento → 3. Líderes → 4. Partidas recentes → 5. Regulamento.
 */
export function OverviewTab({ tournament, matches, teams }: OverviewTabProps) {
  const recentMatches = sortMatchesByDateDesc(matches)
  const hasLeaders = tournament.leaders.ppg.length > 0
  const hasGroups = tournament.groups.length > 0
  const hasBracket = tournament.bracket.length > 0

  return (
    <>
      {/* 1. Grupos e classificação resumida */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Grupos</h2>
          <span className={s.sectionHint}>Top 2 avançam aos playoffs</span>
        </div>
        {hasGroups ? (
          <div className={s.groupsGrid}>
            {tournament.groups.map((g) => (
              <div key={g.id} className={s.standCard}>
                <div className={s.standCardHead}>{g.name}</div>
                <StandingsTable rows={g.standings} teams={teams} variant="compact" qualified={2} />
              </div>
            ))}
          </div>
        ) : (
          <div className={s.tabEmpty}>
            <EmptyState title="Grupos ainda não definidos." />
          </div>
        )}
      </section>

      {/* 2. Chaveamento de playoffs */}
      {hasBracket && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>Chaveamento</h2>
            <span className={s.sectionHint}>Clique em um confronto para abrir a partida</span>
          </div>
          <BracketView
            rounds={tournament.bracket}
            teams={teams}
            championTeamId={tournament.championTeamId}
          />
        </section>
      )}

      {/* 3. Líderes estatísticos principais */}
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

      {/* 4. Lista de partidas, mais recente para mais antiga */}
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

      {/* 5. Regulamento */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Regulamento</h2>
        </div>
        <div className={s.regulation}>{tournament.regulation}</div>
      </section>
    </>
  )
}
