import { useReducer, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Field } from '../../components/ui/Field/Field'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import type { BoxScoreState } from '../../features/sports/boxScore.reducer'
import {
  boxScoreReducer,
  columnHasData,
  initBoxScoreState,
  lineErrors,
  teamTotalPoints,
} from '../../features/sports/boxScore.reducer'
import { BoxScoreTable } from '../../features/sports/components/BoxScoreTable'
import { MvpSelect } from '../../features/sports/components/MvpSelect'
import { PeriodScoreEditor } from '../../features/sports/components/PeriodScoreEditor'
import { StatColumnsConfig } from '../../features/sports/components/StatColumnsConfig'
import { matchWriteErrorMessage } from '../../features/sports/matchWriteErrorMessage'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import {
  useMatchDetailQuery,
  useRosterQuery,
  useSaveMatchDraft,
  useSubmitMatchResult,
} from '../../features/sports/queries'
import {
  isScoreConsistent,
  periodsSum,
  STAT_FIELDS,
  type PlayerStatInput,
} from '../../features/sports/statistics'
import { MATCH_STATUS_LABELS, matchStatusVariant } from '../../features/sports/sportsUtils'
import type {
  MatchDetail,
  PlayerMatchStats,
  TournamentRoster,
} from '../../features/sports/types'
import { apiErrorCode, apiErrorMessage } from '../../services/apiError'
import type {
  MatchPeriodInput,
  MatchPlayerStatisticInput,
} from '../../services/sportsApi'
import s from './MatchSumulaPage.module.css'

interface ScoresheetRosterEntry {
  tournamentRosterId: number
  tournamentTeamId: number
  userId: number
  name: string
  number: number | null
}

interface PlayedSnapshot {
  periods: MatchPeriodInput[]
  playerStats: MatchPlayerStatisticInput[]
  mvpTournamentRosterId: number | null
}

interface ScoresheetFeedback {
  type: 'success' | 'error'
  message: string
}

const buildPlayedSnapshot = (
  state: BoxScoreState,
  roster: ScoresheetRosterEntry[],
): PlayedSnapshot => ({
  periods: state.periods.map((period) => ({
    periodNumber: period.periodNumber,
    periodType: period.type,
    homePoints: period.homePoints!,
    awayPoints: period.awayPoints!,
  })),
  playerStats: roster.map((entry) => ({
    tournamentRosterId: entry.tournamentRosterId,
    ...state.lines[entry.tournamentRosterId],
  })),
  mvpTournamentRosterId: state.mvpTournamentRosterId,
})

const validatePlayedScoresheet = (
  state: BoxScoreState,
  roster: ScoresheetRosterEntry[],
  requireWinner: boolean,
): string | null => {
  const hasInvalidPeriodValue = state.periods.some((period) =>
    period.homePoints === null
      || period.awayPoints === null
      || !Number.isInteger(period.homePoints)
      || !Number.isInteger(period.awayPoints)
      || period.homePoints < 0
      || period.awayPoints < 0,
  )
  if (hasInvalidPeriodValue) {
    return 'Informe valores inteiros e não negativos para todos os períodos.'
  }

  const hasInvalidSequence = state.periods.length < 4
    || state.periods.some((period, index) =>
      period.periodNumber !== index + 1
        || period.type !== (index < 4 ? 'REGULAR' : 'OVERTIME'),
    )
  if (hasInvalidSequence) {
    return 'Os períodos devem ser sequenciais: quatro regulares e, depois, apenas prorrogações.'
  }

  const rosterIds = roster.map((entry) => entry.tournamentRosterId)
  if (new Set(rosterIds).size !== rosterIds.length) {
    return 'Os elencos possuem uma inscrição duplicada.'
  }
  const userIds = roster.map((entry) => entry.userId)
  if (new Set(userIds).size !== userIds.length) {
    return 'Os elencos possuem duas inscrições pertencentes à mesma pessoa.'
  }
  if (roster.some((entry) => !state.lines[entry.tournamentRosterId])) {
    return 'Não foi possível montar as estatísticas de todos os atletas.'
  }
  if (roster.some((entry) => lineErrors(state, entry.tournamentRosterId).length > 0)) {
    return 'Corrija as estatísticas dos atletas antes de continuar.'
  }

  for (const field of STAT_FIELDS) {
    const values = roster.map((entry) => state.lines[entry.tournamentRosterId][field])
    const nullCount = values.filter((value) => value === null).length
    if (nullCount !== 0 && nullCount !== values.length) {
      return 'Cada estatística deve ser informada para todos os atletas ou marcada como não acompanhada para todos.'
    }
  }

  if (state.mvpTournamentRosterId !== null
    && !rosterIds.includes(state.mvpTournamentRosterId)) {
    return 'O MVP precisa estar entre os atletas enviados nas estatísticas.'
  }

  const totals = periodsSum(state.periods)
  if (requireWinner && totals.home === totals.away) {
    return 'O resultado normal não pode terminar empatado. Adicione uma prorrogação.'
  }
  return null
}

const toRosterEntry = (entry: TournamentRoster): ScoresheetRosterEntry => ({
  tournamentRosterId: entry.id,
  tournamentTeamId: entry.tournamentTeamId,
  userId: entry.userId,
  name: entry.displayNameSnapshot,
  number: entry.jerseyNumber,
})

const toStatInput = (player: PlayerMatchStats): PlayerStatInput => ({
  pts: player.pts,
  fgm: player.fgm,
  fga: player.fga,
  threeFgm: player.threeFgm,
  threeFga: player.threeFga,
  ftm: player.ftm,
  fta: player.fta,
  reb: player.reb,
  ast: player.ast,
  stl: player.stl,
  blk: player.blk,
  tov: player.tov,
  pf: player.pf,
  minutesSeconds: player.minutesSeconds,
})

const detailLink = (matchId: number) => (
  <Link to={`/matches/${matchId}`}>Voltar para a partida</Link>
)

export function MatchSumulaPage() {
  const { matchId: rawMatchId } = useParams<{ matchId: string }>()
  const matchId = parsePositiveId(rawMatchId)
  const matchQuery = useMatchDetailQuery(matchId ?? undefined)

  if (matchId == null) {
    return <main className={s.page}><ErrorState title="ID de partida inválido." /></main>
  }

  if (matchQuery.isPending) {
    return (
      <main className={s.page} role="status" aria-label="Carregando súmula">
        <Skeleton height={40} />
        <Skeleton height={180} />
        <Skeleton height={260} />
      </main>
    )
  }

  const notFound = apiErrorCode(matchQuery.error) === 'RECORD_NOT_FOUND'
    && apiErrorMessage(matchQuery.error) === 'Match not found'
  if (notFound) {
    return (
      <main className={s.page}>
        <EmptyState
          title="Partida não encontrada."
          description="O link pode estar incorreto ou a partida foi removida."
        />
      </main>
    )
  }

  if (matchQuery.isError || !matchQuery.data) {
    return (
      <main className={s.page}>
        <ErrorState
          title="Não foi possível carregar a partida."
          onRetry={() => void matchQuery.refetch()}
        />
      </main>
    )
  }

  const match = matchQuery.data
  if (match.status === 'FINISHED') {
    return (
      <main className={s.page}>
        <EmptyState
          title="Esta partida está finalizada."
          description="Reabra o resultado na tela de detalhes para continuar a edição."
          action={detailLink(match.id)}
        />
      </main>
    )
  }

  if (match.status === 'POSTPONED' || match.status === 'CANCELLED') {
    const description = match.status === 'POSTPONED'
      ? 'Partidas adiadas não podem ter a súmula alterada.'
      : 'Partidas canceladas não podem ter a súmula alterada.'
    return (
      <main className={s.page}>
        <EmptyState
          title="A súmula não pode ser alterada."
          description={description}
          action={detailLink(match.id)}
        />
      </main>
    )
  }

  return (
    <ScoresheetRosterLoader
      match={match}
      onRefreshMatch={() => void matchQuery.refetch()}
    />
  )
}

function ScoresheetRosterLoader({
  match,
  onRefreshMatch,
}: {
  match: MatchDetail
  onRefreshMatch: () => void
}) {
  const homeRosterQuery = useRosterQuery(match.homeTeam.tournamentTeamId)
  const awayRosterQuery = useRosterQuery(match.awayTeam.tournamentTeamId)
  const [feedback, setFeedback] = useState<ScoresheetFeedback | null>(null)

  if (homeRosterQuery.isPending || awayRosterQuery.isPending) {
    return (
      <main className={s.page} role="status" aria-label="Carregando elencos">
        <Skeleton height={40} />
        <Skeleton height={180} />
        <Skeleton height={260} />
      </main>
    )
  }

  if (homeRosterQuery.isError || awayRosterQuery.isError) {
    return (
      <main className={s.page}>
        <ErrorState
          title="Não foi possível carregar os elencos."
          onRetry={() => {
            void homeRosterQuery.refetch()
            void awayRosterQuery.refetch()
          }}
        />
      </main>
    )
  }

  const homeRoster = (homeRosterQuery.data ?? [])
    .filter((entry) => entry.role === 'ATHLETE')
    .map(toRosterEntry)
  const awayRoster = (awayRosterQuery.data ?? [])
    .filter((entry) => entry.role === 'ATHLETE')
    .map(toRosterEntry)
  const availableIds = new Set(
    [...homeRoster, ...awayRoster].map((entry) => entry.tournamentRosterId),
  )
  const hasMissingSavedAthlete = match.playerStats.some(
    (player) => !availableIds.has(player.tournamentRosterId),
  )

  if (hasMissingSavedAthlete) {
    return (
      <main className={s.page}>
        <ErrorState
          title="A súmula possui um atleta que não está disponível nos elencos."
          onRetry={() => {
            void homeRosterQuery.refetch()
            void awayRosterQuery.refetch()
          }}
        />
      </main>
    )
  }

  return (
    <ScoresheetForm
      key={match.id}
      match={match}
      homeRoster={homeRoster}
      awayRoster={awayRoster}
      feedback={feedback}
      onFeedback={setFeedback}
      onRefreshMatch={onRefreshMatch}
    />
  )
}

function ScoresheetForm({
  match,
  homeRoster,
  awayRoster,
  feedback,
  onFeedback,
  onRefreshMatch,
}: {
  match: MatchDetail
  homeRoster: ScoresheetRosterEntry[]
  awayRoster: ScoresheetRosterEntry[]
  feedback: ScoresheetFeedback | null
  onFeedback: (feedback: ScoresheetFeedback | null) => void
  onRefreshMatch: () => void
}) {
  const navigate = useNavigate()
  const draftMutation = useSaveMatchDraft()
  const resultMutation = useSubmitMatchResult()
  const [resultType, setResultType] = useState<'NORMAL' | 'DEFAULT' | 'FORFEIT'>('NORMAL')
  const [offendingTournamentTeamId, setOffendingTournamentTeamId] = useState<number | null>(null)
  const homeIds = homeRoster.map((entry) => entry.tournamentRosterId)
  const awayIds = awayRoster.map((entry) => entry.tournamentRosterId)
  const initialLines = Object.fromEntries(
    match.playerStats.map((player) => [player.tournamentRosterId, toStatInput(player)]),
  )
  const [state, dispatch] = useReducer(
    boxScoreReducer,
    {
      tournamentRosterIds: [...homeIds, ...awayIds],
      initialPeriods: match.periods,
      initialLines,
      mvpTournamentRosterId: match.mvp?.tournamentRosterId ?? null,
    },
    initBoxScoreState,
  )
  const [activeTeamId, setActiveTeamId] = useState(match.homeTeam.tournamentTeamId)
  const activeRoster = activeTeamId === match.homeTeam.tournamentTeamId
    ? homeRoster
    : awayRoster
  const totals = periodsSum(state.periods)
  const mvpCandidates = [
    ...homeRoster.map((entry) => ({
      tournamentRosterId: entry.tournamentRosterId,
      athleteId: entry.tournamentRosterId,
      name: entry.name,
      teamName: match.homeTeam.teamName,
    })),
    ...awayRoster.map((entry) => ({
      tournamentRosterId: entry.tournamentRosterId,
      athleteId: entry.tournamentRosterId,
      name: entry.name,
      teamName: match.awayTeam.teamName,
    })),
  ]

  const [confirming, setConfirming] = useState(false)
  const allRoster = [...homeRoster, ...awayRoster]
  const homePoints = teamTotalPoints(state, homeIds)
  const awayPoints = teamTotalPoints(state, awayIds)
  const pointWarnings = [
    homePoints !== null && !isScoreConsistent(homePoints, totals.home)
      ? `A soma dos pontos de ${match.homeTeam.teamName} não confere com o placar por períodos.`
      : null,
    awayPoints !== null && !isScoreConsistent(awayPoints, totals.away)
      ? `A soma dos pontos de ${match.awayTeam.teamName} não confere com o placar por períodos.`
      : null,
  ].filter((message): message is string => message !== null)
  const writePending = draftMutation.isPending || resultMutation.isPending

  const isForfeit = resultType === 'FORFEIT'
  const validateOffender = () => {
    if (resultType === 'NORMAL') return null
    if (offendingTournamentTeamId === null) return 'Selecione a equipe infratora.'
    if (offendingTournamentTeamId !== match.homeTeam.tournamentTeamId
      && offendingTournamentTeamId !== match.awayTeam.tournamentTeamId) {
      return 'A equipe infratora deve ser uma das participantes da partida.'
    }
    return null
  }

  const showValidation = (requireWinner: boolean) => {
    const message = validatePlayedScoresheet(state, allRoster, requireWinner)
    if (message) onFeedback({ type: 'error', message })
    return message
  }

  const handleDraft = async () => {
    if (showValidation(false)) return
    onFeedback(null)
    try {
      await draftMutation.mutateAsync({
        id: match.id,
        input: buildPlayedSnapshot(state, allRoster),
      })
      onFeedback({ type: 'success', message: 'Rascunho salvo.' })
    } catch (error) {
      onFeedback({ type: 'error', message: matchWriteErrorMessage(error, 'draft') })
      if (apiErrorCode(error) === 'INVALID_STATUS_TRANSITION') onRefreshMatch()
    }
  }

  const requestResultConfirmation = () => {
    const offenderError = validateOffender()
    if (offenderError) {
      onFeedback({ type: 'error', message: offenderError })
      return
    }
    if (!isForfeit && showValidation(resultType === 'NORMAL')) return
    onFeedback(null)
    setConfirming(true)
  }

  const handleResult = async () => {
    const offenderError = validateOffender()
    if (offenderError) {
      setConfirming(false)
      onFeedback({ type: 'error', message: offenderError })
      return
    }
    if (!isForfeit && showValidation(resultType === 'NORMAL')) {
      setConfirming(false)
      return
    }

    onFeedback(null)
    try {
      if (resultType === 'FORFEIT') {
        await resultMutation.mutateAsync({
          id: match.id,
          input: {
            resultType: 'FORFEIT',
            offendingTournamentTeamId: offendingTournamentTeamId!,
          },
        })
      } else {
        const snapshot = buildPlayedSnapshot(state, allRoster)
        await resultMutation.mutateAsync({
          id: match.id,
          input: resultType === 'DEFAULT'
            ? {
                resultType: 'DEFAULT',
                offendingTournamentTeamId: offendingTournamentTeamId!,
                ...snapshot,
              }
            : { resultType: 'NORMAL', ...snapshot },
        })
      }
      navigate(`/matches/${match.id}`)
    } catch (error) {
      setConfirming(false)
      onFeedback({ type: 'error', message: matchWriteErrorMessage(error, 'result') })
      if (apiErrorCode(error) === 'INVALID_STATUS_TRANSITION') onRefreshMatch()
    }
  }

  return (
    <main className={s.page}>
      <Link to={`/matches/${match.id}`} className={s.backLink}>
        <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para a partida
      </Link>

      <div className={s.titleRow}>
        <h1 className={s.title}>Súmula da partida</h1>
        <Badge variant={matchStatusVariant(match.status)}>
          {MATCH_STATUS_LABELS[match.status]}
        </Badge>
      </div>

      <section className={s.resultControls} aria-label="Configuração do resultado">
        <Field label="Tipo de resultado" id="result-type">
          <Combobox
            id="result-type"
            options={[
              { value: 'NORMAL', label: 'Normal' },
              { value: 'DEFAULT', label: 'Abandono' },
              { value: 'FORFEIT', label: 'W.O.' },
            ]}
            value={resultType}
            onChange={(next) => {
              if (next !== 'NORMAL' && next !== 'DEFAULT' && next !== 'FORFEIT') return
              setResultType(next)
              setOffendingTournamentTeamId(null)
              setConfirming(false)
              onFeedback(null)
            }}
          />
        </Field>

        {resultType !== 'NORMAL' && (
          <Field label="Equipe infratora" id="offending-team">
            <Combobox
              id="offending-team"
              options={[
                { value: '', label: '— selecione —' },
                { value: String(match.homeTeam.tournamentTeamId), label: match.homeTeam.teamName },
                { value: String(match.awayTeam.tournamentTeamId), label: match.awayTeam.teamName },
              ]}
              value={offendingTournamentTeamId === null
                ? null
                : String(offendingTournamentTeamId)}
              onChange={(next) => setOffendingTournamentTeamId(parsePositiveId(next))}
            />
          </Field>
        )}

        {resultType === 'FORFEIT' && (
          <p className={s.modeNotice}>
            O sistema atribuirá o resultado regulamentar à equipe não infratora e limpará
            períodos, estatísticas e MVP anteriores.
          </p>
        )}
      </section>

      <header className={s.scoreHeader}>
        <span className={s.scoreLabel}>Placar de quadra</span>
        <div className={s.teamScore}>
          <span className={s.teamName}>{match.homeTeam.teamName}</span>
          <span className={s.score} data-testid="home-score">{totals.home}</span>
        </div>
        <span className={s.scoreSep}>×</span>
        <div className={s.teamScore}>
          <span className={s.score} data-testid="away-score">{totals.away}</span>
          <span className={s.teamName}>{match.awayTeam.teamName}</span>
        </div>
      </header>

      {!isForfeit && (
        <>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Placar por período</h2>
            <PeriodScoreEditor
              periods={state.periods}
              homeName={match.homeTeam.teamName}
              awayName={match.awayTeam.teamName}
              onChange={(index, side, value) =>
                dispatch({ type: 'setPeriod', index, side, value })}
              onAddOvertime={() => dispatch({ type: 'addOvertime' })}
              onRemoveOvertime={() => dispatch({ type: 'removeOvertime' })}
            />
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Estatísticas</h2>
            <Tabs
              tabs={[
                { id: String(match.homeTeam.tournamentTeamId), label: match.homeTeam.teamName },
                { id: String(match.awayTeam.tournamentTeamId), label: match.awayTeam.teamName },
              ]}
              activeTab={String(activeTeamId)}
              onChange={(raw) => {
                const next = parsePositiveId(raw)
                if (next !== null) setActiveTeamId(next)
              }}
              variant="line"
            />
            <StatColumnsConfig
              disabledColumns={state.disabledColumns}
              groupHasData={(fields) => columnHasData(state, fields)}
              onToggle={(fields, enabled) =>
                dispatch({ type: 'setColumnEnabled', fields, enabled })}
            />
            <BoxScoreTable
              roster={activeRoster}
              lines={state.lines}
              disabledColumns={state.disabledColumns}
              onStatChange={(tournamentRosterId, field, value) =>
                dispatch({ type: 'setStat', tournamentRosterId, field, value })}
            />
          </section>

          <section className={s.section}>
            <MvpSelect
              candidates={mvpCandidates}
              value={state.mvpTournamentRosterId}
              onChange={(tournamentRosterId) =>
                dispatch({ type: 'setMvp', tournamentRosterId })}
            />
          </section>
        </>
      )}

      {!isForfeit && pointWarnings.length > 0 && (
        <div className={s.warning} role="status" aria-label="Conferência de pontos">
          <ul className={s.warningList}>
            {pointWarnings.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </div>
      )}

      {feedback?.type === 'success' && (
        <p className={s.success} role="status">{feedback.message}</p>
      )}
      {feedback?.type === 'error' && (
        <p className={s.error} role="alert">{feedback.message}</p>
      )}

      <footer className={s.footer}>
        {!isForfeit && (
          <Button
            type="button"
            variant="ghost"
            loading={draftMutation.isPending}
            disabled={writePending}
            onClick={() => void handleDraft()}
          >
            Salvar rascunho
          </Button>
        )}
        {!confirming ? (
          <Button
            type="button"
            variant="primary"
            disabled={writePending}
            onClick={requestResultConfirmation}
          >
            Finalizar partida
          </Button>
        ) : (
          <div className={s.confirm} role="alertdialog" aria-label="Confirmar resultado">
            <span className={s.confirmText}>
              {resultType === 'FORFEIT'
                ? 'Confirmar resultado por W.O.? Os dados jogados anteriores serão limpos.'
                : resultType === 'DEFAULT'
                  ? 'Confirmar resultado por abandono?'
                  : 'Confirmar o encerramento da partida?'}
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={writePending}
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              autoFocus
              loading={resultMutation.isPending}
              disabled={writePending}
              onClick={() => void handleResult()}
            >
              Confirmar
            </Button>
          </div>
        )}
      </footer>
    </main>
  )
}
