import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { useTeamSummaryQuery } from '../../features/sports/queries'
import {
  TEAM_PROFILE_STATUS_LABELS,
  formatAverage,
  formatMeasuredGames,
  formatRate,
  formatSignedAverage,
  formatTeamLocation,
  teamProfileStatusVariant,
} from '../../features/sports/sportsUtils'
import type { TeamStatistics, TeamTitle } from '../../features/sports/types'
import s from './teamDetail.module.css'

const TABS: TabItem[] = [{ id: 'overview', label: 'Visão geral' }]

const PRODUCTION_METRICS = [
  { field: 'reb', label: 'RPG' },
  { field: 'ast', label: 'APG' },
  { field: 'stl', label: 'STG' },
  { field: 'blk', label: 'BPG' },
  { field: 'tov', label: 'TOV' },
  { field: 'pf', label: 'PF' },
] as const

interface DisplayStat {
  label: string
  value: string
  measuredGames?: number
}

const INITIAL_TITLE_COUNT = 3

/** Every title already arrives in the summary payload; expanding never refetches. */
function TitleGallery({ titles }: { titles: TeamTitle[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (titles.length === 0) {
    return (
      <section className={s.gallery} aria-labelledby="team-titles-heading">
        <h2 id="team-titles-heading" className={s.galleryTitle}>Títulos</h2>
        <p className={s.galleryEmpty}>Nenhum título conquistado.</p>
      </section>
    )
  }

  const visible = isExpanded ? titles : titles.slice(0, INITIAL_TITLE_COUNT)

  return (
    <section className={s.gallery} aria-labelledby="team-titles-heading">
      <div className={s.galleryHead}>
        <h2 id="team-titles-heading" className={s.galleryTitle}>Títulos</h2>
        {titles.length > INITIAL_TITLE_COUNT && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((previous) => !previous)}
          >
            {isExpanded ? 'Mostrar menos' : 'Ver todos'}
          </Button>
        )}
      </div>
      <ul className={s.galleryList}>
        {visible.map(({ tournament }) => (
          <li key={tournament.id} className={s.titleCard}>
            <Trophy size={14} strokeWidth={1.8} className={s.titleIcon} aria-hidden="true" />
            <span className={s.titleName}>{tournament.name}</span>
            <span className={s.titleSeason}>{tournament.seasonLabel}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function StatStrip({ title, stats, testId }: { title: string; stats: DisplayStat[]; testId: string }) {
  return (
    <section className={s.section} data-testid={testId}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>{title}</h2>
      </div>
      {stats.length === 0 ? (
        <EmptyState title="Sem estatísticas registradas." />
      ) : (
        <div className={s.statsBlock}>
          <div className={s.statsRow}>
            {stats.map(({ label, value, measuredGames: count }) => (
              <div key={label} className={s.statItem}>
                <span className={s.statValue}>{value}</span>
                <span className={s.statLabel}>{label}</span>
                {count !== undefined && <span className={s.statMeta}>{formatMeasuredGames(count)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

/** Averages, rates and measured-game annotations only — the profile exposes no totals. */
function OverviewContent({ statistics }: { statistics: TeamStatistics }) {
  const { results, boxScore } = statistics

  const hasResults = results.winRate !== null
    || results.pointsForPerGame !== null
    || results.pointsAgainstPerGame !== null
    || results.pointDiffPerGame !== null

  const hasProduction = PRODUCTION_METRICS.some(({ field }) => boxScore.perGame[field] !== null)
    || boxScore.efficiency.perGame !== null
    || boxScore.shooting.fgPct !== null
    || boxScore.shooting.threeFgPct !== null
    || boxScore.shooting.ftPct !== null
    || boxScore.shooting.trueShootingPct !== null

  const resultStats: DisplayStat[] = hasResults
    ? [
        { label: '%V', value: formatRate(results.winRate), measuredGames: results.measuredGames },
        { label: 'PP/J', value: formatAverage(results.pointsForPerGame), measuredGames: results.scoreMeasuredGames },
        { label: 'PC/J', value: formatAverage(results.pointsAgainstPerGame), measuredGames: results.scoreMeasuredGames },
        { label: 'SALDO/J', value: formatSignedAverage(results.pointDiffPerGame), measuredGames: results.scoreMeasuredGames },
      ]
    : []

  const productionStats: DisplayStat[] = hasProduction
    ? [
        ...PRODUCTION_METRICS.map(({ field, label }) => ({
          label,
          value: formatAverage(boxScore.perGame[field]),
          measuredGames: boxScore.measuredGames[field],
        })),
        {
          label: 'EFF/J',
          value: formatSignedAverage(boxScore.efficiency.perGame),
          measuredGames: boxScore.efficiency.measuredGames,
        },
        { label: 'FG%', value: formatRate(boxScore.shooting.fgPct) },
        { label: '3FG%', value: formatRate(boxScore.shooting.threeFgPct) },
        { label: 'FT%', value: formatRate(boxScore.shooting.ftPct) },
        { label: 'TS%', value: formatRate(boxScore.shooting.trueShootingPct) },
      ]
    : []

  return (
    <>
      <StatStrip title="Resultados" stats={resultStats} testId="overview-results" />
      <StatStrip title="Produção da equipe" stats={productionStats} testId="overview-production" />
    </>
  )
}

export function TeamDetailPage() {
  const { teamId: rawTeamId } = useParams<{ teamId: string }>()
  const teamId = parsePositiveId(rawTeamId)
  const navigate = useNavigate()

  const summaryQuery = useTeamSummaryQuery(teamId ?? undefined)
  const [activeTab, setActiveTab] = useState('overview')

  const backButton = (
    <button type="button" className={s.backLink} onClick={() => navigate(-1)}>
      <ArrowLeft size={12} strokeWidth={1.7} /> Voltar
    </button>
  )

  if (teamId == null) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>{backButton}</div>
        <div className={s.bodyFill}>
          <ErrorState title="ID de equipe inválido." />
        </div>
      </div>
    )
  }

  if (summaryQuery.isPending) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          {backButton}
          <div className={s.skBlock}>
            <Skeleton width={320} height={28} />
            <Skeleton width={240} height={16} />
            <Skeleton width="100%" height={92} />
            <Skeleton width="100%" height={48} />
          </div>
        </div>
      </div>
    )
  }

  if (summaryQuery.isError) {
    const notFound = axios.isAxiosError(summaryQuery.error)
      && summaryQuery.error.response?.status === 404
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>{backButton}</div>
        <div className={s.bodyFill}>
          {notFound ? (
            <EmptyState title="Equipe não encontrada." />
          ) : (
            <ErrorState
              title="Não foi possível carregar a equipe."
              onRetry={() => void summaryQuery.refetch()}
            />
          )}
        </div>
      </div>
    )
  }

  const summary = summaryQuery.data
  if (!summary) return null

  const { team } = summary

  return (
    <div className={s.page}>
      <div className={s.detailHeader} data-testid="team-header">
        {backButton}

        <div className={s.heroRow}>
          <div className={s.crest}>{team.shortName}</div>
          <div className={s.heroMain}>
            <h1 className={s.title}>{team.name}</h1>
            <div className={s.meta}>
              <span>{formatTeamLocation(team.city, team.state)}</span>
            </div>
          </div>
          <Badge variant={teamProfileStatusVariant(team.status)}>
            {TEAM_PROFILE_STATUS_LABELS[team.status]}
          </Badge>
        </div>

        <TitleGallery titles={summary.titles} />

        <div className={s.tabsBar}>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} variant="line" />
        </div>
      </div>

      <div className={s.detailBody}>
        {activeTab === 'overview' && <OverviewContent statistics={summary.statistics} />}
      </div>
    </div>
  )
}
