import { useState } from 'react'
import { Button, Combobox, Field } from '../../../components/ui'
import type { BracketTeamOption } from './BracketCanvas'
import s from './CompleteTournamentPanel.module.css'

export function CompleteTournamentPanel({ teams, suggestion, requiresChampion, onComplete, onCancel, errorMessage }: { teams: BracketTeamOption[]; suggestion: string | null; requiresChampion: boolean; onComplete: (championTournamentTeamId: string | null) => Promise<void>; onCancel: () => void; errorMessage?: string }) {
  const [champion, setChampion] = useState(suggestion)
  return <div className={s.panel}>
    <Field label="Campeão"><Combobox aria-label="Campeão" options={teams.map((team) => ({ value: team.tournamentTeamId, label: team.name, secondary: team.shortName }))} value={champion} onChange={setChampion} placeholder="Selecione…" /></Field>
    {requiresChampion && !suggestion && <p>A rodada final tem mais de uma vaga ou o vencedor ainda não foi definido — escolha o campeão.</p>}
    {errorMessage && <p role="alert">{errorMessage}</p>}
    <div className={s.actions}><Button onClick={() => { void onComplete(champion) }} disabled={requiresChampion && !champion}>Encerrar campeonato</Button><Button variant="ghost" onClick={onCancel}>Cancelar</Button></div>
  </div>
}
