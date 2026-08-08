import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Trophy } from 'lucide-react'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import {
  useTeamMatchesInfiniteQuery,
  useTeamRosterInfiniteQuery,
  useTeamSummaryQuery,
  useTeamTournamentsInfiniteQuery,
} from '../../features/sports/queries'
import {
  ATHLETE_STATUS_LABELS,
  MATCH_STATUS_LABELS,
  TEAM_PROFILE_STATUS_LABELS,
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_TEAM_STATUS_LABELS,
  formatAverage,
  formatDateTime,
  formatMeasuredGames,
  formatRate,
  formatSignedAverage,
  formatTeamLocation,
  matchStatusVariant,
  teamProfileStatusVariant,
  tournamentStatusVariant,
} from '../../features/sports/sportsUtils'
import type {
  RosterCandidate,
  TeamMatchHistoryRow,
  TeamStatistics,
  TeamTitle,
  TeamTournamentHistoryRow,
} from '../../features/sports/types'
import type { PaginatedResponse } from '../../types/admin'
import s from './teamDetail.module.css'

const TABS: TabItem[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'matches', label: 'Partidas' },
  { id: 'tournaments', label: 'Campeonatos' },
  { id: 'roster', label: 'Elenco' },
]

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

interface HistoryFooterProps {
  loaded: number
  total: number
  noun: 'partida' | 'campeonato' | 'atleta' | 'integrante'
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  nextPageErrorTitle: string
  onLoadMore: () => void
}

function HistoryFooter({
  loaded, total, noun, hasNextPage, isFetchingNextPage,
  isFetchNextPageError, nextPageErrorTitle, onLoadMore,
}: HistoryFooterProps) {
  const plural = total === 1 ? noun : `${noun}s`
  return (
    <div className={s.historyFooter}>
      <span className={s.historyCount}>
        {loaded === total ? total : `${loaded} de ${total}`} {plural}
      </span>
      {isFetchNextPageError ? (
        <ErrorState title={nextPageErrorTitle} onRetry={onLoadMore} />
      ) : hasNextPage ? (
        <Button variant="secondary" size="sm" loading={isFetchingNextPage} onClick={onLoadMore}>
          Carregar mais
        </Button>
      ) : null}
    </div>
  )
}

/** A finished loss carries the special loss type; a live or scheduled match carries none. */
function specialLossLabel(row: TeamMatchHistoryRow): string | null {
  const lossType = row.team.lossType ?? row.opponent.lossType
  if (lossType === 'FORFEIT') return 'W.O.'
  if (lossType === 'DEFAULT') return 'Abandono'
  return null
}

function matchResultText(row: TeamMatchHistoryRow): string {
  const label = row.team.result === 'WIN' ? 'Vitória' : row.team.result === 'LOSS' ? 'Derrota' : null
  if (label === null) return '—'
  if (row.team.score === null || row.opponent.score === null) return label
  return `${label} ${row.team.score}–${row.opponent.score}`
}

interface MatchSectionProps {
  title: string
  testId: string
  query: UseInfiniteQueryResult<InfiniteData<PaginatedResponse<TeamMatchHistoryRow>>>
  emptyTitle: string
  errorTitle: string
}

function MatchSection({ title, testId, query, emptyTitle, errorTitle }: MatchSectionProps) {
  const navigate = useNavigate()
  const rows = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.meta.totalItems ?? 0

  return (
    <section className={s.section} data-testid={testId}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>{title}</h2>
      </div>

      {query.isPending ? (
        <Skeleton width="100%" height={180} />
      ) : query.isError && rows.length === 0 ? (
        <ErrorState title={errorTitle} onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  {['Data', 'Campeonato', 'Partida', 'Local', 'Status', 'Resultado'].map((label) => (
                    <th key={label} className={s.th}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const special = specialLossLabel(row)
                  const open = () => navigate(`/matches/${row.match.id}`)
                  return (
                    <tr
                      key={row.match.id}
                      className={s.tr}
                      tabIndex={0}
                      onClick={open}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          open()
                        }
                      }}
                    >
                      <td className={s.td}>
                        <Link
                          to={`/matches/${row.match.id}`}
                          className={s.rowLink}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {formatDateTime(row.match.scheduledAt)}
                        </Link>
                      </td>
                      <td className={s.td}>{row.tournament.name}</td>
                      <td className={s.tdStrong}>
                        {row.team.name} ×{' '}
                        <Link
                          to={`/teams/${row.opponent.teamId}`}
                          className={s.rowLink}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {row.opponent.name}
                        </Link>
                      </td>
                      <td className={s.td}>{row.match.venueName ?? '—'}</td>
                      <td className={s.td}>
                        <Badge variant={matchStatusVariant(row.match.status)}>
                          {MATCH_STATUS_LABELS[row.match.status]}
                        </Badge>
                      </td>
                      <td className={s.td}>
                        {matchResultText(row)}
                        {special && <Badge variant="ghost">{special}</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <HistoryFooter
            loaded={rows.length}
            total={total}
            noun="partida"
            hasNextPage={Boolean(query.hasNextPage)}
            isFetchingNextPage={query.isFetchingNextPage}
            isFetchNextPageError={query.isFetchNextPageError}
            nextPageErrorTitle="Não foi possível carregar mais partidas."
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
    </section>
  )
}

interface TournamentsContentProps {
  rows: TeamTournamentHistoryRow[]
  total: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  onLoadMore: () => void
}

function TournamentsContent({
  rows, total, hasNextPage, isFetchingNextPage, isFetchNextPageError, onLoadMore,
}: TournamentsContentProps) {
  const navigate = useNavigate()

  if (rows.length === 0) {
    return (
      <div className={s.tabEmpty}>
        <EmptyState
          title="Nenhuma participação em campeonatos."
          description="As participações aparecerão quando a equipe for inscrita em um campeonato."
        />
      </div>
    )
  }

  return (
    <>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead className={s.thead}>
            <tr>
              {['Campeonato', 'Temporada', 'Status', 'Participação'].map((label) => (
                <th key={label} className={s.th}>{label}</th>
              ))}
              {['%V', 'PP/J', 'PC/J', 'Saldo/J', 'RPG', 'APG', 'FG%', '3FG%', 'FT%'].map((label) => (
                <th key={label} className={s.thNum}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { results, boxScore } = row.statistics
              const open = () => navigate(`/tournaments/${row.tournament.id}`)
              return (
                <tr
                  key={`${row.tournament.id}-${row.team.tournamentTeamId}`}
                  className={s.tr}
                  tabIndex={0}
                  onClick={open}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      open()
                    }
                  }}
                >
                  <td className={s.tdStrong}>
                    <Link
                      to={`/tournaments/${row.tournament.id}`}
                      className={s.rowLink}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {row.tournament.name}
                    </Link>
                    {row.team.isChampion && <Badge variant="success">Campeão</Badge>}
                  </td>
                  <td className={s.td}>{row.tournament.seasonLabel}</td>
                  <td className={s.td}>
                    <Badge variant={tournamentStatusVariant(row.tournament.status)}>
                      {TOURNAMENT_STATUS_LABELS[row.tournament.status]}
                    </Badge>
                  </td>
                  <td className={s.td}>{TOURNAMENT_TEAM_STATUS_LABELS[row.team.status]}</td>
                  <td className={s.tdNum}>{formatRate(results.winRate)}</td>
                  <td className={s.tdNum}>{formatAverage(results.pointsForPerGame)}</td>
                  <td className={s.tdNum}>{formatAverage(results.pointsAgainstPerGame)}</td>
                  <td className={s.tdNum}>{formatSignedAverage(results.pointDiffPerGame)}</td>
                  <td className={s.tdNum}>{formatAverage(boxScore.perGame.reb)}</td>
                  <td className={s.tdNum}>{formatAverage(boxScore.perGame.ast)}</td>
                  <td className={s.tdNum}>{formatRate(boxScore.shooting.fgPct)}</td>
                  <td className={s.tdNum}>{formatRate(boxScore.shooting.threeFgPct)}</td>
                  <td className={s.tdNum}>{formatRate(boxScore.shooting.ftPct)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <HistoryFooter
        loaded={rows.length}
        total={total}
        noun="campeonato"
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isFetchNextPageError={isFetchNextPageError}
        nextPageErrorTitle="Não foi possível carregar mais campeonatos."
        onLoadMore={onLoadMore}
      />
    </>
  )
}

interface RosterSectionProps {
  title: string
  testId: string
  query: UseInfiniteQueryResult<InfiniteData<PaginatedResponse<RosterCandidate>>>
  emptyTitle: string
  errorTitle: string
  noun: 'atleta' | 'integrante'
  isAthleteTable: boolean
}

function RosterSection({
  title, testId, query, emptyTitle, errorTitle, noun, isAthleteTable,
}: RosterSectionProps) {
  const rows = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.meta.totalItems ?? 0

  return (
    <section className={s.section} data-testid={testId}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>{title}</h2>
      </div>

      {query.isPending ? (
        <Skeleton width="100%" height={160} />
      ) : query.isError && rows.length === 0 ? (
        <ErrorState title={errorTitle} onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  {(isAthleteTable ? ['Nome', 'Nº', 'Posição', 'Status'] : ['Nome', 'Função']).map((label) => (
                    <th key={label} className={s.th}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((candidate) => (
                  <tr key={candidate.id} className={s.tr} style={{ cursor: 'default' }}>
                    <td className={s.tdStrong}>
                      {isAthleteTable ? (
                        <Link to={`/athletes/${candidate.id}`} className={s.rowLink}>
                          {candidate.name}
                        </Link>
                      ) : (
                        candidate.name
                      )}
                    </td>
                    {isAthleteTable ? (
                      <>
                        <td className={s.td}>{candidate.jerseyNumber ?? '—'}</td>
                        <td className={s.td}>{candidate.position ?? '—'}</td>
                        <td className={s.td}>{ATHLETE_STATUS_LABELS[candidate.status]}</td>
                      </>
                    ) : (
                      <td className={s.td}>Comissão técnica</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <HistoryFooter
            loaded={rows.length}
            total={total}
            noun={noun}
            hasNextPage={Boolean(query.hasNextPage)}
            isFetchingNextPage={query.isFetchingNextPage}
            isFetchNextPageError={query.isFetchNextPageError}
            nextPageErrorTitle={`Não foi possível carregar mais ${noun}s.`}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
    </section>
  )
}

export function TeamDetailPage() {
  const { teamId: rawTeamId } = useParams<{ teamId: string }>()
  const teamId = parsePositiveId(rawTeamId)
  const navigate = useNavigate()

  const summaryQuery = useTeamSummaryQuery(teamId ?? undefined)
  const [activeTab, setActiveTab] = useState('overview')

  const upcomingQuery = useTeamMatchesInfiniteQuery(
    teamId ?? undefined,
    'upcoming',
    activeTab === 'matches',
  )
  const historyQuery = useTeamMatchesInfiniteQuery(
    teamId ?? undefined,
    'history',
    activeTab === 'matches',
  )
  const tournamentsQuery = useTeamTournamentsInfiniteQuery(
    teamId ?? undefined,
    activeTab === 'tournaments',
  )
  const athletesQuery = useTeamRosterInfiniteQuery(
    teamId ?? undefined,
    'ATHLETE',
    activeTab === 'roster',
  )
  const staffQuery = useTeamRosterInfiniteQuery(
    teamId ?? undefined,
    'COACHING_STAFF',
    activeTab === 'roster',
  )

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
  const tournamentRows = tournamentsQuery.data?.pages.flatMap((page) => page.data) ?? []
  const tournamentTotal = tournamentsQuery.data?.pages[0]?.meta.totalItems ?? 0

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
        {activeTab === 'matches' && (
          <>
            <MatchSection
              title="Próximas partidas"
              testId="matches-upcoming"
              query={upcomingQuery}
              emptyTitle="Nenhuma partida agendada."
              errorTitle="Não foi possível carregar as próximas partidas."
            />
            <MatchSection
              title="Histórico"
              testId="matches-history"
              query={historyQuery}
              emptyTitle="Nenhuma partida no histórico."
              errorTitle="Não foi possível carregar o histórico de partidas."
            />
          </>
        )}
        {activeTab === 'tournaments' && (
          tournamentsQuery.isPending ? (
            <div className={s.tabEmpty}><Skeleton width="100%" height={220} /></div>
          ) : tournamentsQuery.isError && tournamentRows.length === 0 ? (
            <div className={s.tabEmpty}>
              <ErrorState
                title="Não foi possível carregar os campeonatos."
                onRetry={() => void tournamentsQuery.refetch()}
              />
            </div>
          ) : (
            <TournamentsContent
              rows={tournamentRows}
              total={tournamentTotal}
              hasNextPage={Boolean(tournamentsQuery.hasNextPage)}
              isFetchingNextPage={tournamentsQuery.isFetchingNextPage}
              isFetchNextPageError={tournamentsQuery.isFetchNextPageError}
              onLoadMore={() => void tournamentsQuery.fetchNextPage()}
            />
          )
        )}
        {activeTab === 'roster' && (
          <>
            <RosterSection
              title="Atletas"
              testId="roster-athletes"
              query={athletesQuery}
              emptyTitle="Nenhum atleta ativo no elenco."
              errorTitle="Não foi possível carregar os atletas."
              noun="atleta"
              isAthleteTable
            />
            <RosterSection
              title="Comissão técnica"
              testId="roster-staff"
              query={staffQuery}
              emptyTitle="Nenhum integrante na comissão técnica."
              errorTitle="Não foi possível carregar a comissão técnica."
              noun="integrante"
              isAthleteTable={false}
            />
          </>
        )}
      </div>
    </div>
  )
}
