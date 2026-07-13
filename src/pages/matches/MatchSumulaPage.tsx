import { useMemo, useReducer, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../components/ui/Badge/Badge'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Field } from '../../components/ui/Field/Field'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { BoxScoreTable } from '../../features/sports/components/BoxScoreTable'
import { MvpSelect } from '../../features/sports/components/MvpSelect'
import { PeriodScoreEditor } from '../../features/sports/components/PeriodScoreEditor'
import { boxScoreReducer, initBoxScoreState, teamTotalPoints } from '../../features/sports/boxScore.reducer'
import { getAthletes, getTeams } from '../../features/sports/mock-sports-data'
import { useMatchDetailQuery, useRosterQuery, useSubmitMatchResult, useTournamentTeamsQuery } from '../../features/sports/queries'
import { isScoreConsistent, periodsSum } from '../../features/sports/statistics'
import { teamMap } from '../../features/sports/sportsUtils'
import type { MatchDetail } from '../../features/sports/types'
import type { PlayerBoxScoreInput, SubmitMatchResultInput } from '../../services/sportsApi/types'
import s from './MatchSumulaPage.module.css'

export function MatchSumulaPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const { data: match, isPending, isError, refetch } = useMatchDetailQuery(matchId)

  if (isPending) {
    return (
      <div className={s.page}>
        <Skeleton height={40} />
        <Skeleton height={200} />
      </div>
    )
  }
  if (isError) {
    return (
      <div className={s.page}>
        <ErrorState title="Não foi possível carregar a partida." onRetry={refetch} />
      </div>
    )
  }
  if (!match) {
    return (
      <div className={s.page}>
        <EmptyState title="Partida não encontrada." />
      </div>
    )
  }
  return <SumulaEditor match={match} />
}

function SumulaEditor({ match }: { match: MatchDetail }) {
  const { data: homeRoster, isPending: isHomeRosterPending } = useRosterQuery(match.tournamentId, match.homeTeamId)
  const { data: awayRoster, isPending: isAwayRosterPending } = useRosterQuery(match.tournamentId, match.awayTeamId)
  const { data: tournamentTeams, isPending: areTournamentTeamsPending } = useTournamentTeamsQuery(match.tournamentId)
  const athletes = useMemo(() => new Map(getAthletes().map((athlete) => [athlete.id, athlete])), [])

  if (isHomeRosterPending || isAwayRosterPending || areTournamentTeamsPending) {
    return <div className={s.page}><Skeleton height={200} /></div>
  }

  const mapRoster = (roster: typeof homeRoster) =>
    (roster ?? []).flatMap((entry) => {
      const athlete = athletes.get(entry.athleteId)
      return athlete ? [{ tournamentRosterId: entry.id, name: athlete.name, number: entry.jerseyNumber }] : []
    })

  const homeTournamentTeamId = tournamentTeams?.find((team) => team.teamId === match.homeTeamId)?.id
  const awayTournamentTeamId = tournamentTeams?.find((team) => team.teamId === match.awayTeamId)?.id

  if (!homeTournamentTeamId || !awayTournamentTeamId) {
    return <div className={s.page}><ErrorState title="Não foi possível carregar as equipes da partida." /></div>
  }

  return (
    <SumulaForm
      key={`${match.id}-${homeRoster?.length ?? 0}-${awayRoster?.length ?? 0}`}
      match={match}
      homeRoster={mapRoster(homeRoster)}
      awayRoster={mapRoster(awayRoster)}
      homeTournamentTeamId={homeTournamentTeamId}
      awayTournamentTeamId={awayTournamentTeamId}
    />
  )
}

interface SumulaRosterEntry {
  tournamentRosterId: string
  name: string
  number: number
}

interface SumulaFormProps {
  match: MatchDetail
  homeRoster: SumulaRosterEntry[]
  awayRoster: SumulaRosterEntry[]
  homeTournamentTeamId: string
  awayTournamentTeamId: string
}

function SumulaForm({ match, homeRoster, awayRoster, homeTournamentTeamId, awayTournamentTeamId }: SumulaFormProps) {
  const navigate = useNavigate()
  const submit = useSubmitMatchResult()
  const teams = useMemo(() => teamMap(getTeams()), [])

  const homeIds = homeRoster.map((r) => r.tournamentRosterId)
  const awayIds = awayRoster.map((r) => r.tournamentRosterId)

  const [state, dispatch] = useReducer(
    boxScoreReducer,
    { tournamentRosterIds: [...homeIds, ...awayIds], regularPeriods: 4 },
    initBoxScoreState,
  )
  const [activeTeam, setActiveTeam] = useState(match.homeTeamId)
  const [confirming, setConfirming] = useState(false)
  const [resultType, setResultType] = useState<'NORMAL' | 'DEFAULT' | 'FORFEIT'>('NORMAL')
  const [offendingTeamId, setOffendingTeamId] = useState('')

  const homeName = teams.get(match.homeTeamId)?.name ?? 'Mandante'
  const awayName = teams.get(match.awayTeamId)?.name ?? 'Visitante'
  const totals = periodsSum(state.periods)
  const homePts = teamTotalPoints(state, homeIds)
  const awayPts = teamTotalPoints(state, awayIds)
  const hasWarning = !isScoreConsistent(homePts, totals.home) || !isScoreConsistent(awayPts, totals.away)

  const activeRoster = activeTeam === match.homeTeamId ? homeRoster : awayRoster
  const activeIds = activeTeam === match.homeTeamId ? homeIds : awayIds
  const activeLines = Object.fromEntries(activeIds.map((id) => [id, state.lines[id]]))

  const mvpCandidates = [
    ...homeRoster.map((r) => ({ tournamentRosterId: r.tournamentRosterId, athleteId: r.tournamentRosterId, name: r.name, teamName: homeName })),
    ...awayRoster.map((r) => ({ tournamentRosterId: r.tournamentRosterId, athleteId: r.tournamentRosterId, name: r.name, teamName: awayName })),
  ]

  const isForfeit = resultType === 'FORFEIT'
  const isDefault = resultType === 'DEFAULT'
  const offendingTournamentTeamId = offendingTeamId === match.homeTeamId
    ? homeTournamentTeamId
    : offendingTeamId === match.awayTeamId
      ? awayTournamentTeamId
      : null
  const awardedHomeScore = offendingTeamId === match.homeTeamId ? 0 : 20
  const awardedAwayScore = offendingTeamId === match.awayTeamId ? 0 : 20

  const handleConfirm = async () => {
    if (resultType === 'FORFEIT') {
      if (!offendingTournamentTeamId) return
      await submit.mutateAsync({ resultType: 'FORFEIT', matchId: match.id, offendingTournamentTeamId })
      navigate(`/matches/${match.id}`)
      return
    }

    const playerStats: PlayerBoxScoreInput[] = [
      ...homeIds.map((tournamentRosterId) => ({ tournamentRosterId, ...state.lines[tournamentRosterId] })),
      ...awayIds.map((tournamentRosterId) => ({ tournamentRosterId, ...state.lines[tournamentRosterId] })),
    ]
    let input: SubmitMatchResultInput
    if (resultType === 'DEFAULT') {
      if (!offendingTournamentTeamId) return
      input = { resultType, matchId: match.id, offendingTournamentTeamId, periods: state.periods, playerStats, mvpTournamentRosterId: state.mvpTournamentRosterId }
    } else {
      input = { matchId: match.id, periods: state.periods, playerStats, mvpTournamentRosterId: state.mvpTournamentRosterId }
    }
    await submit.mutateAsync(input)
    navigate(`/matches/${match.id}`)
  }

  return (
    <div className={s.page}>
      <Link to={`/matches/${match.id}`} className={s.backLink}>
        <ArrowLeft size={13} strokeWidth={1.7} /> Voltar para a partida
      </Link>

      <header className={s.scoreHeader}>
        <span className={s.scoreLabel}>{isForfeit ? 'Placar atribuído' : 'Placar de quadra'}</span>
        <div className={s.teamScore}>
          <span className={s.teamName}>{homeName}</span>
          <span className={s.score} data-testid="home-score">{isForfeit ? awardedHomeScore : totals.home}</span>
        </div>
        <span className={s.scoreSep}>×</span>
        <div className={s.teamScore}>
          <span className={s.score} data-testid="away-score">{isForfeit ? awardedAwayScore : totals.away}</span>
          <span className={s.teamName}>{awayName}</span>
        </div>
      </header>

      <section className={s.section}>
        <Field label="Como a partida terminou?" id="result-type">
          <select id="result-type" className={s.select} value={resultType} onChange={(event) => { setResultType(event.target.value as typeof resultType); setOffendingTeamId(''); setConfirming(false) }}>
            <option value="NORMAL">Normal</option>
            <option value="DEFAULT">Abandono</option>
            <option value="FORFEIT">W.O.</option>
          </select>
        </Field>
        {resultType !== 'NORMAL' && (
          <Field label={isForfeit ? 'Equipe que não compareceu' : 'Equipe que abandonou'} id="offending-team">
            <select id="offending-team" className={s.select} value={offendingTeamId} onChange={(event) => setOffendingTeamId(event.target.value)}>
              <option value="">— selecione —</option>
              <option value={match.homeTeamId}>{homeName}</option>
              <option value={match.awayTeamId}>{awayName}</option>
            </select>
          </Field>
        )}
        {isForfeit && <Badge variant="warning">Vitória atribuída por W.O. (FIBA D.3.1)</Badge>}
        {isDefault && <Badge variant="warning">O placar oficial será atribuído pelo servidor conforme o Art. 21 da FIBA e pode diferir da soma dos períodos.</Badge>}
      </section>

      {!isForfeit && <section className={s.section}>
        <h2 className={s.sectionTitle}>Placar por período</h2>
        <PeriodScoreEditor
          periods={state.periods}
          homeName={homeName}
          awayName={awayName}
          onChange={(index, side, value) => dispatch({ type: 'setPeriod', index, side, value })}
          onAddOvertime={() => dispatch({ type: 'addOvertime' })}
          onRemoveOvertime={() => dispatch({ type: 'removeOvertime' })}
        />
      </section>}

      {!isForfeit && <section className={s.section}>
        <h2 className={s.sectionTitle}>Súmula</h2>
        <Tabs
          tabs={[{ id: match.homeTeamId, label: homeName }, { id: match.awayTeamId, label: awayName }]}
          activeTab={activeTeam}
          onChange={setActiveTeam}
          variant="line"
        />
        <BoxScoreTable
          roster={activeRoster}
          lines={activeLines}
          onStatChange={(tournamentRosterId, field, value) => dispatch({ type: 'setStat', tournamentRosterId, field, value })}
        />
      </section>}

      {!isForfeit && <section className={s.section}>
        <MvpSelect candidates={mvpCandidates} value={state.mvpTournamentRosterId} onChange={(tournamentRosterId) => dispatch({ type: 'setMvp', tournamentRosterId })} />
      </section>}

      {!isForfeit && hasWarning && (
        <Badge variant="warning">A soma de pontos não confere com o placar por período</Badge>
      )}

      <footer className={s.footer}>
        <Button type="button" variant="ghost" onClick={() => navigate(`/matches/${match.id}`)}>
          Salvar rascunho
        </Button>
        {!confirming ? (
          <Button type="button" variant="primary" onClick={() => setConfirming(true)}>
            Finalizar partida
          </Button>
        ) : (
          <div className={s.confirm}>
            <span className={s.confirmText}>
              {hasWarning ? 'Há inconsistências no placar. Finalizar mesmo assim?' : 'Confirmar o encerramento da partida?'}
            </span>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleConfirm} loading={submit.isPending}>
              Confirmar
            </Button>
          </div>
        )}
      </footer>
    </div>
  )
}
