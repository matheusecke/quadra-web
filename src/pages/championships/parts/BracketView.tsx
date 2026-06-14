import { Link } from 'react-router-dom'
import { cn } from '../../../components/ui/cn'
import type { BracketMatch, BracketRound, Team } from '../../../features/sports/types'
import s from '../championships.module.css'

interface BracketViewProps {
  rounds: BracketRound[]
  teams: Map<string, Team>
  championTeamId?: string | null
}

function BracketTeamLine({
  teamId,
  score,
  winner,
  teams,
}: {
  teamId: string | null
  score: number | null
  winner: boolean
  teams: Map<string, Team>
}) {
  const team = teamId ? teams.get(teamId) : null
  return (
    <div className={cn(s.bracketTeam, winner && s.bracketWinner)}>
      <span className={cn(s.bracketTeamName, !team && s.bracketTbd)}>
        {team ? team.name : 'A definir'}
      </span>
      <span className={s.bracketScore}>{score ?? '—'}</span>
    </div>
  )
}

function BracketCell({ match, teams }: { match: BracketMatch; teams: Map<string, Team> }) {
  const inner = (
    <>
      <BracketTeamLine
        teamId={match.homeTeamId}
        score={match.homeScore}
        winner={match.winnerId !== null && match.winnerId === match.homeTeamId}
        teams={teams}
      />
      <BracketTeamLine
        teamId={match.awayTeamId}
        score={match.awayScore}
        winner={match.winnerId !== null && match.winnerId === match.awayTeamId}
        teams={teams}
      />
    </>
  )

  // Each confrontation links to its match detail (route lands in a later round).
  if (match.matchId) {
    return (
      <Link to={`/matches/${match.matchId}`} className={s.bracketMatch}>
        {inner}
      </Link>
    )
  }
  return <div className={s.bracketMatch}>{inner}</div>
}

export function BracketView({ rounds, teams, championTeamId }: BracketViewProps) {
  const champion = championTeamId ? teams.get(championTeamId) : null

  return (
    <div className={s.bracket}>
      {rounds.map((round) => (
        <div key={round.id} className={s.bracketRound}>
          <span className={s.bracketRoundLabel}>{round.name}</span>
          {round.matches.map((m) => (
            <BracketCell key={m.id} match={m} teams={teams} />
          ))}
        </div>
      ))}
      {champion && (
        <div className={s.bracketRound}>
          <span className={s.bracketRoundLabel}>Campeão</span>
          <div className={s.bracketChampion}>
            <span className={s.bracketChampionLabel}>Campeão</span>
            <span className={s.bracketChampionName}>{champion.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}
