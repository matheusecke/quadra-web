import { useMemo, useState } from 'react'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import type { MatchDetail } from '../../../features/sports/types'
import { formatMinutesSeconds, formatStatPct } from '../../../features/sports/sportsUtils'
import s from '../matches.module.css'

interface StatsTabProps {
  match: MatchDetail
}

export function StatsTab({ match }: StatsTabProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(match.homeTeam.tournamentTeamId)
  const [q, setQ] = useState('')

  const homePlayers = match.playerStats.filter((p) => p.tournamentTeamId === match.homeTeam.tournamentTeamId)
  const awayPlayers = match.playerStats.filter((p) => p.tournamentTeamId === match.awayTeam.tournamentTeamId)
  const hasAnyStats = homePlayers.length > 0 || awayPlayers.length > 0
  const selectedPlayers = selectedTeamId === match.homeTeam.tournamentTeamId ? homePlayers : awayPlayers

  const filteredPlayers = useMemo(
    () => selectedPlayers.filter((p) => !q || p.displayName.toLowerCase().includes(q.toLowerCase())),
    [selectedPlayers, q],
  )

  return (
    <div className={s.statsShell}>
      {/* 1 ── Seletor visual de equipe ───────────────────────────────────── */}
      <div className={s.teamSelector}>
        <button
          type="button"
          className={`${s.teamBtn} ${selectedTeamId === match.homeTeam.tournamentTeamId ? s.teamBtnActive : ''}`}
          onClick={() => setSelectedTeamId(match.homeTeam.tournamentTeamId)}
        >
          <span className={s.teamBtnLabel}>Mandante</span>
          <span className={s.teamBtnName}>{match.homeTeam.teamName}</span>
          {match.homeTeam.score !== null && (
            <span className={s.teamBtnScore}>{match.homeTeam.score}</span>
          )}
        </button>
        <button
          type="button"
          className={`${s.teamBtn} ${selectedTeamId === match.awayTeam.tournamentTeamId ? s.teamBtnActive : ''}`}
          onClick={() => setSelectedTeamId(match.awayTeam.tournamentTeamId)}
        >
          <span className={s.teamBtnLabel}>Visitante</span>
          <span className={s.teamBtnName}>{match.awayTeam.teamName}</span>
          {match.awayTeam.score !== null && (
            <span className={s.teamBtnScore}>{match.awayTeam.score}</span>
          )}
        </button>
      </div>

      {!hasAnyStats ? (
        <EmptyState
          title="Estatísticas não disponíveis."
          description="As estatísticas aparecerão quando forem registradas para esta partida."
        />
      ) : selectedPlayers.length === 0 ? (
        <EmptyState
          title="Estatísticas não disponíveis para esta equipe."
          description="Apenas parte das estatísticas foi registrada para esta partida."
        />
      ) : (
        <div className={s.boxSection}>
          {/* 2 ── Busca por atleta ──────────────────────────────────────── */}
          <div className={s.boxToolbar}>
            <div className={s.searchWrap}>
              <span className={s.searchIcon}>⌕</span>
              <input
                className={s.searchInput}
                type="search"
                placeholder="Buscar atleta..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar atleta no box score"
              />
              {q && (
                <button
                  type="button"
                  className={s.searchClear}
                  onClick={() => setQ('')}
                  aria-label="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3 ── Box score ──────────────────────────────────────────────── */}
          <div className={s.boxWrap}>
            <table className={s.boxTable}>
              <thead>
                <tr>
                  <th className={`${s.boxTh} ${s.boxThLeft}`}>Atleta</th>
                  <th className={s.boxTh}>MIN</th>
                  <th className={`${s.boxTh} ${s.boxColGroup}`}>PTS</th>
                  <th className={s.boxTh}>REB</th>
                  <th className={s.boxTh}>AST</th>
                  <th className={s.boxTh}>STL</th>
                  <th className={s.boxTh}>BLK</th>
                  <th className={`${s.boxTh} ${s.boxColGroup}`}>TOV</th>
                  <th className={s.boxTh}>PF</th>
                  <th className={`${s.boxTh} ${s.boxColGroup}`}>FGM</th>
                  <th className={s.boxTh}>FGA</th>
                  <th className={s.boxTh}>FG%</th>
                  <th className={s.boxTh}>3PM</th>
                  <th className={s.boxTh}>3PA</th>
                  <th className={s.boxTh}>3P%</th>
                  <th className={s.boxTh}>FTM</th>
                  <th className={s.boxTh}>FTA</th>
                  <th className={s.boxTh}>FT%</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={18} style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--muted-3)', fontSize: 13 }}>
                      Nenhum atleta encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((p) => (
                    <tr key={p.tournamentRosterId} className={s.boxTr}>
                      <td className={`${s.boxTd} ${s.boxTdLeft}`}>{p.displayName}</td>
                      <td className={s.boxTd}>{formatMinutesSeconds(p.minutesSeconds)}</td>
                      <td className={`${s.boxTd} ${s.boxColGroup}`}>{p.pts ?? 'N/A'}</td>
                      <td className={s.boxTd}>{p.reb ?? 'N/A'}</td>
                      <td className={s.boxTd}>{p.ast ?? 'N/A'}</td>
                      <td className={s.boxTd}>{p.stl ?? 'N/A'}</td>
                      <td className={s.boxTd}>{p.blk ?? 'N/A'}</td>
                      <td className={`${s.boxTd} ${s.boxColGroup}`}>{p.tov ?? 'N/A'}</td>
                      <td className={s.boxTd}>{p.pf ?? 'N/A'}</td>
                      <td className={`${s.boxTd} ${s.boxColGroup}`}>{p.fgm ?? 'N/A'}</td>
                      <td className={s.boxTd}>{p.fga ?? 'N/A'}</td>
                      <td className={s.boxTd}>{formatStatPct(p.fgm, p.fga)}</td>
                      <td className={s.boxTd}>{p.threeFgm ?? 'N/A'}</td>
                      <td className={s.boxTd}>{p.threeFga ?? 'N/A'}</td>
                      <td className={s.boxTd}>{formatStatPct(p.threeFgm, p.threeFga)}</td>
                      <td className={s.boxTd}>{p.ftm ?? 'N/A'}</td>
                      <td className={s.boxTd}>{p.fta ?? 'N/A'}</td>
                      <td className={s.boxTd}>{formatStatPct(p.ftm, p.fta)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
