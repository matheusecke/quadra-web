import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { getCategoryName, getSeasonLabel, getTeams } from '../../features/sports/mock-sports-data'
import { useMatchesQuery, useTournamentQuery } from '../../features/sports/queries'
import {
  TOURNAMENT_STATUS_LABELS,
  tournamentStatusVariant,
  formatPeriod,
  matchProgress,
  PHASE_LABELS,
  teamMap,
} from '../../features/sports/sportsUtils'
import { OverviewTab } from './tabs/OverviewTab'
import { TeamsTab } from './tabs/TeamsTab'
import { MatchesTab } from './tabs/MatchesTab'
import { StandingsTab } from './tabs/StandingsTab'
import { StatsTab } from './tabs/StatsTab'
import s from './tournaments.module.css'

const TABS: TabItem[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'teams', label: 'Equipes' },
  { id: 'matches', label: 'Partidas' },
  { id: 'standings', label: 'Classificação' },
  { id: 'stats', label: 'Estatísticas' },
]

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const { data: tournament, isPending: isLoading, isError, refetch } = useTournamentQuery(tournamentId)
  const { data: matches } = useMatchesQuery({ tournamentId })
  const [activeTab, setActiveTab] = useState('overview')
  const teams = teamMap(getTeams())

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <Link to="/tournaments" className={s.backLink}>
            <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
          </Link>
          <div className={s.detailTitleRow}>
            <div>
              <Skeleton width={280} height={28} />
              <div style={{ marginTop: 8 }}>
                <Skeleton width={220} height={14} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Skeleton width="100%" height={52} />
          </div>
        </div>
        <div className={s.detailBody}>
          <div className={s.skBlock}>
            <Skeleton width="100%" height={80} />
            <Skeleton width="100%" height={200} />
          </div>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (isError) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <Link to="/tournaments" className={s.backLink}>
            <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
          </Link>
        </div>
        <div className={s.bodyFill}>
          <ErrorState title="Não foi possível carregar o campeonato." onRetry={refetch} />
        </div>
      </div>
    )
  }

  // ── Not found ──
  if (!tournament) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <Link to="/tournaments" className={s.backLink}>
            <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
          </Link>
        </div>
        <div className={s.bodyFill}>
          <EmptyState
            title="Campeonato não encontrado."
            description="Ele pode ter sido removido ou o endereço está incorreto."
            action={<Link to="/tournaments" className={s.athleteLink}>Ver todos os campeonatos</Link>}
          />
        </div>
      </div>
    )
  }

  const allMatches = matches ?? []

  return (
    <div className={s.page}>
      <div className={s.detailHeader}>
        <Link to="/tournaments" className={s.backLink}>
          <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
        </Link>

        <div className={s.detailTitleRow}>
          <div>
            <h1 className={s.detailTitle}>{tournament.name}</h1>
            <div className={s.detailMeta}>
              <span className={s.mono}>{getSeasonLabel(tournament.seasonId)}</span>
              <span className={s.detailMetaSep}>·</span>
              <span>{getCategoryName(tournament.categoryId)}</span>
              <span className={s.detailMetaSep}>·</span>
              <span>{PHASE_LABELS[tournament.currentPhase]}</span>
            </div>
          </div>
          <div className={s.detailStatusCol}>
            <Badge variant={tournamentStatusVariant(tournament.status)}>
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
            </Badge>
          </div>
        </div>

        {/* Compact info strip — not dashboard cards */}
        <div className={s.infoStrip}>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Período</span>
            <span className={s.infoValue}>{formatPeriod(tournament)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Equipes</span>
            <span className={s.infoValue}>{tournament.teamIds.length}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Partidas</span>
            <span className={s.infoValue}>{matchProgress(tournament)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Fase atual</span>
            <span className={s.infoValue}>{PHASE_LABELS[tournament.currentPhase]}</span>
          </div>
        </div>

        <div className={s.tabsBar}>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} variant="line" />
        </div>
      </div>

      <div className={s.detailBody}>
        {activeTab === 'overview' && (
          <OverviewTab tournament={tournament} matches={allMatches} teams={teams} />
        )}
        {activeTab === 'teams' && <TeamsTab tournament={tournament} teams={teams} />}
        {activeTab === 'matches' && (
          <MatchesTab tournament={tournament} matches={allMatches} teams={teams} />
        )}
        {activeTab === 'standings' && <StandingsTab tournament={tournament} teams={teams} />}
        {activeTab === 'stats' && <StatsTab tournament={tournament} teams={teams} />}
      </div>
    </div>
  )
}
