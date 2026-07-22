import { useState } from 'react'
import { Button, Combobox, Field } from '../../../components/ui'
import { parsePositiveId } from '../parsePositiveId'
import type { BracketTeamOption } from '../useBracketView'
import s from './CompleteTournamentPanel.module.css'

export function CompleteTournamentPanel({ teams, suggestion, requiresChampion, onComplete, onCancel, errorMessage }: { teams: BracketTeamOption[]; suggestion: number | null; requiresChampion: boolean; onComplete: (championTournamentTeamId: number | null) => Promise<void>; onCancel: () => void; errorMessage?: string }) {
  const [champion, setChampion] = useState(suggestion)
  return <div className={s.panel}>
    <Field label="Campeão"><Combobox aria-label="Campeão" options={teams.map((team) => ({ value: String(team.tournamentTeamId), label: team.name, secondary: team.shortName }))} value={champion == null ? null : String(champion)} onChange={(raw) => setChampion(parsePositiveId(raw))} placeholder="Selecione…" /></Field>
    {requiresChampion && !suggestion && <p>A rodada final tem mais de uma vaga ou o vencedor ainda não foi definido — escolha o campeão.</p>}
    {errorMessage && <p role="alert">{errorMessage}</p>}
    <div className={s.actions}><Button onClick={() => { void onComplete(champion) }} disabled={requiresChampion && !champion}>Confirmar encerramento</Button><Button variant="ghost" onClick={onCancel}>Cancelar</Button></div>
  </div>
}
