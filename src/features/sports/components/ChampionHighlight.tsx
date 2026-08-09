import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import s from './ChampionHighlight.module.css'

export interface ChampionHighlightProps {
  teamName: string
  /** `null` while the champion enrollment has not been resolved to a global team. */
  teamId: number | null
}

export function ChampionHighlight({ teamName, teamId }: ChampionHighlightProps) {
  return (
    <div className={s.band}>
      <Trophy className={s.icon} size={20} strokeWidth={2} aria-hidden="true" />
      <div className={s.text}>
        <span className={s.label}>Campeão</span>
        {teamId === null ? (
          <span className={s.name}>{teamName}</span>
        ) : (
          <Link to={`/teams/${teamId}`} className={`${s.name} ${s.nameLink}`}>{teamName}</Link>
        )}
      </div>
    </div>
  )
}
