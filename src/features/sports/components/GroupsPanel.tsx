import { useId, useState } from 'react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Button } from '../../../components/ui/Button/Button'
import { Combobox } from '../../../components/ui/Combobox/Combobox'
import { Field } from '../../../components/ui/Field/Field'
import { Input } from '../../../components/ui/Input/Input'
import { parsePositiveId } from '../parsePositiveId'
import s from './GroupsPanel.module.css'

export interface GroupOption {
  id: number
  name: string
}

export interface GroupsTeamOption {
  id: number
  name: string
}

export interface GroupsPanelProps {
  groups: GroupOption[]
  enrolledTeams: GroupsTeamOption[]
  assignedTeamIds: number[]
  onCreateGroup: (name: string) => Promise<void>
  onAssign: (groupId: number, tournamentTeamId: number) => Promise<void>
  errorMessage?: string
}

export function GroupsPanel({ groups, enrolledTeams, assignedTeamIds, onCreateGroup, onAssign, errorMessage }: GroupsPanelProps) {
  const nameFieldId = useId()
  const groupFieldId = useId()
  const teamFieldId = useId()

  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const [groupId, setGroupId] = useState<number | null>(null)
  const [tournamentTeamId, setTournamentTeamId] = useState<number | null>(null)
  const [assigning, setAssigning] = useState(false)

  const unassigned = enrolledTeams.filter((team) => !assignedTeamIds.includes(team.id))

  const handleCreateGroup = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    try {
      await onCreateGroup(trimmed)
      setName('')
    } finally {
      setCreating(false)
    }
  }

  const handleAssign = async () => {
    if (groupId == null || tournamentTeamId == null) return
    setAssigning(true)
    try {
      await onAssign(groupId, tournamentTeamId)
      setGroupId(null)
      setTournamentTeamId(null)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className={s.panel}>
      <div className={s.row}>
        <div className={s.fieldGroup}>
          <Field label="Nome do grupo" id={nameFieldId}>
            <Input
              id={nameFieldId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          </Field>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleCreateGroup} loading={creating} disabled={!name.trim()}>
          Criar grupo
        </Button>
      </div>

      <hr className={s.divider} />

      <div className={s.row}>
        <div className={s.fieldGroup}>
          <Field label="Grupo" id={groupFieldId}>
            <Combobox
              id={groupFieldId}
              options={groups.map((group) => ({ value: String(group.id), label: group.name }))}
              value={groupId == null ? null : String(groupId)}
              onChange={(raw) => setGroupId(parsePositiveId(raw))}
              placeholder="Selecione um grupo…"
              disabled={groups.length === 0}
            />
          </Field>
        </div>
        <div className={s.fieldGroup}>
          <Field label="Equipe" id={teamFieldId}>
            <Combobox
              id={teamFieldId}
              options={unassigned.map((team) => ({ value: String(team.id), label: team.name }))}
              value={tournamentTeamId == null ? null : String(tournamentTeamId)}
              onChange={(raw) => setTournamentTeamId(parsePositiveId(raw))}
              placeholder="Selecione uma equipe…"
              disabled={unassigned.length === 0}
            />
          </Field>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleAssign} loading={assigning} disabled={groupId == null || tournamentTeamId == null}>
          Adicionar ao grupo
        </Button>
      </div>

      {unassigned.length > 0 && (
        <Badge variant="warning">
          {unassigned.length === 1
            ? '1 equipe inscrita ainda não está em nenhum grupo.'
            : `${unassigned.length} equipes inscritas ainda não estão em nenhum grupo.`}
        </Badge>
      )}

      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}
