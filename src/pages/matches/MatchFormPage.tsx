import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { DateTimeField } from '../../components/ui/DateTimeField/DateTimeField'
import { Field } from '../../components/ui/Field/Field'
import { getTeams } from '../../features/sports/mock-sports-data'
import { useGroupsQuery, useScheduleMatch, useTournamentsQuery } from '../../features/sports/queries'
import { teamMap } from '../../features/sports/sportsUtils'
import s from './MatchFormPage.module.css'

export function MatchFormPage() {
  const navigate = useNavigate()
  const { tournamentId: lockedTournamentId } = useParams<{ tournamentId: string }>()
  const { data: tournaments } = useTournamentsQuery()
  const scheduleMatch = useScheduleMatch()
  const teams = useMemo(() => teamMap(getTeams()), [])

  const [tournamentId, setTournamentId] = useState(lockedTournamentId ?? '')
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [venue, setVenue] = useState('')
  const [error, setError] = useState('')

  const selectedTournament = tournaments?.find((t) => t.id === tournamentId)
  const hasGroupStage =
    selectedTournament?.format === 'GROUP_STAGE' || selectedTournament?.format === 'GROUP_STAGE_KNOCKOUT'
  const { data: groups } = useGroupsQuery(hasGroupStage ? tournamentId : undefined)

  const teamOptions = useMemo(() => {
    const tournament = tournaments?.find((t) => t.id === tournamentId)
    return (tournament?.teamIds ?? []).map((id) => ({ id, name: teams.get(id)?.name ?? id }))
  }, [tournaments, tournamentId, teams])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
      setError('Uma equipe não pode enfrentar a si mesma.')
      return
    }
    if (!tournamentId || !homeTeamId || !awayTeamId || !scheduledAt) {
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
        groupId: groupId || null,
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
            options={(tournaments ?? []).map((tournament) => ({ value: tournament.id, label: tournament.name }))}
            value={tournamentId || null}
            placeholder="Selecione o campeonato…"
            disabled={Boolean(lockedTournamentId)}
            onChange={(value) => {
              setTournamentId(value)
              setHomeTeamId('')
              setAwayTeamId('')
              setGroupId('')
            }}
          />
        </Field>

        <div className={s.teams}>
          <Field label="Mandante" id="match-home">
            <Combobox id="match-home" options={teamOptions.map((team) => ({ value: team.id, label: team.name }))} value={homeTeamId || null} onChange={setHomeTeamId} placeholder="Selecione…" />
          </Field>
          <Field label="Visitante" id="match-away">
            <Combobox id="match-away" options={teamOptions.map((team) => ({ value: team.id, label: team.name }))} value={awayTeamId || null} onChange={setAwayTeamId} placeholder="Selecione…" />
          </Field>
        </div>

        {hasGroupStage && (
          <Field label="Grupo" id="match-group" hint="Só os jogos de grupo entram na classificação do grupo.">
            <Combobox id="match-group" options={[{ value: '', label: '— sem grupo —' }, ...(groups ?? []).map((group) => ({ value: group.id, label: group.name }))]} value={groupId || null} onChange={setGroupId} />
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
