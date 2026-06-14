import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { getTeams } from '../../features/sports/mockSportsData'
import { useChampionship, useChampionshipMatches } from '../../features/sports/useSportsData'
import {
  CHAMPIONSHIP_STATUS_LABELS,
  championshipStatusVariant,
  formatPeriod,
  formatRelative,
  matchProgress,
  PHASE_LABELS,
  STATS_STATUS_LABELS,
  teamMap,
} from '../../features/sports/sportsUtils'
import { OverviewTab } from './tabs/OverviewTab'
import { TeamsTab } from './tabs/TeamsTab'
import { MatchesTab } from './tabs/MatchesTab'
import { StandingsTab } from './tabs/StandingsTab'
import { StatsTab } from './tabs/StatsTab'
import s from './championships.module.css'

const TABS: TabItem[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'teams', label: 'Equipes' },
  { id: 'matches', label: 'Partidas' },
  { id: 'standings', label: 'Classificação' },
  { id: 'stats', label: 'Estatísticas' },
]

export function ChampionshipDetailPage() {
  const { championshipId } = useParams<{ championshipId: string }>()
  const { data: championship, isLoading, isError, refetch } = useChampionship(championshipId)
  const { data: matches } = useChampionshipMatches(championshipId)
  const [activeTab, setActiveTab] = useState('overview')
  const teams = teamMap(getTeams())

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <Link to="/championships" className={s.backLink}>
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
          <Link to="/championships" className={s.backLink}>
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
  if (!championship) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <Link to="/championships" className={s.backLink}>
            <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
          </Link>
        </div>
        <div className={s.bodyFill}>
          <EmptyState
            title="Campeonato não encontrado."
            description="Ele pode ter sido removido ou o endereço está incorreto."
            action={<Link to="/championships" className={s.athleteLink}>Ver todos os campeonatos</Link>}
          />
        </div>
      </div>
    )
  }

  const allMatches = matches ?? []

  return (
    <div className={s.page}>
      <div className={s.detailHeader}>
        <Link to="/championships" className={s.backLink}>
          <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para campeonatos
        </Link>

        <div className={s.detailTitleRow}>
          <div>
            <h1 className={s.detailTitle}>{championship.name}</h1>
            <div className={s.detailMeta}>
              <span className={s.mono}>{championship.season}</span>
              <span className={s.detailMetaSep}>·</span>
              <span>{championship.category}</span>
              <span className={s.detailMetaSep}>·</span>
              <span>{PHASE_LABELS[championship.currentPhase]}</span>
            </div>
          </div>
          <div className={s.detailStatusCol}>
            <Badge variant={championshipStatusVariant(championship.status)}>
              {CHAMPIONSHIP_STATUS_LABELS[championship.status]}
            </Badge>
          </div>
        </div>

        {/* Compact info strip — not dashboard cards */}
        <div className={s.infoStrip}>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Período</span>
            <span className={s.infoValue}>{formatPeriod(championship)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Equipes</span>
            <span className={s.infoValue}>{championship.teamIds.length}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Partidas</span>
            <span className={s.infoValue}>{matchProgress(championship)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Estatísticas</span>
            <span className={s.infoValue}>{STATS_STATUS_LABELS[championship.statsStatus]}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Fase atual</span>
            <span className={s.infoValue}>{PHASE_LABELS[championship.currentPhase]}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Atualizado</span>
            <span className={s.infoValue}>{formatRelative(championship.updatedAt)}</span>
          </div>
        </div>

        <div className={s.tabsBar}>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} variant="line" />
        </div>
      </div>

      <div className={s.detailBody}>
        {activeTab === 'overview' && (
          <OverviewTab championship={championship} matches={allMatches} teams={teams} />
        )}
        {activeTab === 'teams' && <TeamsTab championship={championship} teams={teams} />}
        {activeTab === 'matches' && (
          <MatchesTab championship={championship} matches={allMatches} teams={teams} />
        )}
        {activeTab === 'standings' && <StandingsTab championship={championship} teams={teams} />}
        {activeTab === 'stats' && <StatsTab championship={championship} teams={teams} />}
      </div>
    </div>
  )
}
