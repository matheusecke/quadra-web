import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import {
  useAthletesQuery,
  useMatchDetailQuery,
  useTeamsQuery,
  useTournamentsQuery,
  useTournamentTeamsQuery,
} from '../../features/sports/queries'
import { useIsOrgAdmin } from '../../features/sports/useIsOrgAdmin'
import {
  formatDate,
  formatTime,
  MATCH_STATUS_LABELS,
  matchPhaseName,
  matchStatusVariant,
  teamMap,
  tournamentTeamMap,
} from '../../features/sports/sportsUtils'
import { SummaryTab } from './tabs/SummaryTab'
import { StatsTab } from './tabs/StatsTab'
import s from './matches.module.css'

const TABS: TabItem[] = [
  { id: 'summary', label: 'Resumo' },
  { id: 'stats',   label: 'Estatísticas' },
]

export function MatchDetailPage() {
  const { matchId: rawMatchId } = useParams<{ matchId: string }>()
  const matchId = parsePositiveId(rawMatchId)
  const navigate = useNavigate()
  const isOrgAdmin = useIsOrgAdmin()
  const matchQuery = useMatchDetailQuery(matchId ?? undefined)
  const match = matchQuery.data
  const { data: tournaments } = useTournamentsQuery()
  const { data: tournamentTeamsData } = useTournamentTeamsQuery(match?.tournamentId)
  const teamsQuery = useTeamsQuery()
  const athletesQuery = useAthletesQuery()
  const [activeTab, setActiveTab] = useState('summary')

  const isLoading = matchQuery.isPending || teamsQuery.isPending || athletesQuery.isPending
  const isError = matchQuery.isError || teamsQuery.isError || athletesQuery.isError
  const refetch = () => {
    matchQuery.refetch()
    teamsQuery.refetch()
    athletesQuery.refetch()
  }

  const teams = teamMap(teamsQuery.data ?? [])
  const athletes = new Map((athletesQuery.data ?? []).map((athlete) => [athlete.id, athlete]))
  const tournamentTeams = tournamentTeamMap(tournamentTeamsData ?? [], teams)
  const tournament = tournaments?.find((c) => c.id === match?.tournamentId)

  // ── Invalid route param ────────────────────────────────────────────────────
  if (matchId == null) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <div className={s.detailNav}>
            <Link to="/matches" className={s.backLink}>
              <ArrowLeft size={12} strokeWidth={1.7} /> Partidas
            </Link>
          </div>
        </div>
        <div className={s.bodyFill}>
          <ErrorState title="ID de partida inválido." />
        </div>
      </div>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <div className={s.detailNav}>
            <Link to="/matches" className={s.backLink}>
              <ArrowLeft size={12} strokeWidth={1.7} /> Partidas
            </Link>
          </div>
          <div className={s.skBlock} style={{ paddingBottom: 20 }}>
            <Skeleton width={300} height={14} />
            <Skeleton width="100%" height={100} />
            <Skeleton width="100%" height={44} />
            <Skeleton width="100%" height={36} />
          </div>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <div className={s.detailNav}>
            <Link to="/matches" className={s.backLink}>
              <ArrowLeft size={12} strokeWidth={1.7} /> Partidas
            </Link>
          </div>
        </div>
        <div className={s.bodyFill}>
          <ErrorState title="Não foi possível carregar a partida." onRetry={refetch} />
        </div>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!match) {
    return (
      <div className={s.page}>
        <div className={s.detailHeader}>
          <div className={s.detailNav}>
            <Link to="/matches" className={s.backLink}>
              <ArrowLeft size={12} strokeWidth={1.7} /> Partidas
            </Link>
          </div>
        </div>
        <div className={s.bodyFill}>
          <EmptyState
            title="Partida não encontrada."
            description="O link pode estar incorreto ou a partida foi removida."
          />
        </div>
      </div>
    )
  }

  const homeTeam = tournamentTeams.get(match.homeTournamentTeamId)
  const awayTeam = tournamentTeams.get(match.awayTournamentTeamId)
  const hasScore = match.homeScore !== null && match.awayScore !== null
  const isForfeit = match.homeLossType === 'FORFEIT' || match.awayLossType === 'FORFEIT'
  const isAwardedScore = match.scoreSource === 'AWARDED'
  const awardedScoreLabel = isForfeit
    ? 'Vitória por W.O. (FIBA D.3.1)'
    : 'Placar atribuído por abandono (Art. 21)'

  return (
    <div className={s.page}>
      <div className={s.detailHeader}>
        {/* ── Nav ── */}
        <div className={s.detailNav}>
          <Link to={`/tournaments/${match.tournamentId}?tab=matches`} className={s.backLink}>
            <ArrowLeft size={12} strokeWidth={1.7} /> Partidas
          </Link>
          {tournament && (
            <Link to={`/tournaments/${tournament.id}`} className={s.champLink}>
              {tournament.name}
              <ExternalLink size={11} strokeWidth={1.6} />
            </Link>
          )}
          {isOrgAdmin && (
            <Button variant="primary" size="sm" onClick={() => navigate(`/matches/${match.id}/sumula`)}>
              {match.status === 'FINISHED' ? 'Editar súmula' : 'Lançar resultado'}
            </Button>
          )}
        </div>

        {/* ── Context ── */}
        <div className={s.detailContext}>
          {tournament && <span>{tournament.name}</span>}
          {tournament && <span className={s.detailContextSep}>·</span>}
          <span>{matchPhaseName(match) ?? ''}</span>
          <span className={s.detailContextSep}>·</span>
          <Badge variant={matchStatusVariant(match.status)}>
            {MATCH_STATUS_LABELS[match.status]}
          </Badge>
        </div>

        {/* ── Score hero ── */}
        <div className={s.scoreHero}>
          <div className={s.scoreTeamLeft}>
            <span className={s.scoreTeamName}>{homeTeam?.name ?? 'A definir'}</span>
            <span className={s.scoreTeamRole}>Mandante</span>
          </div>

          <div className={s.scoreCenter}>
            <div className={s.scoreNums}>
              {hasScore ? (
                <>
                  <span className={s.scoreNum}>{match.homeScore}</span>
                  <span className={s.scoreSep}>–</span>
                  <span className={s.scoreNum}>{match.awayScore}</span>
                </>
              ) : (
                <span className={s.scoreNumPending}>× × ×</span>
              )}
            </div>
            {isAwardedScore && <Badge variant="warning">{awardedScoreLabel}</Badge>}
          </div>

          <div className={s.scoreTeamRight}>
            <span className={s.scoreTeamName}>{awayTeam?.name ?? 'A definir'}</span>
            <span className={s.scoreTeamRole}>Visitante</span>
          </div>
        </div>

        {/* ── Info strip ── */}
        <div className={s.infoStrip}>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Data</span>
            <span className={s.infoValue}>{formatDate(match.date)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Horário</span>
            <span className={s.infoValue}>{formatTime(match.date)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Local</span>
            <span className={s.infoValue}>{match.venue ?? '—'}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Fase</span>
            <span className={s.infoValue}>{matchPhaseName(match) ?? '—'}</span>
          </div>
        </div>

        {!isForfeit && <div className={s.tabsBar}>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} variant="line" />
        </div>}
      </div>

      <div className={s.detailBody}>
        {isForfeit ? (
          <EmptyState
            title="Partida não disputada. Não há súmula."
            description="A vitória foi atribuída por W.O. conforme a FIBA D.3.1."
          />
        ) : activeTab === 'summary' && (
          <SummaryTab match={match} tournamentTeams={tournamentTeams} athletes={athletes} />
        )}
        {!isForfeit && activeTab === 'stats' && (
          <StatsTab match={match} tournamentTeams={tournamentTeams} />
        )}
      </div>
    </div>
  )
}
