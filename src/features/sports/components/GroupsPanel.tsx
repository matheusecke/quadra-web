import { useId, useState } from 'react'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Button } from '../../../components/ui/Button/Button'
import { Field } from '../../../components/ui/Field/Field'
import { Input } from '../../../components/ui/Input/Input'
import s from './GroupsPanel.module.css'

export interface GroupOption {
  id: string
  name: string
}

export interface GroupsTeamOption {
  id: string
  name: string
}

export interface GroupsPanelProps {
  groups: GroupOption[]
  enrolledTeams: GroupsTeamOption[]
  assignedTeamIds: string[]
  onCreateGroup: (name: string) => Promise<void>
  onAssign: (groupId: string, teamId: string) => Promise<void>
  errorMessage?: string
}

export function GroupsPanel({ groups, enrolledTeams, assignedTeamIds, onCreateGroup, onAssign, errorMessage }: GroupsPanelProps) {
  const nameFieldId = useId()
  const groupFieldId = useId()
  const teamFieldId = useId()

  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const [groupId, setGroupId] = useState('')
  const [teamId, setTeamId] = useState('')
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
    if (!groupId || !teamId) return
    setAssigning(true)
    try {
      await onAssign(groupId, teamId)
      setGroupId('')
      setTeamId('')
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
            <select
              id={groupFieldId}
              className={s.select}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={groups.length === 0}
            >
              <option value="" disabled>Selecione um grupo…</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className={s.fieldGroup}>
          <Field label="Equipe" id={teamFieldId}>
            <select
              id={teamFieldId}
              className={s.select}
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={unassigned.length === 0}
            >
              <option value="" disabled>Selecione uma equipe…</option>
              {unassigned.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleAssign} loading={assigning} disabled={!groupId || !teamId}>
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
