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
import { getTeams } from '../../features/sports/mock-sports-data'
import { useMatchDetailQuery, useTournamentsQuery } from '../../features/sports/queries'
import { useIsOrgAdmin } from '../../features/sports/useIsOrgAdmin'
import {
  formatDate,
  formatTime,
  matchDisplayStatus,
  matchDisplayStatusVariant,
  teamMap,
} from '../../features/sports/sportsUtils'
import { SummaryTab } from './tabs/SummaryTab'
import { StatsTab } from './tabs/StatsTab'
import s from './matches.module.css'

const TABS: TabItem[] = [
  { id: 'summary', label: 'Resumo' },
  { id: 'stats',   label: 'Estatísticas' },
]

export function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const isOrgAdmin = useIsOrgAdmin()
  const { data: match, isPending: isLoading, isError, refetch } = useMatchDetailQuery(matchId)
  const { data: tournaments } = useTournamentsQuery()
  const [activeTab, setActiveTab] = useState('summary')

  const teams        = teamMap(getTeams())
  const tournament = tournaments?.find((c) => c.id === match?.tournamentId)

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

  const homeTeam = teams.get(match.homeTeamId)
  const awayTeam = teams.get(match.awayTeamId)
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
          <Link to="/matches" className={s.backLink}>
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
          <span>{match.phase}</span>
          <span className={s.detailContextSep}>·</span>
          <Badge variant={matchDisplayStatusVariant(match.status, match.statsStatus)}>
            {matchDisplayStatus(match.status, match.statsStatus)}
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
            <span className={s.infoValue}>{match.phase}</span>
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
          <SummaryTab match={match} teams={teams} />
        )}
        {!isForfeit && activeTab === 'stats' && (
          <StatsTab match={match} teams={teams} />
        )}
      </div>
    </div>
  )
}
