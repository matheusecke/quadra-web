import { useReducer, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import {
  boxScoreReducer,
  columnHasData,
  initBoxScoreState,
} from '../../features/sports/boxScore.reducer'
import { BoxScoreTable } from '../../features/sports/components/BoxScoreTable'
import { MvpSelect } from '../../features/sports/components/MvpSelect'
import { PeriodScoreEditor } from '../../features/sports/components/PeriodScoreEditor'
import { StatColumnsConfig } from '../../features/sports/components/StatColumnsConfig'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { useMatchDetailQuery, useRosterQuery } from '../../features/sports/queries'
import type { PlayerStatInput } from '../../features/sports/statistics'
import { periodsSum } from '../../features/sports/statistics'
import { MATCH_STATUS_LABELS, matchStatusVariant } from '../../features/sports/sportsUtils'
import type {
  MatchDetail,
  PlayerMatchStats,
  TournamentRoster,
} from '../../features/sports/types'
import { apiErrorCode, apiErrorMessage } from '../../services/apiError'
import s from './MatchSumulaPage.module.css'

interface ScoresheetRosterEntry {
  tournamentRosterId: number
  tournamentTeamId: number
  userId: number
  name: string
  number: number | null
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

  return <ScoresheetRosterLoader match={match} />
}

function ScoresheetRosterLoader({ match }: { match: MatchDetail }) {
  const homeRosterQuery = useRosterQuery(match.homeTeam.tournamentTeamId)
  const awayRosterQuery = useRosterQuery(match.awayTeam.tournamentTeamId)

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
    />
  )
}

function ScoresheetForm({
  match,
  homeRoster,
  awayRoster,
}: {
  match: MatchDetail
  homeRoster: ScoresheetRosterEntry[]
  awayRoster: ScoresheetRosterEntry[]
}) {
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
    </main>
  )
}
