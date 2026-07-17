import { Link } from 'react-router-dom'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { getAthletes } from '../../../features/sports/mock-sports-data'
import type { MatchDetail, PlayerMatchStats, Team } from '../../../features/sports/types'
import { calculatePeriodTotal, getPeriodLabel } from '../../../features/sports/sportsUtils'
import s from '../matches.module.css'

interface SummaryTabProps {
  match: MatchDetail
  teams: Map<string, Team>
}

const LEADER_CATS: { key: keyof PlayerMatchStats; label: string; full: string }[] = [
  { key: 'pts', label: 'PTS', full: 'Pontos' },
  { key: 'reb', label: 'REB', full: 'Rebotes' },
  { key: 'ast', label: 'AST', full: 'Assistências' },
  { key: 'stl', label: 'STL', full: 'Roubos' },
  { key: 'blk', label: 'BLK', full: 'Tocos' },
]

export function SummaryTab({ match, teams }: SummaryTabProps) {
  const allPlayers = [
    ...match.homeStats.players.map((player) => ({ ...player, teamId: match.homeTeamId })),
    ...match.awayStats.players.map((player) => ({ ...player, teamId: match.awayTeamId })),
  ]

  const hasStats = allPlayers.length > 0

  // Per-category match leader
  const leaders = LEADER_CATS.map(({ key, label, full }) => {
    if (!hasStats) return { key, label, full, player: null }
    const sorted = [...allPlayers].filter((player) => player[key] !== null).sort(
      (a, b) => (b[key] as number) - (a[key] as number),
    )
    const top = sorted[0]
    return { key, label, full, player: top && (top[key] as number) > 0 ? top : null }
  })

  const periods = match.periodScores
  const homeTotal = match.homeScore ?? calculatePeriodTotal(periods, 'home')
  const awayTotal = match.awayScore ?? calculatePeriodTotal(periods, 'away')
  const mvp = match.mvp
  const mvpAthlete = mvp ? getAthletes().find((athlete) => athlete.id === mvp.athleteId) : null

  return (
    <>
      {/* 1 ── Placar por período ─────────────────────────────────────────── */}
      {periods && periods.length > 0 && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>Placar por período</h2>
          </div>
          <div className={s.quarterWrap}>
            <table className={s.quarterTable}>
              <thead>
                <tr>
                  <th>Equipe</th>
                  {periods.map((p) => (
                    <th key={p.periodNumber}>{getPeriodLabel(p)}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Home */}
                <tr>
                  <td>{teams.get(match.homeTeamId)?.name ?? '—'}</td>
                  {periods.map((p) => (
                    <td
                      key={p.periodNumber}
                      className={p.homePoints === null ? s.quarterPending : undefined}
                    >
                      {p.homePoints ?? '—'}
                    </td>
                  ))}
                  <td className={s.quarterTotal}>{homeTotal ?? '—'}</td>
                </tr>
                {/* Away */}
                <tr>
                  <td>{teams.get(match.awayTeamId)?.name ?? '—'}</td>
                  {periods.map((p) => (
                    <td
                      key={p.periodNumber}
                      className={p.awayPoints === null ? s.quarterPending : undefined}
                    >
                      {p.awayPoints ?? '—'}
                    </td>
                  ))}
                  <td className={s.quarterTotal}>{awayTotal ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 2 ── Melhor em quadra (prêmio curado, não derivado) ──────────────── */}
      {mvp && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>Melhor em quadra</h2>
          </div>
          <div className={s.mvpCard}>
            <span className={s.mvpBadge}>MVP</span>
            <Link to={`/athletes/${mvp.athleteId}`} className={s.mvpName}>
              {mvpAthlete?.name ?? mvp.athleteId}
            </Link>
          </div>
        </section>
      )}

      {/* 3 ── Líderes da partida ─────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Líderes da partida</h2>
          <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>
            clique no atleta para o perfil
          </span>
        </div>

        {!hasStats ? (
          <div style={{ padding: 'var(--space-4) 0' }}>
            <EmptyState
              title="Estatísticas não disponíveis."
              description="Os líderes aparecerão quando as estatísticas da partida forem registradas."
            />
          </div>
        ) : (
          <div className={s.matchLeaders}>
            {leaders.map(({ key, label, full, player }) => (
              <div key={key} className={s.leaderCard}>
                <div className={s.leaderCardHead}>
                  <span className={s.leaderStatLabel}>{label}</span>
                  <span className={s.leaderStatFull}>{full}</span>
                </div>
                <div className={s.leaderBody}>
                  {player ? (
                    <>
                      <span className={s.leaderValue}>
                        {player[key] as number}
                      </span>
                      <Link
                        to={`/athletes/${player.athleteId}`}
                        className={s.leaderName}
                      >
                        {player.athleteName}
                      </Link>
                      <span className={s.leaderTeam}>
                        {teams.get(player.teamId)?.shortName ?? player.teamId}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--muted-3)' }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
