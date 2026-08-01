import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { TabItem } from '../../components/ui/Tabs/Tabs'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { useCancelMatch, useMatchDetailQuery, usePostponeMatch, useTournamentsQuery } from '../../features/sports/queries'
import { useIsOrgAdmin } from '../../features/sports/useIsOrgAdmin'
import {
  formatDate,
  formatTime,
  MATCH_STATUS_LABELS,
  matchPhaseName,
  matchStatusVariant,
} from '../../features/sports/sportsUtils'
import { apiErrorCode, apiErrorMessage } from '../../services/apiError'
import { SummaryTab } from './tabs/SummaryTab'
import { StatsTab } from './tabs/StatsTab'
import s from './matches.module.css'

const TABS: TabItem[] = [
  { id: 'summary', label: 'Resumo' },
  { id: 'stats',   label: 'Estatísticas' },
]

type PendingAction = 'postpone' | 'cancel'

const CONFIRM_COPY: Record<PendingAction, string> = {
  postpone: 'A partida ficará Adiada até que uma nova data seja salva.',
  cancel: 'A partida será cancelada e não poderá ser reativada nesta fase.',
}

export function MatchDetailPage() {
  const { matchId: rawMatchId } = useParams<{ matchId: string }>()
  const matchId = parsePositiveId(rawMatchId)
  const isOrgAdmin = useIsOrgAdmin()
  const matchQuery = useMatchDetailQuery(matchId ?? undefined)
  const match = matchQuery.data
  const { data: tournaments } = useTournamentsQuery()
  const [activeTab, setActiveTab] = useState('summary')
  const [confirmingAction, setConfirmingAction] = useState<PendingAction | null>(null)
  const [actionError, setActionError] = useState('')

  const postponeMutation = usePostponeMatch()
  const cancelMutation = useCancelMatch()
  const actionPending = postponeMutation.isPending || cancelMutation.isPending

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
  if (matchQuery.isPending) {
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

  // ── Not found ────────────────────────────────────────────────────────────────
  const matchNotFound = apiErrorCode(matchQuery.error) === 'RECORD_NOT_FOUND'
    && apiErrorMessage(matchQuery.error) === 'Match not found'
  if (matchNotFound) {
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

  // ── Error ────────────────────────────────────────────────────────────────────
  if (matchQuery.isError || !match) {
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
          <ErrorState title="Não foi possível carregar a partida." onRetry={() => void matchQuery.refetch()} />
        </div>
      </div>
    )
  }

  const tournament = tournaments?.find((t) => t.id === match.tournamentId)
  const hasScore = match.homeTeam.score !== null && match.awayTeam.score !== null
  const scoreSourceLabel = match.scoreSource === 'PERIODS'
    ? 'Placar por períodos'
    : match.scoreSource === 'AWARDED'
      ? 'Placar atribuído'
      : null

  const canPostpone = match.status === 'SCHEDULED' || match.status === 'LIVE'
  const canCancel = match.status === 'SCHEDULED' || match.status === 'LIVE' || match.status === 'POSTPONED'

  const applyActionError = async (error: unknown, action: PendingAction) => {
    const code = apiErrorCode(error)
    const message = apiErrorMessage(error)

    if (code === 'RECORD_NOT_FOUND' && message === 'Match not found') {
      setConfirmingAction(null)
      setActionError('Partida não encontrada.')
      return
    }
    if (code === 'INVALID_STATUS_TRANSITION') {
      const refreshed = await matchQuery.refetch()
      const label = refreshed.data ? MATCH_STATUS_LABELS[refreshed.data.status] : ''
      setActionError(
        action === 'postpone'
          ? `A partida está com status ${label} e não pode mais ser adiada.`
          : `A partida está com status ${label} e não pode mais ser cancelada.`,
      )
      return
    }
    if (code === 'CONCURRENT_MODIFICATION') {
      void matchQuery.refetch()
      setActionError('A partida foi alterada por outra pessoa. Revise os dados e tente novamente.')
      return
    }
    setActionError(action === 'postpone' ? 'Não foi possível adiar a partida.' : 'Não foi possível cancelar a partida.')
  }

  const handleConfirm = async () => {
    if (!confirmingAction) return
    setActionError('')
    try {
      if (confirmingAction === 'postpone') {
        await postponeMutation.mutateAsync(match.id)
      } else {
        await cancelMutation.mutateAsync(match.id)
      }
      setConfirmingAction(null)
    } catch (error) {
      await applyActionError(error, confirmingAction)
    }
  }

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
            <div className={s.detailActions}>
              <Link to={`/matches/${match.id}/edit`}>
                <Button type="button" variant="secondary" size="sm">Editar partida</Button>
              </Link>
              {canPostpone && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={actionPending}
                  onClick={() => { setActionError(''); setConfirmingAction('postpone') }}
                >
                  Adiar
                </Button>
              )}
              {canCancel && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={actionPending}
                  onClick={() => { setActionError(''); setConfirmingAction('cancel') }}
                >
                  Cancelar
                </Button>
              )}
            </div>
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
            <span className={s.scoreTeamName}>{match.homeTeam.teamName}</span>
            <span className={s.scoreTeamRole}>Mandante</span>
          </div>

          <div className={s.scoreCenter}>
            <div className={s.scoreNums}>
              {hasScore ? (
                <>
                  <span className={s.scoreNum}>{match.homeTeam.score}</span>
                  <span className={s.scoreSep}>–</span>
                  <span className={s.scoreNum}>{match.awayTeam.score}</span>
                </>
              ) : (
                <span className={s.scoreNumPending}>× × ×</span>
              )}
            </div>
            {scoreSourceLabel && <Badge variant="warning">{scoreSourceLabel}</Badge>}
          </div>

          <div className={s.scoreTeamRight}>
            <span className={s.scoreTeamName}>{match.awayTeam.teamName}</span>
            <span className={s.scoreTeamRole}>Visitante</span>
          </div>
        </div>

        {/* ── Info strip ── */}
        <div className={s.infoStrip}>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Data</span>
            <span className={s.infoValue}>{formatDate(match.scheduledAt)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Horário</span>
            <span className={s.infoValue}>{formatTime(match.scheduledAt)}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Local</span>
            <span className={s.infoValue}>{match.venueName ?? '—'}</span>
          </div>
          <div className={s.infoItem}>
            <span className={s.infoLabel}>Fase</span>
            <span className={s.infoValue}>{matchPhaseName(match) ?? '—'}</span>
          </div>
        </div>

        {actionError && <p className={s.error} role="alert">{actionError}</p>}

        {confirmingAction && (
          <div
            className={s.confirm}
            role="alertdialog"
            aria-label={confirmingAction === 'postpone' ? 'Confirmar adiamento' : 'Confirmar cancelamento'}
          >
            <p>{CONFIRM_COPY[confirmingAction]}</p>
            <div className={s.confirmActions}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingAction(null)}>
                Voltar
              </Button>
              <Button
                type="button"
                variant={confirmingAction === 'cancel' ? 'danger' : 'primary'}
                size="sm"
                loading={actionPending}
                onClick={() => void handleConfirm()}
              >
                {confirmingAction === 'postpone' ? 'Confirmar adiamento' : 'Confirmar cancelamento'}
              </Button>
            </div>
          </div>
        )}

        <div className={s.tabsBar}>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} variant="line" />
        </div>
      </div>

      <div className={s.detailBody}>
        {activeTab === 'summary' && <SummaryTab match={match} />}
        {activeTab === 'stats' && <StatsTab match={match} />}
      </div>
    </div>
  )
}
