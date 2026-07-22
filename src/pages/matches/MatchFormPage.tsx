import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { DateTimeField } from '../../components/ui/DateTimeField/DateTimeField'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Field } from '../../components/ui/Field/Field'
import { getTeams } from '../../features/sports/mock-sports-data'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { useGroupsQuery, useScheduleMatch, useTournamentsQuery } from '../../features/sports/queries'
import { teamMap } from '../../features/sports/sportsUtils'
import s from './MatchFormPage.module.css'

export function MatchFormPage() {
  const navigate = useNavigate()
  const { tournamentId: rawLockedTournamentId } = useParams<{ tournamentId: string }>()
  const lockedTournamentId = parsePositiveId(rawLockedTournamentId)
  const { data: tournaments } = useTournamentsQuery()
  const scheduleMatch = useScheduleMatch()
  const teams = useMemo(() => teamMap(getTeams()), [])

  const [tournamentId, setTournamentId] = useState<number | null>(lockedTournamentId)
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null)
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null)
  const [groupId, setGroupId] = useState<number | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [venue, setVenue] = useState('')
  const [error, setError] = useState('')

  const selectedTournament = tournaments?.find((t) => t.id === tournamentId)
  const hasGroupStage =
    selectedTournament?.format === 'GROUP_STAGE' || selectedTournament?.format === 'GROUP_STAGE_KNOCKOUT'
  const { data: groups } = useGroupsQuery(hasGroupStage ? tournamentId ?? undefined : undefined)

  const teamOptions = useMemo(() => {
    const tournament = tournaments?.find((t) => t.id === tournamentId)
    return (tournament?.teamIds ?? []).map((id) => ({ id, name: teams.get(id)?.name ?? String(id) }))
  }, [tournaments, tournamentId, teams])

  if (rawLockedTournamentId != null && lockedTournamentId == null) {
    return <ErrorState title="ID de campeonato inválido." />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (homeTeamId != null && awayTeamId != null && homeTeamId === awayTeamId) {
      setError('Uma equipe não pode enfrentar a si mesma.')
      return
    }
    if (tournamentId == null || homeTeamId == null || awayTeamId == null || !scheduledAt) {
      setError('Preencha campeonato, mandante, visitante e data/hora.')
      return
    }
    setError('')
    try {
      const created = await scheduleMatch.mutateAsync({
        tournamentId,
        homeTeamId,
        awayTeamId,
        scheduledAt,
        venue: venue || undefined,
        groupId: groupId ?? null,
      })
      navigate(`/matches/${created.id}`)
    } catch {
      setError(
        groupId
          ? 'As duas equipes precisam estar no grupo escolhido. Deixe "sem grupo" para um jogo de mata-mata.'
          : 'Não foi possível agendar a partida. Tente novamente.',
      )
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>Esportivo</p>
        <h1 className={s.title}>Nova partida</h1>
      </header>

      <form className={s.form} onSubmit={handleSubmit}>
        <Field label="Campeonato" id="match-tournament">
          <Combobox
            id="match-tournament"
            options={(tournaments ?? []).map((tournament) => ({ value: String(tournament.id), label: tournament.name }))}
            value={tournamentId == null ? null : String(tournamentId)}
            placeholder="Selecione o campeonato…"
            disabled={lockedTournamentId != null}
            onChange={(raw) => {
              setTournamentId(parsePositiveId(raw))
              setHomeTeamId(null)
              setAwayTeamId(null)
              setGroupId(null)
            }}
          />
        </Field>

        <div className={s.teams}>
          <Field label="Mandante" id="match-home">
            <Combobox id="match-home" options={teamOptions.map((team) => ({ value: String(team.id), label: team.name }))} value={homeTeamId == null ? null : String(homeTeamId)} onChange={(raw) => setHomeTeamId(parsePositiveId(raw))} placeholder="Selecione…" />
          </Field>
          <Field label="Visitante" id="match-away">
            <Combobox id="match-away" options={teamOptions.map((team) => ({ value: String(team.id), label: team.name }))} value={awayTeamId == null ? null : String(awayTeamId)} onChange={(raw) => setAwayTeamId(parsePositiveId(raw))} placeholder="Selecione…" />
          </Field>
        </div>

        {hasGroupStage && (
          <Field label="Grupo" id="match-group" hint="Só os jogos de grupo entram na classificação do grupo.">
            <Combobox id="match-group" options={[{ value: '', label: '— sem grupo —' }, ...(groups ?? []).map((group) => ({ value: String(group.id), label: group.name }))]} value={groupId == null ? null : String(groupId)} onChange={(raw) => setGroupId(parsePositiveId(raw))} />
          </Field>
        )}

        <Field label="Data e hora" id="match-date">
          <DateTimeField id="match-date" type="datetime-local" value={scheduledAt} onChange={setScheduledAt} />
        </Field>
        <Field
          label="Local"
          inputProps={{ value: venue, onChange: (e) => setVenue(e.target.value), placeholder: 'Ginásio (opcional)' }}
        />

        {error && <p className={s.error} role="alert">{error}</p>}

        <div className={s.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              navigate(lockedTournamentId ? `/tournaments/${lockedTournamentId}?tab=matches` : '/matches')
            }
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={scheduleMatch.isPending}>
            Agendar partida
          </Button>
        </div>
      </form>
    </div>
  )
}
