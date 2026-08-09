import { useState } from 'react'
import { Drawer } from '../admin/Drawer'
import { Button } from '../ui/Button'
import { Combobox } from '../ui/Combobox/Combobox'
import { Field } from '../ui/Field'
import { NumberField } from '../ui/NumberField'
import { orgWriteErrorMessage } from '../../features/org/orgWriteErrorMessage'
import { useOrgMutation } from '../../features/org/queries'
import { updateMembership } from '../../services/orgApi'
import type { BasketballPosition, OrgUserAffiliation, UpdateMembershipInput } from '../../types/org'
import s from './orgForm.module.css'

const POSITION_OPTIONS = (['PG', 'SG', 'SF', 'PF', 'C'] as const).map((position) => ({
  value: position,
  label: position,
}))

type EditMembershipDrawerProps = {
  affiliation: OrgUserAffiliation
  open: boolean
  onClose: () => void
}

export function EditMembershipDrawer({ affiliation, open, onClose }: EditMembershipDrawerProps) {
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>(affiliation.jerseyNumber ?? '')
  const [position, setPosition] = useState<BasketballPosition | null>(affiliation.position)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useOrgMutation((input: UpdateMembershipInput) =>
    updateMembership(affiliation.id, input),
  )

  const isAthlete = affiliation.role === 'ATHLETE'
  const canSubmit = !isAthlete || (jerseyNumber !== '' && position !== null)

  const close = () => {
    setErrorMessage(null)
    onClose()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setErrorMessage(null)
    mutation.mutate(
      { jerseyNumber: jerseyNumber === '' ? null : jerseyNumber, position },
      {
        onSuccess: close,
        onError: (error) => setErrorMessage(orgWriteErrorMessage(error, 'updateMembership')),
      },
    )
  }

  return (
    <Drawer open={open} onClose={close} title="Editar vínculo">
      <form className={s.form} onSubmit={handleSubmit}>
        <Field label="Camisa" id="membership-jersey" required={isAthlete}>
          <NumberField
            id="membership-jersey"
            aria-label="Camisa"
            value={jerseyNumber}
            onValueChange={setJerseyNumber}
            min={0}
            max={99}
            controlLabel="camisa"
            disabled={mutation.isPending}
          />
        </Field>
        <Field label="Posição" id="membership-position" required={isAthlete}>
          <Combobox
            id="membership-position"
            aria-label="Posição"
            options={POSITION_OPTIONS}
            value={position}
            onChange={(value) => setPosition(value as BasketballPosition)}
            disabled={mutation.isPending}
          />
        </Field>
        {errorMessage && (
          <p className={s.error} role="alert">
            {errorMessage}
          </p>
        )}
        <div className={s.actions}>
          <Button type="button" variant="ghost" onClick={close} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit} loading={mutation.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
