import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { Field } from '../../components/ui/Field/Field'
import { getTeams } from '../../features/sports/mock-sports-data'
import { useScheduleMatch, useTournamentsQuery } from '../../features/sports/queries'
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
  const [scheduledAt, setScheduledAt] = useState('')
  const [venue, setVenue] = useState('')
  const [phaseLabel, setPhaseLabel] = useState('')
  const [error, setError] = useState('')

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
    const created = await scheduleMatch.mutateAsync({
      tournamentId,
      homeTeamId,
      awayTeamId,
      scheduledAt,
      venue: venue || undefined,
      phaseLabel: phaseLabel || undefined,
    })
    navigate(`/matches/${created.id}`)
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>Esportivo</p>
        <h1 className={s.title}>Nova partida</h1>
      </header>

      <form className={s.form} onSubmit={handleSubmit}>
        <Field label="Campeonato" id="match-tournament">
          <select
            id="match-tournament"
            className={s.select}
            value={tournamentId}
            disabled={Boolean(lockedTournamentId)}
            onChange={(e) => {
              setTournamentId(e.target.value)
              setHomeTeamId('')
              setAwayTeamId('')
            }}
          >
            <option value="" disabled>Selecione o campeonato…</option>
            {(tournaments ?? []).map((tournament) => (
              <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
            ))}
          </select>
        </Field>

        <div className={s.teams}>
          <Field label="Mandante" id="match-home">
            <select id="match-home" className={s.select} value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)}>
              <option value="" disabled>Selecione…</option>
              {teamOptions.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Visitante" id="match-away">
            <select id="match-away" className={s.select} value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)}>
              <option value="" disabled>Selecione…</option>
              {teamOptions.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Data e hora"
          inputProps={{ type: 'datetime-local', value: scheduledAt, onChange: (e) => setScheduledAt(e.target.value) }}
        />
        <Field
          label="Local"
          inputProps={{ value: venue, onChange: (e) => setVenue(e.target.value), placeholder: 'Ginásio (opcional)' }}
        />
        <Field
          label="Fase"
          inputProps={{ value: phaseLabel, onChange: (e) => setPhaseLabel(e.target.value), placeholder: 'Fase de grupos (opcional)' }}
        />

        {error && <p className={s.error} role="alert">{error}</p>}

        <div className={s.actions}>
          <Button type="button" variant="ghost" onClick={() => navigate('/matches')}>
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
