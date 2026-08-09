import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { Combobox } from '../../components/ui/Combobox/Combobox'
import { DateTimeField } from '../../components/ui/DateTimeField/DateTimeField'
import { ErrorState } from '../../components/ui/ErrorState/ErrorState'
import { Field } from '../../components/ui/Field/Field'
import { NumberField } from '../../components/ui/NumberField/NumberField'
import { Skeleton } from '../../components/ui/Skeleton/Skeleton'
import { parsePositiveId } from '../../features/sports/parsePositiveId'
import { hasGroupStage, hasKnockout } from '../../features/sports/sportsUtils'
import {
  useBracketQuery,
  useCreateMatch,
  useGroupsQuery,
  useMatchDetailQuery,
  useTournamentQuery,
  useTournamentsQuery,
  useTournamentTeamsQuery,
  useUpdateMatch,
} from '../../features/sports/queries'
import type { MatchStatus } from '../../features/sports/types'
import { apiErrorCode, apiErrorData, apiErrorMessage } from '../../services/apiError'
import type { CreateMatchInput, UpdateMatchInput } from '../../services/sportsApi/matches'
import s from './MatchFormPage.module.css'

type EditableMatchField = keyof UpdateMatchInput

type FormState = {
  tournamentId: string
  tournamentGroupId: string
  matchNumber: number | ''
  scheduledAt: string
  venueName: string
  homeTournamentTeamId: string
  awayTournamentTeamId: string
}

const EMPTY_FORM: FormState = {
  tournamentId: '',
  tournamentGroupId: '',
  matchNumber: '',
  scheduledAt: '',
  venueName: '',
  homeTournamentTeamId: '',
  awayTournamentTeamId: '',
}

const RESCHEDULE_MESSAGE = 'Ao salvar a data e hora, a partida voltará de Adiada para Agendada.'

const toLocalDateTime = (iso: string) => {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const buildUpdateInput = (form: FormState, touched: Set<EditableMatchField>): UpdateMatchInput => {
  const input: UpdateMatchInput = {}
  if (touched.has('tournamentGroupId')) input.tournamentGroupId = form.tournamentGroupId ? Number(form.tournamentGroupId) : null
  if (touched.has('matchNumber')) input.matchNumber = form.matchNumber ? Number(form.matchNumber) : null
  if (touched.has('scheduledAt') && form.scheduledAt) input.scheduledAt = new Date(form.scheduledAt).toISOString()
  if (touched.has('venueName')) input.venueName = form.venueName.trim() || null
  if (touched.has('homeTournamentTeamId') && form.homeTournamentTeamId) input.homeTournamentTeamId = Number(form.homeTournamentTeamId)
  if (touched.has('awayTournamentTeamId') && form.awayTournamentTeamId) input.awayTournamentTeamId = Number(form.awayTournamentTeamId)
  return input
}

/** SCHEDULED/POSTPONED allow every field; LIVE drops participants/group; FINISHED/CANCELLED keep only number/venue. */
const canEditField = (status: MatchStatus, field: EditableMatchField): boolean => {
  if (field === 'matchNumber' || field === 'venueName') return true
  if (field === 'scheduledAt') return status !== 'FINISHED' && status !== 'CANCELLED'
  return status === 'SCHEDULED' || status === 'POSTPONED'
}

export function MatchFormPage() {
  const navigate = useNavigate()
  const { matchId: rawMatchId, tournamentId: rawLockedTournamentId } = useParams<{ matchId: string; tournamentId: string }>()
  const matchId = parsePositiveId(rawMatchId)
  const lockedTournamentId = parsePositiveId(rawLockedTournamentId)
  const isEdit = rawMatchId !== undefined

  const matchQuery = useMatchDetailQuery(isEdit ? matchId ?? undefined : undefined)

  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY_FORM,
    tournamentId: lockedTournamentId ? String(lockedTournamentId) : '',
  }))
  const [touched, setTouched] = useState<Set<EditableMatchField>>(new Set())
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>()
  const [confirmingReschedule, setConfirmingReschedule] = useState(false)
  const [scoresheetLocked, setScoresheetLocked] = useState(false)
  const [groupLockedByBracket, setGroupLockedByBracket] = useState(false)
  const [initializedMatchId, setInitializedMatchId] = useState<number | undefined>(undefined)

  if (isEdit && matchQuery.data && matchQuery.data.id !== initializedMatchId) {
    const m = matchQuery.data
    setInitializedMatchId(m.id)
    setForm({
      tournamentId: String(m.tournamentId),
      tournamentGroupId: m.tournamentGroupId ? String(m.tournamentGroupId) : '',
      matchNumber: m.matchNumber ?? '',
      scheduledAt: toLocalDateTime(m.scheduledAt),
      venueName: m.venueName ?? '',
      homeTournamentTeamId: String(m.homeTeam.tournamentTeamId),
      awayTournamentTeamId: String(m.awayTeam.tournamentTeamId),
    })
    setTouched(new Set())
  }

  const lookupTournamentId = isEdit ? matchQuery.data?.tournamentId : (form.tournamentId ? Number(form.tournamentId) : undefined)

  const { data: tournaments } = useTournamentsQuery()
  const tournamentQuery = useTournamentQuery(lookupTournamentId)
  const isGroupStage = tournamentQuery.data !== undefined && hasGroupStage(tournamentQuery.data.format)
  const groupsQuery = useGroupsQuery(isGroupStage ? lookupTournamentId : undefined)
  const tournamentTeamsQuery = useTournamentTeamsQuery(lookupTournamentId)
  // Only a knockout format can answer MATCH_IN_BRACKET, so nothing else needs the read.
  const hasBracket = tournamentQuery.data !== undefined && hasKnockout(tournamentQuery.data.format)
  const bracketQuery = useBracketQuery(isEdit && hasBracket ? lookupTournamentId : undefined)

  const createMutation = useCreateMatch()
  const updateMutation = useUpdateMatch()
  const pending = createMutation.isPending || updateMutation.isPending

  const teamOptions = useMemo(
    () => (tournamentTeamsQuery.data ?? []).map((entry) => ({ id: entry.id, name: entry.displayNameSnapshot })),
    [tournamentTeamsQuery.data],
  )

  if (rawLockedTournamentId != null && lockedTournamentId == null) {
    return <ErrorState title="ID de campeonato inválido." />
  }
  if (rawMatchId != null && matchId == null) {
    return <ErrorState title="ID de partida inválido." />
  }
  if (isEdit && matchQuery.isPending) {
    return (
      <div className={s.page}>
        <Skeleton width="100%" height={320} />
      </div>
    )
  }
  if (isEdit && matchQuery.isError) {
    return <ErrorState title="Não foi possível carregar a partida." onRetry={() => void matchQuery.refetch()} />
  }

  const status = matchQuery.data?.status
  const fieldEditable = (field: EditableMatchField) => !isEdit || (status !== undefined && canEditField(status, field))
  const homeAwayDisabled = pending || !fieldEditable('homeTournamentTeamId') || scoresheetLocked
  const groupDisabled = pending || !fieldEditable('tournamentGroupId') || groupLockedByBracket
  const dateDisabled = pending || !fieldEditable('scheduledAt')
  const numberVenueDisabled = pending

  const setField = <K extends EditableMatchField>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (isEdit) setTouched((prev) => new Set(prev).add(field))
  }

  const sameTeams = Boolean(form.homeTournamentTeamId) && form.homeTournamentTeamId === form.awayTournamentTeamId

  const createDisabled = pending
    || !form.tournamentId || !form.homeTournamentTeamId || !form.awayTournamentTeamId || !form.scheduledAt
    || sameTeams
  const requiredTouchedEmpty = (touched.has('scheduledAt') && !form.scheduledAt)
    || (touched.has('homeTournamentTeamId') && !form.homeTournamentTeamId)
    || (touched.has('awayTournamentTeamId') && !form.awayTournamentTeamId)
  const updateDisabled = pending || touched.size === 0 || requiredTouchedEmpty || sameTeams

  const applyScheduleError = (error: unknown) => {
    const code = apiErrorCode(error)
    const message = apiErrorMessage(error)

    if (code === 'VALIDATION_ERROR') {
      setFormError('Verifique os campos preenchidos.')
      setFieldErrors(apiErrorData(error))
      return
    }
    if (code === 'RECORD_NOT_FOUND' && message === 'Match not found') {
      setFormError('Partida não encontrada.')
      return
    }
    if (code === 'RECORD_NOT_FOUND' && message === 'Tournament not found') {
      navigate('/tournaments')
      return
    }
    if (code === 'RECORD_NOT_FOUND' && message === 'Tournament group not found') {
      void groupsQuery.refetch()
      setFormError('Selecione o grupo novamente.')
      return
    }
    if (code === 'RECORD_NOT_FOUND' && message === 'Tournament team not found') {
      void tournamentTeamsQuery.refetch()
      setFormError('Selecione a equipe novamente.')
      return
    }
    if (code === 'TOURNAMENT_NOT_MUTABLE') {
      void tournamentQuery.refetch()
      setFormError('Este campeonato não aceita novas partidas.')
      return
    }
    if (code === 'INVALID_STATUS_TRANSITION' && message === 'scheduledAt cannot be changed for a finished or cancelled match.') {
      void matchQuery.refetch()
      setFormError('A data não pode mais ser alterada neste status.')
      return
    }
    if (code === 'INVALID_STATUS_TRANSITION' && message === 'Participants and tournamentGroupId can only be changed for scheduled or postponed matches.') {
      void matchQuery.refetch()
      setFormError('Participantes e grupo não podem mais ser alterados neste status.')
      return
    }
    if (code === 'MATCH_HAS_SCORESHEET') {
      setScoresheetLocked(true)
      setFormError('Os participantes não podem ser alterados após o registro da súmula.')
      return
    }
    if (code === 'CONCURRENT_MODIFICATION') {
      void matchQuery.refetch()
      setFormError('A partida foi alterada por outra pessoa. Revise os dados e tente novamente.')
      return
    }
    if (code === 'SAME_TEAM_IN_MATCH') {
      setFormError('Selecione equipes diferentes.')
      return
    }
    if (code === 'INACTIVE_REGISTRATION') {
      void tournamentTeamsQuery.refetch()
      setFormError('Esta inscrição não está ativa. Selecione outra equipe.')
      return
    }
    if (code === 'INVALID_MATCH_ASSIGNMENT') {
      void tournamentTeamsQuery.refetch()
      setFormError('A equipe deve pertencer a este campeonato.')
      return
    }
    if (code === 'INVALID_TOURNAMENT_FORMAT') {
      void tournamentQuery.refetch()
      setForm((prev) => ({ ...prev, tournamentGroupId: '' }))
      setFormError('Este formato não possui fase de grupos.')
      return
    }
    if (code === 'INVALID_GROUP_ASSIGNMENT' && message === 'The tournament group must belong to the match tournament.') {
      void groupsQuery.refetch()
      setFormError('Selecione um grupo deste campeonato.')
      return
    }
    if (code === 'INVALID_GROUP_ASSIGNMENT' && message === 'Both match participants must belong to the selected tournament group.') {
      setFormError('As duas equipes devem pertencer ao grupo selecionado.')
      return
    }
    if (code === 'MATCH_IN_BRACKET') {
      void bracketQuery.refetch()
      void matchQuery.refetch()
      setGroupLockedByBracket(true)
      setFormError('Uma partida vinculada ao chaveamento não pode pertencer a um grupo.')
      return
    }
    if (code === 'MATCH_TEAMS_MISMATCH') {
      setFormError('Alinhe os participantes da partida aos participantes da vaga.')
      return
    }
    setFormError(isEdit ? 'Não foi possível salvar a partida.' : 'Não foi possível agendar a partida.')
  }

  const performUpdate = async () => {
    setFormError('')
    setFieldErrors(undefined)
    setConfirmingReschedule(false)
    try {
      const input = buildUpdateInput(form, touched)
      await updateMutation.mutateAsync({ id: matchId!, input })
      setTouched(new Set())
    } catch (error) {
      applyScheduleError(error)
    }
  }

  const handleUpdateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (updateDisabled) return
    if (status === 'POSTPONED' && touched.has('scheduledAt')) {
      setConfirmingReschedule(true)
      return
    }
    await performUpdate()
  }

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (createDisabled) return
    setFormError('')
    setFieldErrors(undefined)
    try {
      const input: CreateMatchInput = {
        tournamentId: Number(form.tournamentId),
        tournamentGroupId: isGroupStage ? Number(form.tournamentGroupId) || null : null,
        matchNumber: Number(form.matchNumber) || null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        venueName: form.venueName.trim() || null,
        homeTournamentTeamId: Number(form.homeTournamentTeamId),
        awayTournamentTeamId: Number(form.awayTournamentTeamId),
      }
      const created = await createMutation.mutateAsync(input)
      navigate(`/matches/${created.id}`)
    } catch (error) {
      applyScheduleError(error)
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>Esportivo</p>
        <h1 className={s.title}>{isEdit ? 'Editar partida' : 'Nova partida'}</h1>
      </header>

      <form className={s.form} onSubmit={isEdit ? handleUpdateSubmit : handleCreateSubmit}>
        <Field label="Campeonato" id="match-tournament">
          <Combobox
            id="match-tournament"
            options={
              isEdit
                ? [{ value: form.tournamentId, label: tournamentQuery.data?.name ?? '' }]
                : (tournaments ?? []).map((tournament) => ({ value: String(tournament.id), label: tournament.name }))
            }
            value={form.tournamentId || null}
            placeholder="Selecione o campeonato…"
            disabled={isEdit || lockedTournamentId != null}
            onChange={(raw) => setForm({ ...EMPTY_FORM, tournamentId: raw })}
          />
        </Field>

        <div className={s.teams}>
          <Field label="Mandante" id="match-home" error={sameTeams ? 'Selecione equipes diferentes.' : fieldErrors?.homeTournamentTeamId?.[0]}>
            <Combobox
              id="match-home"
              options={teamOptions.map((team) => ({ value: String(team.id), label: team.name }))}
              value={form.homeTournamentTeamId || null}
              onChange={(raw) => setField('homeTournamentTeamId', raw)}
              placeholder="Selecione…"
              disabled={homeAwayDisabled}
              error={sameTeams}
            />
          </Field>
          <Field label="Visitante" id="match-away" error={sameTeams ? 'Selecione equipes diferentes.' : fieldErrors?.awayTournamentTeamId?.[0]}>
            <Combobox
              id="match-away"
              options={teamOptions.map((team) => ({ value: String(team.id), label: team.name }))}
              value={form.awayTournamentTeamId || null}
              onChange={(raw) => setField('awayTournamentTeamId', raw)}
              placeholder="Selecione…"
              disabled={homeAwayDisabled}
              error={sameTeams}
            />
          </Field>
        </div>

        {isGroupStage && (
          <Field label="Grupo" id="match-group" hint="Só os jogos de grupo entram na classificação do grupo." error={fieldErrors?.tournamentGroupId?.[0]}>
            <Combobox
              id="match-group"
              options={[{ value: '', label: '— sem grupo —' }, ...(groupsQuery.data ?? []).map((group) => ({ value: String(group.id), label: group.name }))]}
              value={form.tournamentGroupId || null}
              onChange={(raw) => setField('tournamentGroupId', raw)}
              disabled={groupDisabled}
            />
          </Field>
        )}

        <Field label="Data e hora" id="match-date" error={fieldErrors?.scheduledAt?.[0]}>
          <DateTimeField id="match-date" type="datetime-local" value={form.scheduledAt} onChange={(value) => setField('scheduledAt', value)} disabled={dateDisabled} />
        </Field>

        <Field label="Número da partida" id="match-number" error={fieldErrors?.matchNumber?.[0]}>
          <NumberField id="match-number" value={form.matchNumber} onValueChange={(value) => setField('matchNumber', value)} min={1} disabled={numberVenueDisabled} />
        </Field>

        <Field
          label="Local"
          id="match-venue"
          error={fieldErrors?.venueName?.[0]}
          inputProps={{ value: form.venueName, onChange: (e) => setField('venueName', e.target.value), placeholder: 'Ginásio (opcional)', disabled: numberVenueDisabled }}
        />

        {formError && <p className={s.error} role="alert">{formError}</p>}

        {confirmingReschedule && (
          <div className={s.confirm} role="alertdialog" aria-label="Confirmar reagendamento">
            <p>{RESCHEDULE_MESSAGE}</p>
            <div className={s.confirmActions}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingReschedule(false)}>Cancelar</Button>
              <Button type="button" variant="primary" size="sm" loading={pending} onClick={() => void performUpdate()}>
                Confirmar reagendamento
              </Button>
            </div>
          </div>
        )}

        <div className={s.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              navigate(lockedTournamentId ? `/tournaments/${lockedTournamentId}?tab=matches` : isEdit && matchId ? `/matches/${matchId}` : '/matches')
            }
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={pending} disabled={isEdit ? updateDisabled : createDisabled}>
            {isEdit ? 'Salvar' : 'Agendar partida'}
          </Button>
        </div>
      </form>
    </div>
  )
}
