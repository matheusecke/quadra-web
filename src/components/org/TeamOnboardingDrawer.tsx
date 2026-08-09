import { useEffect, useRef, useState } from 'react'
import { Drawer } from '../admin/Drawer'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { SearchSelect } from '../ui/SearchSelect/SearchSelect'
import type { SearchSelectOption } from '../ui/SearchSelect/SearchSelect'
import { Tabs } from '../ui/Tabs/Tabs'
import { UserLookupField } from './UserLookupField'
import { orgWriteErrorMessage } from '../../features/org/orgWriteErrorMessage'
import { useOrgMutation } from '../../features/org/queries'
import { createTeamOnboarding, listTeamAffiliationCandidates } from '../../services/orgApi'
import type { CreateTeamOnboardingInput, UserLookupResult } from '../../types/org'
import s from './orgForm.module.css'

const BRANCH_TABS = [
  { id: 'existing', label: 'Equipe existente' },
  { id: 'new', label: 'Criar nova' },
]

type TeamOnboardingDrawerProps = {
  open: boolean
  onClose: () => void
  fixedTeam?: { id: number; name: string }
}

const searchTeams = (q: string): Promise<SearchSelectOption[]> =>
  listTeamAffiliationCandidates({ q }).then((page) =>
    page.data.map((candidate) => ({
      id: candidate.id,
      label: candidate.name,
      secondary:
        candidate.affiliation?.status === 'INACTIVE'
          ? `${candidate.shortName} · inativa nesta organização`
          : candidate.shortName,
    })),
  )

export function TeamOnboardingDrawer({ open, onClose, fixedTeam }: TeamOnboardingDrawerProps) {
  const [branch, setBranch] = useState('existing')
  const [team, setTeam] = useState<SearchSelectOption | null>(null)
  const [teamName, setTeamName] = useState('')
  const [admin, setAdmin] = useState<UserLookupResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  const mutation = useOrgMutation((input: CreateTeamOnboardingInput) => createTeamOnboarding(input))

  const isNewTeam = !fixedTeam && branch === 'new'
  const submitLabel = fixedTeam ? 'Convidar administrador' : 'Adicionar equipe'
  const hasTeam = Boolean(fixedTeam) || (isNewTeam ? teamName.trim() !== '' : team !== null)
  const canSubmit = hasTeam && admin !== null

  useEffect(() => {
    if (errorMessage) errorRef.current?.focus()
  }, [errorMessage])

  const close = () => {
    setBranch('existing')
    setTeam(null)
    setTeamName('')
    setAdmin(null)
    setErrorMessage(null)
    onClose()
  }

  const buildInput = (adminUserId: number): CreateTeamOnboardingInput => {
    if (fixedTeam) return { teamId: fixedTeam.id, adminUserId }
    if (isNewTeam) return { teamName: teamName.trim(), adminUserId }
    return { teamId: (team as SearchSelectOption).id, adminUserId }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit || !admin) return
    setErrorMessage(null)
    mutation.mutate(buildInput(admin.id), {
      onSuccess: close,
      onError: (error) => setErrorMessage(orgWriteErrorMessage(error, 'teamOnboarding')),
    })
  }

  return (
    <Drawer open={open} onClose={close} title={fixedTeam ? 'Convidar administrador' : 'Adicionar equipe'}>
      <form className={s.form} onSubmit={handleSubmit}>
        {fixedTeam ? (
          <p className={s.hint}>Equipe: {fixedTeam.name}</p>
        ) : (
          <>
            <Tabs tabs={BRANCH_TABS} activeTab={branch} onChange={setBranch} variant="pill" />
            {isNewTeam ? (
              <Field
                label="Nome da equipe"
                id="onboarding-team-name"
                inputProps={{
                  id: 'onboarding-team-name',
                  value: teamName,
                  onChange: (event) => setTeamName(event.target.value),
                  disabled: mutation.isPending,
                }}
              />
            ) : (
              <Field label="Equipe" id="onboarding-team">
                <SearchSelect
                  id="onboarding-team"
                  value={team}
                  onChange={setTeam}
                  onSearch={searchTeams}
                  placeholder="Buscar equipe..."
                  disabled={mutation.isPending}
                />
              </Field>
            )}
          </>
        )}
        <UserLookupField value={admin} onChange={setAdmin} disabled={mutation.isPending} />
        {errorMessage && (
          <p ref={errorRef} className={s.error} role="alert" tabIndex={-1}>
            {errorMessage}
          </p>
        )}
        <div className={s.actions}>
          <Button type="button" variant="ghost" onClick={close} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit || mutation.isPending} loading={mutation.isPending}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
