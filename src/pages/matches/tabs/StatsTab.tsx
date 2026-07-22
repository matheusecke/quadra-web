import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import type { MatchDetail, Team } from '../../../features/sports/types'
import {
  aggregateTeamStats,
  calcEff,
  formatMinutesSeconds,
  formatStatPct,
  formatTsPct,
} from '../../../features/sports/sportsUtils'
import s from '../matches.module.css'

interface StatsTabProps {
  match: MatchDetail
  teams: Map<number, Team>
}

export function StatsTab({ match, teams }: StatsTabProps) {
  const [selectedTeamId, setSelectedTeamId] = useState(match.homeTeamId)
  const [q, setQ] = useState('')

  const hasAnyStats =
    match.homeStats.players.length > 0 || match.awayStats.players.length > 0

  const selectedStats =
    selectedTeamId === match.homeTeamId ? match.homeStats : match.awayStats

  const totals = useMemo(
    () => aggregateTeamStats(selectedStats.players),
    [selectedStats],
  )

  const filteredPlayers = useMemo(
    () =>
      selectedStats.players.filter(
        (p) => !q || p.athleteName.toLowerCase().includes(q.toLowerCase()),
      ),
    [selectedStats, q],
  )

  const homeTeam = teams.get(match.homeTeamId)
  const awayTeam = teams.get(match.awayTeamId)

  return (
    <div className={s.statsShell}>
      {/* 1 ── Seletor visual de equipe ───────────────────────────────────── */}
      <div className={s.teamSelector}>
        {/* Mandante */}
        <button
          type="button"
          className={`${s.teamBtn} ${selectedTeamId === match.homeTeamId ? s.teamBtnActive : ''}`}
          onClick={() => setSelectedTeamId(match.homeTeamId)}
        >
          <span className={s.teamBtnLabel}>Mandante</span>
          <span className={s.teamBtnName}>{homeTeam?.name ?? '—'}</span>
          {match.homeScore !== null && (
            <span className={s.teamBtnScore}>{match.homeScore}</span>
          )}
        </button>
        {/* Visitante */}
        <button
          type="button"
          className={`${s.teamBtn} ${selectedTeamId === match.awayTeamId ? s.teamBtnActive : ''}`}
          onClick={() => setSelectedTeamId(match.awayTeamId)}
        >
          <span className={s.teamBtnLabel}>Visitante</span>
          <span className={s.teamBtnName}>{awayTeam?.name ?? '—'}</span>
          {match.awayScore !== null && (
            <span className={s.teamBtnScore}>{match.awayScore}</span>
          )}
        </button>
      </div>

      {!hasAnyStats ? (
        <EmptyState
          title="Estatísticas não disponíveis."
          description="As estatísticas aparecerão quando forem registradas para esta partida."
        />
      ) : selectedStats.players.length === 0 ? (
        <EmptyState
          title="Estatísticas não disponíveis para esta equipe."
          description="Apenas parte das estatísticas foi registrada para esta partida."
        />
      ) : (
        <>
          {/* 2 ── Bloco solto de stats do time ──────────────────────────── */}
          <div className={s.statsBlock}>
            {/* Linha 1: MIN PTS REB AST STL BLK TO PF */}
            <div className={s.statsRow}>
              {[
                { label: 'PTS', value: totals.pts },
                { label: 'REB', value: totals.reb },
                { label: 'AST', value: totals.ast },
                { label: 'STL', value: totals.stl },
                { label: 'BLK', value: totals.blk },
                { label: 'TOV', value: totals.tov },
                { label: 'PF',  value: totals.pf  },
              ].map(({ label, value }) => (
                <div key={label} className={s.statItem}>
                  <span className={s.statValue}>{value ?? 'N/A'}</span>
                  <span className={s.statLabel}>{label}</span>
                </div>
              ))}
            </div>

            {/* Linha 2: FG FG% 3FG 3FG% FT FT% TS% */}
            <div className={s.statsRow}>
              {[
                {
                  label: 'FG',
                  value: `${totals.fgm ?? 'N/A'}/${totals.fga ?? 'N/A'}`,
                  sm: true,
                },
                {
                  label: 'FG%',
                  value: formatStatPct(totals.fgm, totals.fga),
                  sm: true,
                },
                {
                  label: '3FG',
                  value: `${totals.threeFgm ?? 'N/A'}/${totals.threeFga ?? 'N/A'}`,
                  sm: true,
                },
                {
                  label: '3FG%',
                  value: formatStatPct(totals.threeFgm, totals.threeFga),
                  sm: true,
                },
                {
                  label: 'FT',
                  value: `${totals.ftm ?? 'N/A'}/${totals.fta ?? 'N/A'}`,
                  sm: true,
                },
                {
                  label: 'FT%',
                  value: formatStatPct(totals.ftm, totals.fta),
                  sm: true,
                },
                {
                  label: 'TS%',
                  value: formatTsPct(totals.pts, totals.fga, totals.fta),
                  sm: true,
                },
              ].map(({ label, value }) => (
                <div key={label} className={s.statItem}>
                  <span className={s.statValueSm}>{value}</span>
                  <span className={s.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3 ── Box score ──────────────────────────────────────────────── */}
          <div className={s.boxSection}>
            {/* Busca por atleta */}
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

            <div className={s.boxWrap}>
              <table className={s.boxTable}>
                <thead>
                  <tr>
                    {/* Identificação */}
                    <th className={`${s.boxTh} ${s.boxThLeft}`}>Atleta</th>
                    <th className={s.boxTh}>#</th>
                    <th className={s.boxTh}>MIN</th>
                    {/* Produção */}
                    <th className={`${s.boxTh} ${s.boxColGroup}`}>PTS</th>
                    <th className={s.boxTh}>REB</th>
                    <th className={s.boxTh}>AST</th>
                    <th className={s.boxTh}>STL</th>
                    <th className={s.boxTh}>BLK</th>
                    {/* Controle */}
                    <th className={`${s.boxTh} ${s.boxColGroup}`}>TOV</th>
                    <th className={s.boxTh}>PF</th>
                    {/* Aproveitamento */}
                    <th className={`${s.boxTh} ${s.boxColGroup}`}>FGM</th>
                    <th className={s.boxTh}>FGA</th>
                    <th className={s.boxTh}>FG%</th>
                    <th className={s.boxTh}>3PM</th>
                    <th className={s.boxTh}>3PA</th>
                    <th className={s.boxTh}>3P%</th>
                    <th className={s.boxTh}>FTM</th>
                    <th className={s.boxTh}>FTA</th>
                    <th className={s.boxTh}>FT%</th>
                    {/* Eficiência */}
                    <th className={`${s.boxTh} ${s.boxColGroup}`}>TS%</th>
                    <th className={s.boxTh}>EFI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={21} style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--muted-3)', fontSize: 13 }}>
                        Nenhum atleta encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((p) => {
                      const fgPct = formatStatPct(p.fgm, p.fga)
                      const tpPct = formatStatPct(p.threeFgm, p.threeFga)
                      const ftPct = formatStatPct(p.ftm, p.fta)
                      const tsPct = formatTsPct(p.pts, p.fga, p.fta)
                      const efi   = calcEff(p)
                      return (
                        <tr key={p.athleteId} className={s.boxTr}>
                          <td className={`${s.boxTd} ${s.boxTdLeft}`}>
                            <Link
                              to={`/athletes/${p.athleteId}`}
                              className={s.boxAthleteLink}
                            >
                              {p.athleteName}
                            </Link>
                          </td>
                          <td className={s.boxTd}>
                            <span className={s.boxNum}>{p.number}</span>
                          </td>
                          <td className={s.boxTd}>{formatMinutesSeconds(p.minutesSeconds)}</td>
                          {/* Produção */}
                          <td className={`${s.boxTd} ${s.boxColGroup}`}>{p.pts ?? 'N/A'}</td>
                          <td className={s.boxTd}>{p.reb ?? 'N/A'}</td>
                          <td className={s.boxTd}>{p.ast ?? 'N/A'}</td>
                          <td className={s.boxTd}>{p.stl ?? 'N/A'}</td>
                          <td className={s.boxTd}>{p.blk ?? 'N/A'}</td>
                          {/* Controle */}
                          <td className={`${s.boxTd} ${s.boxColGroup}`}>{p.tov ?? 'N/A'}</td>
                          <td className={s.boxTd}>{p.pf ?? 'N/A'}</td>
                          {/* Aproveitamento */}
                          <td className={`${s.boxTd} ${s.boxColGroup}`}>{p.fgm ?? 'N/A'}</td>
                          <td className={s.boxTd}>{p.fga ?? 'N/A'}</td>
                          <td className={s.boxTd}>{fgPct}</td>
                          <td className={s.boxTd}>{p.threeFgm ?? 'N/A'}</td>
                          <td className={s.boxTd}>{p.threeFga ?? 'N/A'}</td>
                          <td className={s.boxTd}>{tpPct}</td>
                          <td className={s.boxTd}>{p.ftm ?? 'N/A'}</td>
                          <td className={s.boxTd}>{p.fta ?? 'N/A'}</td>
                          <td className={s.boxTd}>{ftPct}</td>
                          {/* Eficiência */}
                          <td className={`${s.boxTd} ${s.boxColGroup}`}>{tsPct}</td>
                          <td className={s.boxTd}
                            style={{ color: efi === null ? undefined : efi > 0 ? 'var(--status-ok)' : efi < 0 ? 'var(--status-live)' : undefined }}
                          >
                            {efi === null ? 'N/A' : efi > 0 ? `+${efi}` : efi}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
