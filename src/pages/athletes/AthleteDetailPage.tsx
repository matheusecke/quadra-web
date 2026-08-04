import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { toDisplay } from '../../components/ui/DateTimeField/dateDisplay'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import {
  useAthleteMatchesQuery,
  useAthleteQuery,
  useAthleteStatisticsQuery,
  useAthleteTournamentStatsQuery,
  useSeasonsQuery,
  useTeamsQuery,
} from '../../features/sports/queries'
import type {
  AthleteStatistics,
  AthleteTournamentStatsRow,
  AthleteMatchStatsRow,
  PlayerMatchStats,
} from '../../features/sports/types'
import {
  ATHLETE_STATUS_LABELS,
  calcEff,
  calcEffFromTotals,
  formatMeasuredGames,
  formatMinutesSeconds,
  formatServerDecimal,
  formatServerEfficiency,
  formatServerPercentage,
  formatShootingLine,
  formatStatPct,
  formatTsPct,
  perGame,
  teamMap,
} from '../../features/sports/sportsUtils'
import s from './athletes.module.css'

const TABS: TabItem[] = [
  { id: 'summary', label: 'Resumo' },
  { id: 'matches', label: 'Partidas' },
  { id: 'tournaments', label: 'Campeonatos' },
]

function formatAvg(value: number | null): string {
  return value === null ? 'N/A' : value.toFixed(1)
}

function formatEff(value: number | null): string {
  if (value === null) return 'N/A'
  return value > 0 ? `+${value}` : `${value}`
}

function formatEffAvg(value: number | null): string {
  if (value === null) return 'N/A'
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
}

interface DisplayStat {
  label: string
  value: string | number
  measuredGames?: number
  sm?: boolean
}

function StatStrip({ title, stats }: { title: string; stats: DisplayStat[] }) {
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>{title}</h2>
      </div>
      <div className={s.statsBlock}>
        <div className={s.statsRow}>
          {stats.map(({ label, value, measuredGames: count, sm }) => (
            <div key={label} className={s.statItem}>
              <span className={sm ? s.statValueSm : s.statValue}>{value}</span>
              <span className={s.statLabel}>{label}</span>
              {count !== undefined && <span className={s.statMeta}>{formatMeasuredGames(count)}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SummaryContent({ statistics }: { statistics: AthleteStatistics }) {
  if (statistics.gamesPlayed === 0) {
    return (
      <div className={s.tabEmpty}>
        <EmptyState
          title="Sem estatísticas registradas."
          description="O resumo aparecerá após a primeira partida finalizada com box score."
        />
      </div>
    )
  }

  const { totals, perGame: perGameStats, measuredGames, shooting, efficiency } = statistics

  return (
    <>
      <StatStrip
        title="Totais"
        stats={[
          { label: 'J', value: statistics.gamesPlayed },
          { label: 'MIN', value: formatMinutesSeconds(totals.minutesSeconds) },
          { label: 'PTS', value: formatServerDecimal(totals.pts) },
          { label: 'REB', value: formatServerDecimal(totals.reb) },
          { label: 'AST', value: formatServerDecimal(totals.ast) },
          { label: 'STL', value: formatServerDecimal(totals.stl) },
          { label: 'BLK', value: formatServerDecimal(totals.blk) },
          { label: 'TOV', value: formatServerDecimal(totals.tov) },
          { label: 'PF', value: formatServerDecimal(totals.pf) },
        ]}
      />
      <StatStrip
        title="Médias"
        stats={[
          { label: 'MPG', value: formatMinutesSeconds(perGameStats.minutesSeconds), measuredGames: measuredGames.minutesSeconds },
          { label: 'PPG', value: formatServerDecimal(perGameStats.pts), measuredGames: measuredGames.pts },
          { label: 'RPG', value: formatServerDecimal(perGameStats.reb), measuredGames: measuredGames.reb },
          { label: 'APG', value: formatServerDecimal(perGameStats.ast), measuredGames: measuredGames.ast },
          { label: 'STG', value: formatServerDecimal(perGameStats.stl), measuredGames: measuredGames.stl },
          { label: 'BPG', value: formatServerDecimal(perGameStats.blk), measuredGames: measuredGames.blk },
          { label: 'TOV', value: formatServerDecimal(perGameStats.tov), measuredGames: measuredGames.tov },
          { label: 'PF', value: formatServerDecimal(perGameStats.pf), measuredGames: measuredGames.pf },
        ]}
      />
      <StatStrip
        title="Aproveitamento e eficiência"
        stats={[
          { label: 'FG', value: formatShootingLine(totals.fgm, totals.fga), sm: true },
          { label: 'FG%', value: formatServerPercentage(shooting.fgPct), sm: true },
          { label: '3FG', value: formatShootingLine(totals.threeFgm, totals.threeFga), sm: true },
          { label: '3FG%', value: formatServerPercentage(shooting.threeFgPct), sm: true },
          { label: 'FT', value: formatShootingLine(totals.ftm, totals.fta), sm: true },
          { label: 'FT%', value: formatServerPercentage(shooting.ftPct), sm: true },
          { label: 'TS%', value: formatServerPercentage(shooting.trueShootingPct), sm: true },
          {
            label: 'EFF',
            value: formatServerEfficiency(efficiency.total),
            measuredGames: efficiency.measuredGames,
            sm: true,
          },
          {
            label: 'EFF/J',
            value: formatServerEfficiency(efficiency.perGame),
            measuredGames: efficiency.measuredGames,
            sm: true,
          },
        ]}
      />
    </>
  )
}

function shootingLine(stats: PlayerMatchStats, type: 'fg' | 'tp' | 'ft'): string {
  const [made, attempted] = type === 'fg'
    ? [stats.fgm, stats.fga]
    : type === 'tp'
      ? [stats.threeFgm, stats.threeFga]
      : [stats.ftm, stats.fta]
  return made === null || attempted === null ? 'N/A' : `${made}/${attempted}`
}

function MatchesContent({ rows }: { rows: AthleteMatchStatsRow[] }) {
  const navigate = useNavigate()

  if (rows.length === 0) {
    return (
      <div className={s.tabEmpty}>
        <EmptyState
          title="Sem partidas com estatísticas."
          description="O histórico aparecerá quando o atleta tiver box score registrado."
        />
      </div>
    )
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead className={s.thead}>
          <tr>
            <th className={s.th}>Data</th>
            <th className={s.th}>Campeonato</th>
            <th className={s.th}>Partida</th>
            <th className={s.th}>Resultado</th>
            <th className={s.thNum}>MIN</th>
            <th className={s.thNum}>PTS</th>
            <th className={s.thNum}>REB</th>
            <th className={s.thNum}>AST</th>
            <th className={s.thNum}>STL</th>
            <th className={s.thNum}>BLK</th>
            <th className={s.thNum}>TOV</th>
            <th className={s.thNum}>PF</th>
            <th className={s.thNum}>FG</th>
            <th className={s.thNum}>3FG</th>
            <th className={s.thNum}>FT</th>
            <th className={s.thNum}>TS%</th>
            <th className={s.thNum}>EFF/EFI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const efi = calcEff(row.stats)
            return (
              <tr
                key={row.match.id}
                className={s.tr}
                tabIndex={0}
                onClick={() => navigate(`/matches/${row.match.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') navigate(`/matches/${row.match.id}`)
                }}
              >
                <td className={s.td}>{toDisplay(row.match.scheduledAt, 'date')}</td>
                <td className={s.td}>{row.tournament.name}</td>
                <td className={s.tdStrong}>
                  <Link
                    to={`/matches/${row.match.id}`}
                    className={s.rowLink}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.matchup}
                  </Link>
                </td>
                <td className={s.td}>{row.result}</td>
                <td className={s.tdNum}>{formatMinutesSeconds(row.stats.minutesSeconds)}</td>
                <td className={s.tdNum}>{row.stats.pts ?? 'N/A'}</td>
                <td className={s.tdNum}>{row.stats.reb ?? 'N/A'}</td>
                <td className={s.tdNum}>{row.stats.ast ?? 'N/A'}</td>
                <td className={s.tdNum}>{row.stats.stl ?? 'N/A'}</td>
                <td className={s.tdNum}>{row.stats.blk ?? 'N/A'}</td>
                <td className={s.tdNum}>{row.stats.tov ?? 'N/A'}</td>
                <td className={s.tdNum}>{row.stats.pf ?? 'N/A'}</td>
                <td className={s.tdNum}>{shootingLine(row.stats, 'fg')}</td>
                <td className={s.tdNum}>{shootingLine(row.stats, 'tp')}</td>
                <td className={s.tdNum}>{shootingLine(row.stats, 'ft')}</td>
                <td className={s.tdNum}>{formatTsPct(row.stats.pts, row.stats.fga, row.stats.fta)}</td>
                <td className={s.tdNum}>{formatEff(efi)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TournamentsContent({
  rows,
  seasonLabels,
}: {
  rows: AthleteTournamentStatsRow[]
  seasonLabels: Map<number, string>
}) {
  const navigate = useNavigate()

  if (rows.length === 0) {
    return (
      <div className={s.tabEmpty}>
        <EmptyState
          title="Sem campeonatos com estatísticas."
          description="As médias por campeonato aparecerão quando houver histórico registrado."
        />
      </div>
    )
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead className={s.thead}>
          <tr>
            <th className={s.th}>Campeonato</th>
            <th className={s.th}>Equipe</th>
            <th className={s.th}>Temporada</th>
            <th className={s.thNum}>Jogos</th>
            <th className={s.thNum}>MPG</th>
            <th className={s.thNum}>PPG</th>
            <th className={s.thNum}>RPG</th>
            <th className={s.thNum}>APG</th>
            <th className={s.thNum}>STG</th>
            <th className={s.thNum}>BPG</th>
            <th className={s.thNum}>FG%</th>
            <th className={s.thNum}>3FG%</th>
            <th className={s.thNum}>FT%</th>
            <th className={s.thNum}>TS%</th>
            <th className={s.thNum}>EFF/EFI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const games = row.totals.games
            const efi = perGame(calcEffFromTotals(row.totals), games)
            return (
              <tr
                key={`${row.tournament.id}-${row.tournamentTeamId}`}
                className={s.tr}
                tabIndex={0}
                onClick={() => navigate(`/tournaments/${row.tournament.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') navigate(`/tournaments/${row.tournament.id}`)
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
                </td>
                <td className={s.td}>{row.teamName}</td>
                <td className={s.td}>{seasonLabels.get(row.tournament.seasonId) ?? String(row.tournament.seasonId)}</td>
                <td className={s.tdNum}>{games}</td>
                <td className={s.tdNum}>{formatMinutesSeconds(perGame(row.totals.minutesSeconds, row.totals.measuredGames.minutesSeconds))}</td>
                <td className={s.tdNum}>{formatAvg(perGame(row.totals.pts, row.totals.measuredGames.pts))}</td>
                <td className={s.tdNum}>{formatAvg(perGame(row.totals.reb, row.totals.measuredGames.reb))}</td>
                <td className={s.tdNum}>{formatAvg(perGame(row.totals.ast, row.totals.measuredGames.ast))}</td>
                <td className={s.tdNum}>{formatAvg(perGame(row.totals.stl, row.totals.measuredGames.stl))}</td>
                <td className={s.tdNum}>{formatAvg(perGame(row.totals.blk, row.totals.measuredGames.blk))}</td>
                <td className={s.tdNum}>{formatStatPct(row.totals.fgm, row.totals.fga)}</td>
                <td className={s.tdNum}>{formatStatPct(row.totals.threeFgm, row.totals.threeFga)}</td>
                <td className={s.tdNum}>{formatStatPct(row.totals.ftm, row.totals.fta)}</td>
                <td className={s.tdNum}>{formatTsPct(row.totals.pts, row.totals.fga, row.totals.fta)}</td>
                <td className={s.tdNum}>{formatEffAvg(efi)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function AthleteDetailPage() {
  const { athleteId: rawAthleteId } = useParams<{ athleteId: string }>()
  const athleteId = parsePositiveId(rawAthleteId)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('summary')
  const athleteQuery = useAthleteQuery(athleteId ?? undefined)
  const statisticsQuery = useAthleteStatisticsQuery(
    athleteId ?? undefined,
    activeTab === 'summary',
  )
  const matchesQuery = useAthleteMatchesQuery(athleteId ?? undefined)
  const tournamentQuery = useAthleteTournamentStatsQuery(athleteId ?? undefined)
  const teamsQuery = useTeamsQuery()
  const seasonsQuery = useSeasonsQuery()

  if (athleteId == null) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <button type="button" className={s.backLink} onClick={() => navigate(-1)}>
            <ArrowLeft size={12} strokeWidth={1.7} /> Voltar
          </button>
        </div>
        <div className={s.bodyFill}>
          <ErrorState title="ID de atleta inválido." />
        </div>
      </div>
    )
  }

  if (athleteQuery.isPending) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <button type="button" className={s.backLink} onClick={() => navigate(-1)}>
            <ArrowLeft size={12} strokeWidth={1.7} /> Voltar
          </button>
          <div className={s.skBlock}>
            <Skeleton width={320} height={28} />
            <Skeleton width={240} height={16} />
            <Skeleton width="100%" height={48} />
          </div>
        </div>
      </div>
    )
  }

  if (athleteQuery.isError) {
    const notFound = axios.isAxiosError(athleteQuery.error)
      && athleteQuery.error.response?.status === 404
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <button type="button" className={s.backLink} onClick={() => navigate(-1)}>
            <ArrowLeft size={12} strokeWidth={1.7} /> Voltar
          </button>
        </div>
        <div className={s.bodyFill}>
          {notFound ? (
            <EmptyState title="Atleta não encontrado." />
          ) : (
            <ErrorState title="Não foi possível carregar o atleta." onRetry={() => athleteQuery.refetch()} />
          )}
        </div>
      </div>
    )
  }

  const athlete = athleteQuery.data
  if (!athlete) return null

  const teams = teamMap(teamsQuery.data ?? [])
  const teamName = athlete.currentTeamId === null
    ? 'Sem equipe atual'
    : teams.get(athlete.currentTeamId)?.name ?? `Equipe #${athlete.currentTeamId}`
  const seasonLabels = new Map((seasonsQuery.data ?? []).map((season) => [season.id, season.label]))

  return (
    <div className={s.page}>
      <div className={s.detailHeader} data-testid="athlete-header">
        <button type="button" className={s.backLink} onClick={() => navigate(-1)}>
          <ArrowLeft size={12} strokeWidth={1.7} /> Voltar
        </button>

        <div className={s.heroRow}>
          <div className={s.jersey}>{athlete.jerseyNumber === null ? '—' : `#${athlete.jerseyNumber}`}</div>
          <div className={s.heroMain}>
            <h1 className={s.title}>{athlete.name}</h1>
            <div className={s.meta}>
              <span>{athlete.position ?? 'Não informada'} · {teamName}</span>
            </div>
          </div>
          <Badge variant={athlete.status === 'ACTIVE' ? 'success' : 'ghost'}>
            {ATHLETE_STATUS_LABELS[athlete.status]}
          </Badge>
        </div>

        <div className={s.tabsBar}>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} variant="line" />
        </div>
      </div>

      <div className={s.detailBody}>
        {activeTab === 'summary' && (
          statisticsQuery.isPending ? (
            <div className={s.tabEmpty}><Skeleton width="100%" height={180} /></div>
          ) : statisticsQuery.isError ? (
            <div className={s.tabEmpty}>
              <ErrorState
                title="Não foi possível carregar as estatísticas."
                onRetry={() => statisticsQuery.refetch()}
              />
            </div>
          ) : statisticsQuery.data ? (
            <SummaryContent statistics={statisticsQuery.data} />
          ) : null
        )}
        {activeTab === 'matches' && (
          matchesQuery.isPending ? (
            <div className={s.tabEmpty}><Skeleton width="100%" height={180} /></div>
          ) : matchesQuery.isError ? (
            <div className={s.tabEmpty}>
              <ErrorState
                title="Não foi possível carregar as partidas."
                onRetry={() => matchesQuery.refetch()}
              />
            </div>
          ) : (
            <MatchesContent rows={matchesQuery.data ?? []} />
          )
        )}
        {activeTab === 'tournaments' && (
          tournamentQuery.isPending ? (
            <div className={s.tabEmpty}><Skeleton width="100%" height={180} /></div>
          ) : tournamentQuery.isError ? (
            <div className={s.tabEmpty}>
              <ErrorState
                title="Não foi possível carregar os campeonatos."
                onRetry={() => tournamentQuery.refetch()}
              />
            </div>
          ) : (
            <TournamentsContent rows={tournamentQuery.data ?? []} seasonLabels={seasonLabels} />
          )
        )}
      </div>
    </div>
  )
}
