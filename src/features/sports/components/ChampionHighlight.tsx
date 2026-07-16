import { Trophy } from 'lucide-react'
import s from './ChampionHighlight.module.css'

export function ChampionHighlight({ teamName }: { teamName: string }) {
  return (
    <div className={s.band}>
      <Trophy className={s.icon} size={20} strokeWidth={2} aria-hidden="true" />
      <div className={s.text}>
        <span className={s.label}>Campeão</span>
        <span className={s.name}>{teamName}</span>
      </div>
    </div>
  )
}
