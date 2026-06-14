import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import type { Championship, Match, Team } from '../../../features/sports/types'
import { sortMatchesByDateDesc } from '../../../features/sports/sportsUtils'
import { LeadersGrid } from '../parts/LeadersGrid'
import { StandingsTable } from '../parts/StandingsTable'
import { BracketView } from '../parts/BracketView'
import { MatchList } from '../parts/MatchList'
import s from '../championships.module.css'

interface OverviewTabProps {
  championship: Championship
  matches: Match[]
  teams: Map<string, Team>
}

/**
 * Overview — the main reading surface. Fixed section order:
 * 1. Grupos → 2. Chaveamento → 3. Líderes → 4. Partidas recentes → 5. Regulamento.
 */
export function OverviewTab({ championship, matches, teams }: OverviewTabProps) {
  const recentMatches = sortMatchesByDateDesc(matches)
  const hasLeaders = championship.leaders.ppg.length > 0
  const hasGroups = championship.groups.length > 0
  const hasBracket = championship.bracket.length > 0

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
            {championship.groups.map((g) => (
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
            rounds={championship.bracket}
            teams={teams}
            championTeamId={championship.championTeamId}
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
          <LeadersGrid leaders={championship.leaders} teams={teams} perCard={3} />
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
        <div className={s.regulation}>{championship.regulation}</div>
      </section>
    </>
  )
}
