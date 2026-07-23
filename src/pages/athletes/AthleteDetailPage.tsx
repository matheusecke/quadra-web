import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import {
  useAthleteMatchesQuery,
  useAthleteQuery,
  useAthleteSummaryQuery,
  useAthleteTournamentStatsQuery,
  useSeasonsQuery,
  useTeamsQuery,
} from '../../features/sports/queries'
import type {
  AthleteTournamentStatsRow,
  AthleteMatchStatsRow,
  AthleteStatTotals,
  PlayerMatchStats,
} from '../../features/sports/types'
import {
  ATHLETE_STATUS_LABELS,
  calcEff,
  calcEffFromTotals,
  formatDateShort,
  formatMinutesSeconds,
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

function StatStrip({ title, stats }: { title: string; stats: Array<{ label: string; value: string | number; sm?: boolean }> }) {
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>{title}</h2>
      </div>
      <div className={s.statsBlock}>
        <div className={s.statsRow}>
          {stats.map(({ label, value, sm }) => (
            <div key={label} className={s.statItem}>
              <span className={sm ? s.statValueSm : s.statValue}>{value}</span>
              <span className={s.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SummaryContent({ summary }: { summary: AthleteStatTotals }) {
  const eff = calcEffFromTotals(summary)

  return (
    <>
      <StatStrip
        title="Totais"
        stats={[
          { label: 'J', value: summary.games },
          { label: 'MIN', value: formatMinutesSeconds(summary.minutesSeconds) },
          { label: 'PTS', value: summary.pts ?? 'N/A' },
          { label: 'REB', value: summary.reb ?? 'N/A' },
          { label: 'AST', value: summary.ast ?? 'N/A' },
          { label: 'STL', value: summary.stl ?? 'N/A' },
          { label: 'BLK', value: summary.blk ?? 'N/A' },
          { label: 'TOV', value: summary.tov ?? 'N/A' },
          { label: 'PF', value: summary.pf ?? 'N/A' },
        ]}
      />
      <StatStrip
        title="Médias"
        stats={[
          { label: 'MPG', value: formatMinutesSeconds(perGame(summary.minutesSeconds, summary.measuredGames.minutesSeconds)) },
          { label: 'PPG', value: formatAvg(perGame(summary.pts, summary.measuredGames.pts)) },
          { label: 'RPG', value: formatAvg(perGame(summary.reb, summary.measuredGames.reb)) },
          { label: 'APG', value: formatAvg(perGame(summary.ast, summary.measuredGames.ast)) },
          { label: 'STG', value: formatAvg(perGame(summary.stl, summary.measuredGames.stl)) },
          { label: 'BPG', value: formatAvg(perGame(summary.blk, summary.measuredGames.blk)) },
          { label: 'TOV', value: formatAvg(perGame(summary.tov, summary.measuredGames.tov)) },
          { label: 'PF', value: formatAvg(perGame(summary.pf, summary.measuredGames.pf)) },
        ]}
      />
      <StatStrip
        title="Aproveitamento"
        stats={[
          { label: 'FG', value: summary.fgm === null || summary.fga === null ? 'N/A' : `${summary.fgm}/${summary.fga}`, sm: true },
          { label: 'FG%', value: formatStatPct(summary.fgm, summary.fga), sm: true },
          { label: '3FG', value: summary.threeFgm === null || summary.threeFga === null ? 'N/A' : `${summary.threeFgm}/${summary.threeFga}`, sm: true },
          { label: '3FG%', value: formatStatPct(summary.threeFgm, summary.threeFga), sm: true },
          { label: 'FT', value: summary.ftm === null || summary.fta === null ? 'N/A' : `${summary.ftm}/${summary.fta}`, sm: true },
          { label: 'FT%', value: formatStatPct(summary.ftm, summary.fta), sm: true },
          { label: 'TS%', value: formatTsPct(summary.pts, summary.fga, summary.fta), sm: true },
          { label: 'EFF/EFI', value: formatEff(eff), sm: true },
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
                <td className={s.td}>{formatDateShort(row.match.date)}</td>
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
  const { data: athlete, isPending: athleteLoading, isError: athleteError, refetch: refetchAthlete } = useAthleteQuery(athleteId ?? undefined)
  const { data: summary, isPending: summaryLoading, isError: summaryError } = useAthleteSummaryQuery(athleteId ?? undefined)
  const { data: matches, isPending: matchesLoading, isError: matchesError } = useAthleteMatchesQuery(athleteId ?? undefined)
  const {
    data: tournamentStats,
    isPending: tournamentLoading,
    isError: tournamentError,
  } = useAthleteTournamentStatsQuery(athleteId ?? undefined)
  const teamsQuery = useTeamsQuery()
  const seasonsQuery = useSeasonsQuery()
  const [activeTab, setActiveTab] = useState('summary')

  const teams = teamMap(teamsQuery.data ?? [])
  const seasonLabels = new Map((seasonsQuery.data ?? []).map((season) => [season.id, season.label]))
  const isLoading = athleteLoading || summaryLoading || matchesLoading || tournamentLoading || teamsQuery.isPending || seasonsQuery.isPending
  const isError = athleteError || summaryError || matchesError || tournamentError || teamsQuery.isError || seasonsQuery.isError
  const refetch = () => {
    refetchAthlete()
    teamsQuery.refetch()
    seasonsQuery.refetch()
  }

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

  if (isLoading) {
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

  if (isError) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <button type="button" className={s.backLink} onClick={() => navigate(-1)}>
            <ArrowLeft size={12} strokeWidth={1.7} /> Voltar
          </button>
        </div>
        <div className={s.bodyFill}>
          <ErrorState title="Não foi possível carregar o atleta." onRetry={refetch} />
        </div>
      </div>
    )
  }

  if (!athlete || !summary) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <button type="button" className={s.backLink} onClick={() => navigate(-1)}>
            <ArrowLeft size={12} strokeWidth={1.7} /> Voltar
          </button>
        </div>
        <div className={s.bodyFill}>
          <EmptyState
            title="Atleta não encontrado."
            description="O link pode estar incorreto ou o atleta não possui dados mockados."
          />
        </div>
      </div>
    )
  }

  const team = teams.get(athlete.currentTeamId)

  return (
    <div className={s.page}>
      <div className={s.detailHeader} data-testid="athlete-header">
        <button type="button" className={s.backLink} onClick={() => navigate(-1)}>
          <ArrowLeft size={12} strokeWidth={1.7} /> Voltar
        </button>

        <div className={s.heroRow}>
          <div className={s.jersey}>#{athlete.number}</div>
          <div className={s.heroMain}>
            <h1 className={s.title}>{athlete.name}</h1>
            <div className={s.meta}>
              <span>{athlete.position ?? 'Não informada'} · {team?.name ?? String(athlete.currentTeamId)}</span>
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
        {activeTab === 'summary' && <SummaryContent summary={summary} />}
        {activeTab === 'matches' && <MatchesContent rows={matches ?? []} />}
        {activeTab === 'tournaments' && (
          <TournamentsContent rows={tournamentStats ?? []} seasonLabels={seasonLabels} />
        )}
      </div>
    </div>
  )
}
