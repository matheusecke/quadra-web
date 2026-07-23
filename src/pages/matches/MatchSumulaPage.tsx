import { useCallback, useMemo, useReducer, useState } from 'react'
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
import { BoxScoreTable } from '../../features/sports/components/BoxScoreTable'
import { MvpSelect } from '../../features/sports/components/MvpSelect'
import { PeriodScoreEditor } from '../../features/sports/components/PeriodScoreEditor'
import { StatColumnsConfig } from '../../features/sports/components/StatColumnsConfig'
import { boxScoreReducer, columnHasData, initBoxScoreState, teamTotalPoints } from '../../features/sports/boxScore.reducer'
import { useAthletesQuery, useMatchDetailQuery, useRosterQuery, useSubmitMatchResult, useTeamsQuery, useTournamentTeamsQuery } from '../../features/sports/queries'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { isScoreConsistent, periodsSum } from '../../features/sports/statistics'
import type { PlayerStatInput } from '../../features/sports/statistics'
import { teamMap, tournamentTeamMap } from '../../features/sports/sportsUtils'
import type { Athlete, MatchDetail, Team } from '../../features/sports/types'
import type { PlayerBoxScoreInput, SubmitMatchResultInput } from '../../services/sportsApi/types'
import s from './MatchSumulaPage.module.css'

export function MatchSumulaPage() {
  const { matchId: rawMatchId } = useParams<{ matchId: string }>()
  const matchId = parsePositiveId(rawMatchId)
  const { data: match, isPending, isError, refetch } = useMatchDetailQuery(matchId ?? undefined)
  const teamsQuery = useTeamsQuery()
  const athletesQuery = useAthletesQuery()

  if (matchId == null) {
    return (
      <div className={s.page}>
        <ErrorState title="ID de partida inválido." />
      </div>
    )
  }
  if (isPending || teamsQuery.isPending || athletesQuery.isPending) {
    return (
      <div className={s.page}>
        <Skeleton height={40} />
        <Skeleton height={200} />
      </div>
    )
  }
  if (isError || teamsQuery.isError || athletesQuery.isError) {
    return (
      <div className={s.page}>
        <ErrorState title="Não foi possível carregar a partida." onRetry={() => { refetch(); teamsQuery.refetch(); athletesQuery.refetch() }} />
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
  return <SumulaEditor match={match} teams={teamsQuery.data ?? []} athletes={athletesQuery.data ?? []} />
}

function SumulaEditor({ match, teams, athletes: athleteList }: { match: MatchDetail; teams: Team[]; athletes: Athlete[] }) {
  const { data: homeRoster, isPending: isHomeRosterPending } = useRosterQuery(match.tournamentId, match.homeTournamentTeamId)
  const { data: awayRoster, isPending: isAwayRosterPending } = useRosterQuery(match.tournamentId, match.awayTournamentTeamId)
  const athletes = useMemo(() => new Map(athleteList.map((athlete) => [athlete.id, athlete])), [athleteList])

  if (isHomeRosterPending || isAwayRosterPending) {
    return <div className={s.page}><Skeleton height={200} /></div>
  }

  const mapRoster = (roster: typeof homeRoster) =>
    (roster ?? []).flatMap((entry) => {
      const athlete = athletes.get(entry.athleteId)
      return athlete ? [{ tournamentRosterId: entry.id, name: athlete.name, number: entry.jerseyNumber }] : []
    })

  return (
    <SumulaForm
      key={`${match.id}-${homeRoster?.length ?? 0}-${awayRoster?.length ?? 0}`}
      match={match}
      teams={teams}
      homeRoster={mapRoster(homeRoster)}
      awayRoster={mapRoster(awayRoster)}
    />
  )
}

interface SumulaRosterEntry {
  tournamentRosterId: number
  name: string
  number: number
}

interface SumulaFormProps {
  match: MatchDetail
  teams: Team[]
  homeRoster: SumulaRosterEntry[]
  awayRoster: SumulaRosterEntry[]
}

function SumulaForm({ match, teams, homeRoster, awayRoster }: SumulaFormProps) {
  const navigate = useNavigate()
  const submit = useSubmitMatchResult()
  const teamsById = useMemo(() => teamMap(teams), [teams])
  const { data: tournamentTeamsData } = useTournamentTeamsQuery(match.tournamentId)
  const tournamentTeams = useMemo(
    () => tournamentTeamMap(tournamentTeamsData ?? [], teamsById),
    [tournamentTeamsData, teamsById],
  )

  const homeIds = useMemo(() => homeRoster.map((r) => r.tournamentRosterId), [homeRoster])
  const awayIds = useMemo(() => awayRoster.map((r) => r.tournamentRosterId), [awayRoster])
  const initialLines = useMemo<Record<number, PlayerStatInput>>(
    () => Object.fromEntries(
      [...match.homeStats.players, ...match.awayStats.players].map((player) => [
        player.tournamentRosterId,
        {
          minutesSeconds: player.minutesSeconds,
          pts: player.pts,
          reb: player.reb,
          ast: player.ast,
          stl: player.stl,
          blk: player.blk,
          tov: player.tov,
          pf: player.pf,
          fgm: player.fgm,
          fga: player.fga,
          threeFgm: player.threeFgm,
          threeFga: player.threeFga,
          ftm: player.ftm,
          fta: player.fta,
        } satisfies PlayerStatInput,
      ]),
    ),
    [match.awayStats.players, match.homeStats.players],
  )

  const [state, dispatch] = useReducer(
    boxScoreReducer,
    {
      tournamentRosterIds: [...homeIds, ...awayIds],
      regularPeriods: 4,
      mvpTournamentRosterId: match.mvp?.tournamentRosterId ?? null,
      initialLines,
    },
    initBoxScoreState,
  )
  const [activeTeam, setActiveTeam] = useState<number>(match.homeTournamentTeamId)
  const [confirming, setConfirming] = useState(false)
  const [resultType, setResultType] = useState<'NORMAL' | 'DEFAULT' | 'FORFEIT'>('NORMAL')
  const [offendingTournamentTeamId, setOffendingTournamentTeamId] = useState<number | null>(null)
  const handleStatChange = useCallback((tournamentRosterId: number, field: keyof PlayerStatInput, value: number | null) => {
    dispatch({ type: 'setStat', tournamentRosterId, field, value })
  }, [])

  const homeName = tournamentTeams.get(match.homeTournamentTeamId)?.name ?? 'Mandante'
  const awayName = tournamentTeams.get(match.awayTournamentTeamId)?.name ?? 'Visitante'
  const totals = periodsSum(state.periods)
  const homePts = teamTotalPoints(state, homeIds)
  const awayPts = teamTotalPoints(state, awayIds)
  const hasWarning = match.scoreSource !== 'AWARDED' && homePts !== null && awayPts !== null && (
    !isScoreConsistent(homePts, totals.home) || !isScoreConsistent(awayPts, totals.away)
  )

  const activeRoster = activeTeam === match.homeTournamentTeamId ? homeRoster : awayRoster
  const activeIds = activeTeam === match.homeTournamentTeamId ? homeIds : awayIds
  const activeLines = useMemo(
    () => Object.fromEntries(activeIds.map((id) => [id, state.lines[id]])),
    [activeIds, state.lines],
  )

  const mvpCandidates = [
    ...homeRoster.map((r) => ({ tournamentRosterId: r.tournamentRosterId, athleteId: r.tournamentRosterId, name: r.name, teamName: homeName })),
    ...awayRoster.map((r) => ({ tournamentRosterId: r.tournamentRosterId, athleteId: r.tournamentRosterId, name: r.name, teamName: awayName })),
  ]

  const isForfeit = resultType === 'FORFEIT'
  const isDefault = resultType === 'DEFAULT'
  const awardedHomeScore = offendingTournamentTeamId === match.homeTournamentTeamId ? 0 : 20
  const awardedAwayScore = offendingTournamentTeamId === match.awayTournamentTeamId ? 0 : 20

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
          <Combobox id="result-type" options={[{ value: 'NORMAL', label: 'Normal' }, { value: 'DEFAULT', label: 'Abandono' }, { value: 'FORFEIT', label: 'W.O.' }]} value={resultType} onChange={(value) => { setResultType(value as typeof resultType); setOffendingTournamentTeamId(null); setConfirming(false) }} />
        </Field>
        {resultType !== 'NORMAL' && (
          <Field label={isForfeit ? 'Equipe que não compareceu' : 'Equipe que abandonou'} id="offending-team">
            <Combobox id="offending-team" options={[{ value: '', label: '— selecione —' }, { value: String(match.homeTournamentTeamId), label: homeName }, { value: String(match.awayTournamentTeamId), label: awayName }]} value={offendingTournamentTeamId == null ? null : String(offendingTournamentTeamId)} onChange={(raw) => setOffendingTournamentTeamId(parsePositiveId(raw))} />
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
          tabs={[{ id: String(match.homeTournamentTeamId), label: homeName }, { id: String(match.awayTournamentTeamId), label: awayName }]}
          activeTab={String(activeTeam)}
          onChange={(raw) => { const id = parsePositiveId(raw); if (id != null) setActiveTeam(id) }}
          variant="line"
        />
        <StatColumnsConfig
          disabledColumns={state.disabledColumns}
          groupHasData={(fields) => columnHasData(state, fields)}
          onToggle={(fields, enabled) => dispatch({ type: 'setColumnEnabled', fields, enabled })}
        />
        <BoxScoreTable
          roster={activeRoster}
          lines={activeLines}
          disabledColumns={state.disabledColumns}
          onStatChange={handleStatChange}
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
