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

export interface GroupMemberRow {
  /** TournamentGroupTeam id — what DELETE /tournament-group-teams/:id takes. */
  id: number
  tournamentGroupId: number
  name: string
}

export interface GroupsPanelProps {
  groups: GroupOption[]
  members: GroupMemberRow[]
  enrolledTeams: GroupsTeamOption[]
  canManage: boolean
  onCreateGroup: (name: string) => Promise<void>
  onRenameGroup: (id: number, name: string) => Promise<void>
  onRemoveGroup: (id: number) => Promise<void>
  onAssign: (tournamentGroupId: number, tournamentTeamId: number) => Promise<void>
  onRemoveMember: (id: number) => Promise<void>
  errorMessage?: string
}

export function GroupsPanel({
  groups,
  members,
  enrolledTeams,
  canManage,
  onCreateGroup,
  onRenameGroup,
  onRemoveGroup,
  onAssign,
  onRemoveMember,
  errorMessage,
}: GroupsPanelProps) {
  const nameFieldId = useId()
  const groupFieldId = useId()
  const teamFieldId = useId()
  const renameFieldId = useId()

  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const [groupId, setGroupId] = useState<number | null>(null)
  const [tournamentTeamId, setTournamentTeamId] = useState<number | null>(null)
  const [assigning, setAssigning] = useState(false)

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [renamingGroupId, setRenamingGroupId] = useState<number | null>(null)
  const [removingGroupId, setRemovingGroupId] = useState<number | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)

  const unassigned = enrolledTeams.filter((team) => !members.some((member) => member.name === team.name))

  const handleCreateGroup = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    try {
      await onCreateGroup(trimmed)
      setName('')
    } catch {
      // the caller surfaces the failure via errorMessage; keep the current draft
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
    } catch {
      // the caller surfaces the failure via errorMessage; keep the current selection
    } finally {
      setAssigning(false)
    }
  }

  const startEditing = (group: GroupOption) => {
    setEditingGroupId(group.id)
    setDraftName(group.name)
  }

  const handleRename = async () => {
    const trimmed = draftName.trim()
    if (editingGroupId == null || !trimmed) return
    setRenamingGroupId(editingGroupId)
    try {
      await onRenameGroup(editingGroupId, trimmed)
      setEditingGroupId(null)
    } catch {
      // the caller surfaces the failure via errorMessage; keep the row in edit mode
    } finally {
      setRenamingGroupId(null)
    }
  }

  const handleRemoveGroup = async (id: number) => {
    setRemovingGroupId(id)
    try {
      await onRemoveGroup(id)
    } catch {
      // the caller surfaces the failure via errorMessage
    } finally {
      setRemovingGroupId(null)
    }
  }

  const handleRemoveMember = async (member: GroupMemberRow) => {
    setRemovingMemberId(member.id)
    try {
      await onRemoveMember(member.id)
    } catch {
      // the caller surfaces the failure via errorMessage; keep the row in place
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <div className={s.panel}>
      {canManage && (
        <>
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
        </>
      )}

      {unassigned.length > 0 && (
        <Badge variant="warning">
          {unassigned.length === 1
            ? '1 equipe inscrita ainda não está em nenhum grupo.'
            : `${unassigned.length} equipes inscritas ainda não estão em nenhum grupo.`}
        </Badge>
      )}

      <div className={s.groupList}>
        {groups.map((group) => {
          const groupMembers = members.filter((member) => member.tournamentGroupId === group.id)
          const isEditing = editingGroupId === group.id

          return (
            <section key={group.id} className={s.group} role="group" aria-label={group.name}>
              <div className={s.groupHeader}>
                {isEditing ? (
                  <div className={`${s.field} ${s.renameField}`}>
                    <label className={s.label} htmlFor={renameFieldId}>{`Nome do grupo ${group.name}`}</label>
                    <Input id={renameFieldId} value={draftName} onChange={(e) => setDraftName(e.target.value)} fullWidth />
                  </div>
                ) : (
                  <h3 className={s.groupName}>{group.name}</h3>
                )}

                {canManage && (
                  <div className={s.groupActions}>
                    {isEditing ? (
                      <>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingGroupId(null)}>Cancelar</Button>
                        <Button type="button" size="sm" onClick={handleRename} loading={renamingGroupId === group.id} disabled={!draftName.trim()}>Salvar</Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="ghost" size="sm" onClick={() => startEditing(group)}>Renomear</Button>
                        {groupMembers.length === 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Excluir grupo ${group.name}`}
                            loading={removingGroupId === group.id}
                            onClick={() => handleRemoveGroup(group.id)}
                          >
                            Excluir grupo
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {groupMembers.length > 0 ? (
                <ul className={s.memberList}>
                  {groupMembers.map((member) => (
                    <li key={member.id} className={s.memberRow}>
                      <span>{member.name}</span>
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remover ${member.name} do grupo`}
                          loading={removingMemberId === member.id}
                          onClick={() => handleRemoveMember(member)}
                        >
                          Remover
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.emptyGroup}>Nenhuma equipe neste grupo.</p>
              )}
            </section>
          )
        })}
      </div>

      {errorMessage && <p className={s.error} role="alert">{errorMessage}</p>}
    </div>
  )
}
