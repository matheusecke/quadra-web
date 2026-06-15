/**
 * Sports domain — MOCK DATA.
 *
 * ⚠️⚠️ TEMPORARY / MOCK ⚠️⚠️
 * None of this is real. There is no sports backend yet. Every record below is
 * hand-authored so the championship screens can be built and reviewed. When the
 * API exists, delete this file and replace the `get*` accessors with fetch calls
 * that return the same types from `./types`.
 *
 * Accessors (`getChampionships`, `getChampionshipById`, `getMatchesByChampionship`)
 * intentionally mirror a future async API surface — keep their signatures stable.
 */

import type {
  BracketRound,
  Championship,
  Group,
  Match,
  MatchDetail,
  PeriodScore,
  PlayerMatchStats,
  StatLeaders,
  Team,
  TeamMatchStats,
} from './types'

// ── Teams ─────────────────────────────────────────────────────────────────────

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Tigres do Vale', shortName: 'TIG', city: 'Vale Verde' },
  { id: 't2', name: 'Falcões da Serra', shortName: 'FAL', city: 'Serra Alta' },
  { id: 't3', name: 'Lobos do Norte', shortName: 'LOB', city: 'Porto Norte' },
  { id: 't4', name: 'Águias Douradas', shortName: 'AGU', city: 'Campo Dourado' },
  { id: 't5', name: 'Furacão Azul', shortName: 'FUR', city: 'Baía Azul' },
  { id: 't6', name: 'Sentinelas', shortName: 'SEN', city: 'Fortaleza' },
  { id: 't7', name: 'Bisões', shortName: 'BIS', city: 'Planalto' },
  { id: 't8', name: 'Cometas', shortName: 'COM', city: 'Estrela' },
  // t9-t16 adicionados para Supercopa Nacional (16 times) — ⚠️ MOCK
  { id: 't9',  name: 'Panteras Negras', shortName: 'PAN', city: 'Pedra Preta' },
  { id: 't10', name: 'Trovões',         shortName: 'TRO', city: 'Alto Claro' },
  { id: 't11', name: 'Invasores',       shortName: 'INV', city: 'Vila Nova' },
  { id: 't12', name: 'Corsários',       shortName: 'COR', city: 'Porto Livre' },
  { id: 't13', name: 'Abutres',         shortName: 'ABU', city: 'Serra Branca' },
  { id: 't14', name: 'Linces',          shortName: 'LIN', city: 'Rio Fundo' },
  { id: 't15', name: 'Mamutes',         shortName: 'MAM', city: 'Foz do Rio' },
  { id: 't16', name: 'Dragões',         shortName: 'DRA', city: 'Barra Leste' },
]

// ── Helpers to keep the authored data terse ─────────────────────────────────────

let matchSeq = 0
function mkMatch(
  championshipId: string,
  phase: string,
  date: string,
  homeTeamId: string,
  awayTeamId: string,
  home: number | null,
  away: number | null,
  status: Match['status'],
  venue: string,
  statsStatus: Match['statsStatus'],
): Match {
  return {
    id: `m${++matchSeq}`,
    championshipId,
    phase,
    date,
    homeTeamId,
    awayTeamId,
    homeScore: home,
    awayScore: away,
    status,
    venue,
    statsStatus,
  }
}

function group(id: string, name: string, rows: Array<[string, number, number, number, number, number]>): Group {
  // tuple: [teamId, played, wins, losses, pointsFor, pointsAgainst]
  return {
    id,
    name,
    standings: rows.map(([teamId, played, wins, losses, pf, pa], i) => ({
      teamId,
      position: i + 1,
      played,
      wins,
      losses,
      pointsFor: pf,
      pointsAgainst: pa,
    })),
  }
}

// ── Championship 1 — Liga Metropolitana (PLAYOFFS, rich showcase) ────────────────

const C1 = 'c1'

const c1Groups: Group[] = [
  group('c1-ga', 'Grupo A', [
    ['t1', 6, 5, 1, 512, 448],
    ['t4', 6, 4, 2, 489, 462],
    ['t5', 6, 2, 4, 451, 470],
    ['t7', 6, 1, 5, 430, 502],
  ]),
  group('c1-gb', 'Grupo B', [
    ['t2', 6, 5, 1, 528, 441],
    ['t3', 6, 4, 2, 497, 466],
    ['t6', 6, 3, 3, 472, 469],
    ['t8', 6, 0, 6, 418, 521],
  ]),
]

const c1Leaders: StatLeaders = {
  ppg: [
    { athleteId: 'a1', athleteName: 'Rafael Moura', teamId: 't1', value: 24.6, gamesPlayed: 6 },
    { athleteId: 'a2', athleteName: 'Diego Valente', teamId: 't2', value: 22.1, gamesPlayed: 6 },
    { athleteId: 'a3', athleteName: 'Caio Bittencourt', teamId: 't4', value: 21.4, gamesPlayed: 6 },
    { athleteId: 'a4', athleteName: 'Lucas Andrade', teamId: 't3', value: 20.8, gamesPlayed: 6 },
    { athleteId: 'a5', athleteName: 'Henrique Sales', teamId: 't6', value: 19.9, gamesPlayed: 6 },
  ],
  rpg: [
    { athleteId: 'a6', athleteName: 'Túlio Ramires', teamId: 't1', value: 11.8, gamesPlayed: 6 },
    { athleteId: 'a7', athleteName: 'Bruno Capela', teamId: 't3', value: 10.9, gamesPlayed: 6 },
    { athleteId: 'a3', athleteName: 'Caio Bittencourt', teamId: 't4', value: 10.2, gamesPlayed: 6 },
    { athleteId: 'a8', athleteName: 'Marcos Vinícius', teamId: 't2', value: 9.7, gamesPlayed: 6 },
    { athleteId: 'a9', athleteName: 'Pedro Tavares', teamId: 't6', value: 9.1, gamesPlayed: 6 },
  ],
  apg: [
    { athleteId: 'a10', athleteName: 'Gabriel Pires', teamId: 't2', value: 8.4, gamesPlayed: 6 },
    { athleteId: 'a11', athleteName: 'Vitor Hugo', teamId: 't1', value: 7.6, gamesPlayed: 6 },
    { athleteId: 'a12', athleteName: 'Eduardo Lima', teamId: 't4', value: 6.9, gamesPlayed: 6 },
    { athleteId: 'a4', athleteName: 'Lucas Andrade', teamId: 't3', value: 6.5, gamesPlayed: 6 },
    { athleteId: 'a13', athleteName: 'Felipe Castro', teamId: 't5', value: 6.0, gamesPlayed: 6 },
  ],
  stg: [
    { athleteId: 'a11', athleteName: 'Vitor Hugo', teamId: 't1', value: 2.7, gamesPlayed: 6 },
    { athleteId: 'a14', athleteName: 'André Nunes', teamId: 't6', value: 2.4, gamesPlayed: 6 },
    { athleteId: 'a10', athleteName: 'Gabriel Pires', teamId: 't2', value: 2.2, gamesPlayed: 6 },
    { athleteId: 'a15', athleteName: 'Rodrigo Paz', teamId: 't3', value: 2.0, gamesPlayed: 6 },
    { athleteId: 'a13', athleteName: 'Felipe Castro', teamId: 't5', value: 1.8, gamesPlayed: 6 },
  ],
  bpg: [
    { athleteId: 'a6', athleteName: 'Túlio Ramires', teamId: 't1', value: 2.1, gamesPlayed: 6 },
    { athleteId: 'a7', athleteName: 'Bruno Capela', teamId: 't3', value: 1.9, gamesPlayed: 6 },
    { athleteId: 'a16', athleteName: 'Otávio Brandão', teamId: 't4', value: 1.6, gamesPlayed: 6 },
    { athleteId: 'a8', athleteName: 'Marcos Vinícius', teamId: 't2', value: 1.4, gamesPlayed: 6 },
    { athleteId: 'a9', athleteName: 'Pedro Tavares', teamId: 't6', value: 1.2, gamesPlayed: 6 },
  ],
}

const c1Matches: Match[] = [
  // Group stage (finished)
  mkMatch(C1, 'Fase de grupos', '2026-05-04T19:00:00', 't1', 't7', 88, 71, 'FINISHED', 'Ginásio Central', 'COMPLETE'),
  mkMatch(C1, 'Fase de grupos', '2026-05-04T21:00:00', 't4', 't5', 79, 74, 'FINISHED', 'Ginásio Central', 'COMPLETE'),
  mkMatch(C1, 'Fase de grupos', '2026-05-06T19:00:00', 't2', 't8', 95, 68, 'FINISHED', 'Arena Serra', 'COMPLETE'),
  mkMatch(C1, 'Fase de grupos', '2026-05-06T21:00:00', 't3', 't6', 81, 77, 'FINISHED', 'Arena Serra', 'PARTIAL'),
  mkMatch(C1, 'Fase de grupos', '2026-05-11T19:00:00', 't1', 't4', 84, 80, 'FINISHED', 'Ginásio Central', 'COMPLETE'),
  mkMatch(C1, 'Fase de grupos', '2026-05-13T19:00:00', 't2', 't3', 90, 85, 'FINISHED', 'Arena Serra', 'COMPLETE'),
  // Quarterfinals (finished)
  mkMatch(C1, 'Quartas de final', '2026-05-20T19:00:00', 't1', 't6', 92, 78, 'FINISHED', 'Ginásio Olímpico', 'COMPLETE'),
  mkMatch(C1, 'Quartas de final', '2026-05-20T21:00:00', 't2', 't5', 87, 73, 'FINISHED', 'Ginásio Olímpico', 'COMPLETE'),
  mkMatch(C1, 'Quartas de final', '2026-05-21T19:00:00', 't4', 't3', 76, 82, 'FINISHED', 'Ginásio Olímpico', 'COMPLETE'),
  mkMatch(C1, 'Quartas de final', '2026-05-21T21:00:00', 't7', 't6', 70, 88, 'FINISHED', 'Ginásio Olímpico', 'PARTIAL'),
  // Semifinals (one live, one scheduled)
  mkMatch(C1, 'Semifinais', '2026-06-12T20:00:00', 't1', 't3', 54, 49, 'LIVE', 'Arena Metropolitana', 'PENDING'),
  mkMatch(C1, 'Semifinais', '2026-06-13T20:00:00', 't2', 't6', null, null, 'SCHEDULED', 'Arena Metropolitana', 'PENDING'),
  // Final (scheduled, undefined teams)
  mkMatch(C1, 'Final', '2026-06-20T20:00:00', 't1', 't2', null, null, 'SCHEDULED', 'Arena Metropolitana', 'PENDING'),
]

const c1Bracket: BracketRound[] = [
  {
    id: 'c1-qf',
    name: 'Quartas de final',
    matches: [
      { id: 'c1-qf1', matchId: 'm7', homeTeamId: 't1', awayTeamId: 't6', homeScore: 92, awayScore: 78, winnerId: 't1' },
      { id: 'c1-qf2', matchId: 'm8', homeTeamId: 't2', awayTeamId: 't5', homeScore: 87, awayScore: 73, winnerId: 't2' },
      { id: 'c1-qf3', matchId: 'm9', homeTeamId: 't4', awayTeamId: 't3', homeScore: 76, awayScore: 82, winnerId: 't3' },
      { id: 'c1-qf4', matchId: 'm10', homeTeamId: 't7', awayTeamId: 't6', homeScore: 70, awayScore: 88, winnerId: 't6' },
    ],
  },
  {
    id: 'c1-sf',
    name: 'Semifinais',
    matches: [
      { id: 'c1-sf1', matchId: 'm11', homeTeamId: 't1', awayTeamId: 't3', homeScore: 54, awayScore: 49, winnerId: null },
      { id: 'c1-sf2', matchId: 'm12', homeTeamId: 't2', awayTeamId: 't6', homeScore: null, awayScore: null, winnerId: null },
    ],
  },
  {
    id: 'c1-f',
    name: 'Final',
    matches: [
      { id: 'c1-f1', matchId: 'm13', homeTeamId: null, awayTeamId: null, homeScore: null, awayScore: null, winnerId: null },
    ],
  },
]

// ── Championship 2 — Copa de Inverno (IN_PROGRESS, group stage) ──────────────────

const C2 = 'c2'

const c2Groups: Group[] = [
  group('c2-ga', 'Grupo Único', [
    ['t3', 4, 3, 1, 322, 298],
    ['t1', 4, 3, 1, 318, 301],
    ['t6', 4, 2, 2, 305, 309],
    ['t5', 4, 1, 3, 290, 312],
    ['t8', 3, 0, 3, 201, 246],
  ]),
]

const c2Leaders: StatLeaders = {
  ppg: [
    { athleteId: 'a4', athleteName: 'Lucas Andrade', teamId: 't3', value: 23.2, gamesPlayed: 4 },
    { athleteId: 'a1', athleteName: 'Rafael Moura', teamId: 't1', value: 21.0, gamesPlayed: 4 },
    { athleteId: 'a5', athleteName: 'Henrique Sales', teamId: 't6', value: 18.7, gamesPlayed: 4 },
  ],
  rpg: [
    { athleteId: 'a7', athleteName: 'Bruno Capela', teamId: 't3', value: 12.0, gamesPlayed: 4 },
    { athleteId: 'a6', athleteName: 'Túlio Ramires', teamId: 't1', value: 10.5, gamesPlayed: 4 },
    { athleteId: 'a9', athleteName: 'Pedro Tavares', teamId: 't6', value: 8.8, gamesPlayed: 4 },
  ],
  apg: [
    { athleteId: 'a11', athleteName: 'Vitor Hugo', teamId: 't1', value: 7.9, gamesPlayed: 4 },
    { athleteId: 'a15', athleteName: 'Rodrigo Paz', teamId: 't3', value: 6.8, gamesPlayed: 4 },
    { athleteId: 'a14', athleteName: 'André Nunes', teamId: 't6', value: 5.7, gamesPlayed: 4 },
  ],
  stg: [
    { athleteId: 'a11', athleteName: 'Vitor Hugo', teamId: 't1', value: 2.5, gamesPlayed: 4 },
    { athleteId: 'a15', athleteName: 'Rodrigo Paz', teamId: 't3', value: 2.1, gamesPlayed: 4 },
    { athleteId: 'a13', athleteName: 'Felipe Castro', teamId: 't5', value: 1.7, gamesPlayed: 4 },
  ],
  bpg: [
    { athleteId: 'a7', athleteName: 'Bruno Capela', teamId: 't3', value: 1.8, gamesPlayed: 4 },
    { athleteId: 'a6', athleteName: 'Túlio Ramires', teamId: 't1', value: 1.5, gamesPlayed: 4 },
    { athleteId: 'a9', athleteName: 'Pedro Tavares', teamId: 't6', value: 1.1, gamesPlayed: 4 },
  ],
}

const c2Matches: Match[] = [
  mkMatch(C2, 'Fase de grupos', '2026-06-01T19:30:00', 't3', 't8', 82, 64, 'FINISHED', 'Ginásio Norte', 'COMPLETE'),
  mkMatch(C2, 'Fase de grupos', '2026-06-02T19:30:00', 't1', 't5', 79, 72, 'FINISHED', 'Ginásio Norte', 'COMPLETE'),
  mkMatch(C2, 'Fase de grupos', '2026-06-04T19:30:00', 't6', 't8', 77, 69, 'FINISHED', 'Ginásio Norte', 'PARTIAL'),
  mkMatch(C2, 'Fase de grupos', '2026-06-06T19:30:00', 't3', 't1', 85, 80, 'FINISHED', 'Ginásio Norte', 'COMPLETE'),
  mkMatch(C2, 'Fase de grupos', '2026-06-08T19:30:00', 't5', 't6', 74, 78, 'FINISHED', 'Ginásio Norte', 'COMPLETE'),
  mkMatch(C2, 'Fase de grupos', '2026-06-15T19:30:00', 't1', 't6', null, null, 'SCHEDULED', 'Ginásio Norte', 'PENDING'),
  mkMatch(C2, 'Fase de grupos', '2026-06-17T19:30:00', 't3', 't5', null, null, 'SCHEDULED', 'Ginásio Norte', 'PENDING'),
]

// ── Championship 3 — Torneio Sub-19 (FINISHED, with champion) ────────────────────

const C3 = 'c3'

const c3Groups: Group[] = [
  group('c3-ga', 'Grupo Único', [
    ['t4', 5, 5, 0, 402, 351],
    ['t2', 5, 3, 2, 388, 372],
    ['t7', 5, 2, 3, 360, 369],
    ['t8', 5, 0, 5, 332, 390],
  ]),
]

const c3Leaders: StatLeaders = {
  ppg: [
    { athleteId: 'a3', athleteName: 'Caio Bittencourt', teamId: 't4', value: 25.4, gamesPlayed: 5 },
    { athleteId: 'a2', athleteName: 'Diego Valente', teamId: 't2', value: 22.8, gamesPlayed: 5 },
  ],
  rpg: [
    { athleteId: 'a16', athleteName: 'Otávio Brandão', teamId: 't4', value: 11.2, gamesPlayed: 5 },
    { athleteId: 'a8', athleteName: 'Marcos Vinícius', teamId: 't2', value: 9.4, gamesPlayed: 5 },
  ],
  apg: [
    { athleteId: 'a12', athleteName: 'Eduardo Lima', teamId: 't4', value: 7.1, gamesPlayed: 5 },
    { athleteId: 'a10', athleteName: 'Gabriel Pires', teamId: 't2', value: 6.6, gamesPlayed: 5 },
  ],
  stg: [
    { athleteId: 'a12', athleteName: 'Eduardo Lima', teamId: 't4', value: 2.3, gamesPlayed: 5 },
    { athleteId: 'a10', athleteName: 'Gabriel Pires', teamId: 't2', value: 1.9, gamesPlayed: 5 },
  ],
  bpg: [
    { athleteId: 'a16', athleteName: 'Otávio Brandão', teamId: 't4', value: 2.0, gamesPlayed: 5 },
    { athleteId: 'a8', athleteName: 'Marcos Vinícius', teamId: 't2', value: 1.3, gamesPlayed: 5 },
  ],
}

const c3Matches: Match[] = [
  mkMatch(C3, 'Fase de grupos', '2026-03-10T18:00:00', 't4', 't8', 86, 70, 'FINISHED', 'Ginásio Escola', 'COMPLETE'),
  mkMatch(C3, 'Fase de grupos', '2026-03-12T18:00:00', 't2', 't7', 78, 74, 'FINISHED', 'Ginásio Escola', 'COMPLETE'),
  mkMatch(C3, 'Semifinais', '2026-03-22T18:00:00', 't4', 't7', 81, 66, 'FINISHED', 'Ginásio Escola', 'COMPLETE'),
  mkMatch(C3, 'Semifinais', '2026-03-22T20:00:00', 't2', 't8', 90, 72, 'FINISHED', 'Ginásio Escola', 'COMPLETE'),
  mkMatch(C3, 'Final', '2026-03-29T19:00:00', 't4', 't2', 84, 77, 'FINISHED', 'Ginásio Escola', 'COMPLETE'),
]

const c3Bracket: BracketRound[] = [
  {
    id: 'c3-sf',
    name: 'Semifinais',
    matches: [
      { id: 'c3-sf1', matchId: 'm23', homeTeamId: 't4', awayTeamId: 't7', homeScore: 81, awayScore: 66, winnerId: 't4' },
      { id: 'c3-sf2', matchId: 'm24', homeTeamId: 't2', awayTeamId: 't8', homeScore: 90, awayScore: 72, winnerId: 't2' },
    ],
  },
  {
    id: 'c3-f',
    name: 'Final',
    matches: [
      { id: 'c3-f1', matchId: 'm25', homeTeamId: 't4', awayTeamId: 't2', homeScore: 84, awayScore: 77, winnerId: 't4' },
    ],
  },
]

// ── Championship 5 — Copa Regional (IN_PROGRESS, quarters) ───────────────────────

const C5 = 'c5'

const c5Groups: Group[] = [
  group('c5-ga', 'Grupo A', [
    ['t5', 3, 2, 1, 238, 224],
    ['t7', 3, 2, 1, 231, 220],
    ['t8', 3, 1, 2, 210, 229],
  ]),
  group('c5-gb', 'Grupo B', [
    ['t6', 3, 3, 0, 252, 210],
    ['t4', 3, 1, 2, 219, 231],
    ['t1', 3, 1, 2, 215, 228],
  ]),
]

const c5Leaders: StatLeaders = {
  ppg: [
    { athleteId: 'a5', athleteName: 'Henrique Sales', teamId: 't6', value: 20.3, gamesPlayed: 3 },
    { athleteId: 'a13', athleteName: 'Felipe Castro', teamId: 't5', value: 18.9, gamesPlayed: 3 },
  ],
  rpg: [
    { athleteId: 'a9', athleteName: 'Pedro Tavares', teamId: 't6', value: 9.7, gamesPlayed: 3 },
    { athleteId: 'a16', athleteName: 'Otávio Brandão', teamId: 't4', value: 8.9, gamesPlayed: 3 },
  ],
  apg: [
    { athleteId: 'a14', athleteName: 'André Nunes', teamId: 't6', value: 6.3, gamesPlayed: 3 },
    { athleteId: 'a13', athleteName: 'Felipe Castro', teamId: 't5', value: 5.4, gamesPlayed: 3 },
  ],
  stg: [
    { athleteId: 'a14', athleteName: 'André Nunes', teamId: 't6', value: 2.0, gamesPlayed: 3 },
    { athleteId: 'a13', athleteName: 'Felipe Castro', teamId: 't5', value: 1.6, gamesPlayed: 3 },
  ],
  bpg: [
    { athleteId: 'a16', athleteName: 'Otávio Brandão', teamId: 't4', value: 1.7, gamesPlayed: 3 },
    { athleteId: 'a9', athleteName: 'Pedro Tavares', teamId: 't6', value: 1.0, gamesPlayed: 3 },
  ],
}

const c5Matches: Match[] = [
  mkMatch(C5, 'Fase de grupos', '2026-05-25T19:00:00', 't6', 't1', 88, 74, 'FINISHED', 'Arena Regional', 'COMPLETE'),
  mkMatch(C5, 'Fase de grupos', '2026-05-27T19:00:00', 't5', 't8', 80, 76, 'FINISHED', 'Arena Regional', 'PARTIAL'),
  mkMatch(C5, 'Fase de grupos', '2026-05-29T19:00:00', 't7', 't8', 79, 71, 'FINISHED', 'Arena Regional', 'COMPLETE'),
  mkMatch(C5, 'Quartas de final', '2026-06-14T19:00:00', 't6', 't8', null, null, 'SCHEDULED', 'Arena Regional', 'PENDING'),
  mkMatch(C5, 'Quartas de final', '2026-06-14T21:00:00', 't5', 't4', null, null, 'SCHEDULED', 'Arena Regional', 'PENDING'),
]

const c5Bracket: BracketRound[] = [
  {
    id: 'c5-qf',
    name: 'Quartas de final',
    matches: [
      { id: 'c5-qf1', matchId: 'm29', homeTeamId: 't6', awayTeamId: 't8', homeScore: null, awayScore: null, winnerId: null },
      { id: 'c5-qf2', matchId: 'm30', homeTeamId: 't5', awayTeamId: 't4', homeScore: null, awayScore: null, winnerId: null },
    ],
  },
  {
    id: 'c5-sf',
    name: 'Semifinais',
    matches: [
      { id: 'c5-sf1', matchId: null, homeTeamId: null, awayTeamId: null, homeScore: null, awayScore: null, winnerId: null },
    ],
  },
]

// ── Championships registry ──────────────────────────────────────────────────────

const REGULATION_DEFAULT =
  'Fase classificatória em grupos. As melhores equipes de cada grupo avançam para os ' +
  'playoffs em formato mata-mata. Critérios de desempate, nesta ordem: número de vitórias, ' +
  'saldo de pontos e pontos pró. Em caso de empate na fase final, decide o confronto direto.'

const MOCK_CHAMPIONSHIPS: Championship[] = [
  {
    id: C1,
    name: 'Liga Metropolitana',
    season: '2025/26',
    category: 'Adulto Masculino',
    status: 'PLAYOFFS',
    currentPhase: 'SEMIS',
    teamIds: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'],
    matchCount: 13,
    finishedMatchCount: 10,
    startDate: '2026-05-04',
    endDate: '2026-06-20',
    updatedAt: '2026-06-12T20:42:00',
    statsStatus: 'PARTIAL',
    regulation: REGULATION_DEFAULT,
    groups: c1Groups,
    leaders: c1Leaders,
    bracket: c1Bracket,
    championTeamId: null,
  },
  {
    id: C2,
    name: 'Copa de Inverno',
    season: '2025',
    category: 'Adulto Masculino',
    status: 'IN_PROGRESS',
    currentPhase: 'GROUPS',
    teamIds: ['t1', 't3', 't5', 't6', 't8'],
    matchCount: 7,
    finishedMatchCount: 5,
    startDate: '2026-06-01',
    endDate: '2026-07-05',
    updatedAt: '2026-06-08T21:10:00',
    statsStatus: 'PARTIAL',
    regulation: REGULATION_DEFAULT,
    groups: c2Groups,
    leaders: c2Leaders,
    bracket: [],
    championTeamId: null,
  },
  {
    id: C5,
    name: 'Copa Regional',
    season: '2025',
    category: 'Adulto Masculino',
    status: 'IN_PROGRESS',
    currentPhase: 'QUARTERS',
    teamIds: ['t1', 't4', 't5', 't6', 't7', 't8'],
    matchCount: 5,
    finishedMatchCount: 3,
    startDate: '2026-05-25',
    endDate: '2026-06-28',
    updatedAt: '2026-05-29T20:55:00',
    statsStatus: 'PARTIAL',
    regulation: REGULATION_DEFAULT,
    groups: c5Groups,
    leaders: c5Leaders,
    bracket: c5Bracket,
    championTeamId: null,
  },
  {
    id: 'c4',
    name: 'Liga Feminina',
    season: '2025/26',
    category: 'Adulto Feminino',
    status: 'SCHEDULED',
    currentPhase: 'GROUPS',
    teamIds: ['t2', 't3', 't4', 't6'],
    matchCount: 0,
    finishedMatchCount: 0,
    startDate: '2026-07-12',
    endDate: '2026-08-30',
    updatedAt: '2026-06-05T14:00:00',
    statsStatus: 'PENDING',
    regulation: REGULATION_DEFAULT,
    groups: [],
    leaders: { ppg: [], rpg: [], apg: [], stg: [], bpg: [] },
    bracket: [],
    championTeamId: null,
  },
  {
    id: C3,
    name: 'Torneio Sub-19',
    season: '2025',
    category: 'Sub-19 Masculino',
    status: 'FINISHED',
    currentPhase: 'FINISHED',
    teamIds: ['t2', 't4', 't7', 't8'],
    matchCount: 5,
    finishedMatchCount: 5,
    startDate: '2026-03-10',
    endDate: '2026-03-29',
    updatedAt: '2026-03-29T21:30:00',
    statsStatus: 'COMPLETE',
    regulation: REGULATION_DEFAULT,
    groups: c3Groups,
    leaders: c3Leaders,
    bracket: c3Bracket,
    championTeamId: 't4',
  },
  {
    id: 'c6',
    name: 'Taça Outono',
    season: '2025',
    category: 'Adulto Masculino',
    status: 'CANCELED',
    currentPhase: 'GROUPS',
    teamIds: ['t1', 't5', 't7'],
    matchCount: 0,
    finishedMatchCount: 0,
    startDate: '2026-04-05',
    endDate: '2026-05-10',
    updatedAt: '2026-04-01T09:20:00',
    statsStatus: 'PENDING',
    regulation: REGULATION_DEFAULT,
    groups: [],
    leaders: { ppg: [], rpg: [], apg: [], stg: [], bpg: [] },
    bracket: [],
    championTeamId: null,
  },
  // ── C7 — Supercopa Nacional (PLAYOFFS · Oitavas de final · 16 times · 4 grupos) — ⚠️ MOCK
  {
    id: 'c7',
    name: 'Supercopa Nacional',
    season: '2025/26',
    category: 'Adulto Masculino',
    status: 'PLAYOFFS',
    currentPhase: 'ROUNDS_OF_16',
    teamIds: ['t1','t2','t3','t4','t5','t6','t7','t8','t9','t10','t11','t12','t13','t14','t15','t16'],
    matchCount: 39,
    finishedMatchCount: 28,
    startDate: '2026-04-15',
    endDate: '2026-07-20',
    updatedAt: '2026-06-07T22:05:00',
    statsStatus: 'PARTIAL',
    regulation: REGULATION_DEFAULT,
    groups: [
      group('c7-ga', 'Grupo A', [['t1',3,3,0,234,187],['t2',3,2,1,221,198],['t3',3,1,2,208,218],['t4',3,0,3,194,254]]),
      group('c7-gb', 'Grupo B', [['t5',3,3,0,241,195],['t6',3,2,1,224,207],['t7',3,1,2,203,221],['t8',3,0,3,188,233]]),
      group('c7-gc', 'Grupo C', [['t9',3,3,0,252,199],['t10',3,2,1,228,218],['t11',3,1,2,209,224],['t12',3,0,3,192,240]]),
      group('c7-gd', 'Grupo D', [['t13',3,3,0,245,201],['t14',3,2,1,218,209],['t15',3,1,2,205,221],['t16',3,0,3,187,224]]),
    ],
    leaders: {
      ppg: [
        { athleteId:'a1', athleteName:'Rafael Moura', teamId:'t1', value:22.1, gamesPlayed:3 },
        { athleteId:'a5', athleteName:'Henrique Sales', teamId:'t6', value:21.4, gamesPlayed:3 },
        { athleteId:'a3', athleteName:'Caio Bittencourt', teamId:'t4', value:20.8, gamesPlayed:3 },
      ],
      rpg: [
        { athleteId:'a6', athleteName:'Túlio Ramires', teamId:'t1', value:10.5, gamesPlayed:3 },
        { athleteId:'a7', athleteName:'Bruno Capela', teamId:'t3', value:9.8, gamesPlayed:3 },
        { athleteId:'a9', athleteName:'Pedro Tavares', teamId:'t6', value:8.9, gamesPlayed:3 },
      ],
      apg: [
        { athleteId:'a10', athleteName:'Gabriel Pires', teamId:'t2', value:7.2, gamesPlayed:3 },
        { athleteId:'a11', athleteName:'Vitor Hugo', teamId:'t1', value:6.9, gamesPlayed:3 },
        { athleteId:'a14', athleteName:'André Nunes', teamId:'t6', value:5.8, gamesPlayed:3 },
      ],
      stg: [
        { athleteId:'a11', athleteName:'Vitor Hugo', teamId:'t1', value:2.3, gamesPlayed:3 },
        { athleteId:'a10', athleteName:'Gabriel Pires', teamId:'t2', value:1.9, gamesPlayed:3 },
        { athleteId:'a13', athleteName:'Felipe Castro', teamId:'t5', value:1.7, gamesPlayed:3 },
      ],
      bpg: [
        { athleteId:'a6', athleteName:'Túlio Ramires', teamId:'t1', value:1.8, gamesPlayed:3 },
        { athleteId:'a16', athleteName:'Otávio Brandão', teamId:'t4', value:1.4, gamesPlayed:3 },
        { athleteId:'a9', athleteName:'Pedro Tavares', teamId:'t6', value:1.1, gamesPlayed:3 },
      ],
    },
    bracket: [
      {
        id: 'c7-o', name: 'Oitavas de final',
        matches: [
          { id:'c7-o1', matchId:'m31', homeTeamId:'t1', awayTeamId:'t16', homeScore:88, awayScore:62, winnerId:'t1' },
          { id:'c7-o2', matchId:'m32', homeTeamId:'t9', awayTeamId:'t8',  homeScore:91, awayScore:83, winnerId:'t9' },
          { id:'c7-o3', matchId:'m33', homeTeamId:'t5', awayTeamId:'t12', homeScore:84, awayScore:79, winnerId:'t5' },
          { id:'c7-o4', matchId:'m34', homeTeamId:'t13',awayTeamId:'t4',  homeScore:77, awayScore:74, winnerId:'t13' },
          { id:'c7-o5', matchId:'m35', homeTeamId:'t2', awayTeamId:'t15', homeScore:null, awayScore:null, winnerId:null },
          { id:'c7-o6', matchId:'m36', homeTeamId:'t10',awayTeamId:'t7',  homeScore:null, awayScore:null, winnerId:null },
          { id:'c7-o7', matchId:'m37', homeTeamId:'t6', awayTeamId:'t11', homeScore:null, awayScore:null, winnerId:null },
          { id:'c7-o8', matchId:'m38', homeTeamId:'t14',awayTeamId:'t3',  homeScore:null, awayScore:null, winnerId:null },
        ],
      },
      {
        id: 'c7-q', name: 'Quartas de final',
        matches: [
          { id:'c7-q1', matchId:null, homeTeamId:null, awayTeamId:null, homeScore:null, awayScore:null, winnerId:null },
          { id:'c7-q2', matchId:null, homeTeamId:null, awayTeamId:null, homeScore:null, awayScore:null, winnerId:null },
          { id:'c7-q3', matchId:null, homeTeamId:null, awayTeamId:null, homeScore:null, awayScore:null, winnerId:null },
          { id:'c7-q4', matchId:null, homeTeamId:null, awayTeamId:null, homeScore:null, awayScore:null, winnerId:null },
        ],
      },
      {
        id: 'c7-s', name: 'Semifinais',
        matches: [
          { id:'c7-s1', matchId:null, homeTeamId:null, awayTeamId:null, homeScore:null, awayScore:null, winnerId:null },
          { id:'c7-s2', matchId:null, homeTeamId:null, awayTeamId:null, homeScore:null, awayScore:null, winnerId:null },
        ],
      },
      {
        id: 'c7-f', name: 'Final',
        matches: [
          { id:'c7-f1', matchId:null, homeTeamId:null, awayTeamId:null, homeScore:null, awayScore:null, winnerId:null },
        ],
      },
    ],
    championTeamId: null,
  },
]

const c7Matches: Match[] = [
  mkMatch('c7','Oitavas de final','2026-06-07T15:00:00','t1','t16',88,62,'FINISHED','Arena Nacional','COMPLETE'),
  mkMatch('c7','Oitavas de final','2026-06-07T17:00:00','t9','t8',91,83,'FINISHED','Arena Nacional','COMPLETE'),
  mkMatch('c7','Oitavas de final','2026-06-07T19:00:00','t5','t12',84,79,'FINISHED','Arena Nacional','COMPLETE'),
  mkMatch('c7','Oitavas de final','2026-06-07T21:00:00','t13','t4',77,74,'FINISHED','Arena Nacional','COMPLETE'),
  mkMatch('c7','Oitavas de final','2026-06-14T15:00:00','t2','t15',null,null,'SCHEDULED','Arena Nacional','PENDING'),
  mkMatch('c7','Oitavas de final','2026-06-14T17:00:00','t10','t7',null,null,'SCHEDULED','Arena Nacional','PENDING'),
  mkMatch('c7','Oitavas de final','2026-06-14T19:00:00','t6','t11',null,null,'SCHEDULED','Arena Nacional','PENDING'),
  mkMatch('c7','Oitavas de final','2026-06-14T21:00:00','t14','t3',null,null,'SCHEDULED','Arena Nacional','PENDING'),
]

// ── Accessors (mirror a future async API; currently synchronous) ─────────────────

export function getTeams(): Team[] {
  return MOCK_TEAMS
}

export function getChampionships(): Championship[] {
  return MOCK_CHAMPIONSHIPS
}

export function getChampionshipById(id: string): Championship | undefined {
  return MOCK_CHAMPIONSHIPS.find((c) => c.id === id)
}

export function getMatchesByChampionship(championshipId: string): Match[] {
  return MOCK_MATCHES.filter((m) => m.championshipId === championshipId)
}

/** Distinct seasons present in the data — feeds the list filter. */
export function getSeasons(): string[] {
  return [...new Set(MOCK_CHAMPIONSHIPS.map((c) => c.season))].sort().reverse()
}

/** All matches across all championships. */
export function getAllMatches(): Match[] {
  return MOCK_MATCHES
}

// ── Per-match box score data ─────────────────────────────────────────────────────
// ⚠️ MOCK only — delete when real API lands. PTS check: PTS = 2*fgm + tpm + ftm

function mkPlayer(
  athleteId: string, athleteName: string, number: number,
  min: number, pts: number, reb: number, ast: number, stl: number, blk: number,
  plusMinus: number, to: number, pf: number,
  fgm: number, fga: number, tpm: number, tpa: number, ftm: number, fta: number,
): PlayerMatchStats {
  return { athleteId, athleteName, number, min, pts, reb, ast, stl, blk, plusMinus, to, pf, fgm, fga, tpm, tpa, ftm, fta }
}

function mkTeam(teamId: string, players: PlayerMatchStats[]): TeamMatchStats {
  return { teamId, players }
}

/** Build a dynamic period score list from [homePoints, awayPoints] pairs.
 * Periods 1–4 are REGULAR; period 5+ are OVERTIME (OT, 2OT, …).
 * Pass null for either value when the period has not been played yet. */
function mkPeriods(
  ...pairs: Array<[number | null, number | null]>
): PeriodScore[] {
  return pairs.map(([home, away], idx) => {
    const periodNumber = idx + 1
    const isOT = periodNumber > 4
    return {
      periodNumber,
      type: isOT ? 'OVERTIME' : 'REGULAR',
      overtimeNumber: isOT ? periodNumber - 4 : null,
      homePoints: home,
      awayPoints: away,
    }
  })
}

// ─ m1: t1(88) vs t7(71) ─ COMPLETE ──────────────────────────────────────────────
const M1_T1 = mkTeam('t1', [
  mkPlayer('a1', 'Rafael Moura',    3,  34, 28,  4, 5, 2, 0,  18, 2, 2, 10, 19, 2, 5, 6, 8),
  mkPlayer('a6', 'Túlio Ramires',  33,  32, 16, 11, 1, 1, 2,  14, 1, 3,  6, 11, 0, 1, 4, 5),
  mkPlayer('a11','Vitor Hugo',       7,  30, 12,  4, 9, 3, 0,  12, 2, 2,  4,  9, 2, 6, 2, 2),
  mkPlayer('a17','Tiago Freitas',   11,  26, 14,  3, 2, 1, 0,  10, 1, 2,  5, 11, 2, 5, 2, 2),
  mkPlayer('a18','Marcelo Borges',  21,  22, 10,  5, 1, 0, 1,   6, 2, 3,  4,  8, 0, 2, 2, 3),
  mkPlayer('a19','Diego Souza',     14,  18,  8,  3, 1, 0, 0,   4, 1, 1,  3,  7, 0, 1, 2, 2),
  mkPlayer('a20','Leandro Matos',    5,  38,  0,  5, 2, 0, 0,   2, 2, 3,  0,  3, 0, 1, 0, 0),
])
const M1_T7 = mkTeam('t7', [
  mkPlayer('a38','Alex Santos',      4,  36, 18,  6, 3, 1, 1, -18, 3, 3,  6, 13, 1, 3, 5, 7),
  mkPlayer('a39','Fernando Lemos', 50,  33, 15,  8, 2, 0, 2, -14, 2, 4,  5, 11, 1, 4, 4, 5),
  mkPlayer('a40','Paulo César',    28,  28, 13,  4, 4, 2, 0,  -8, 2, 2,  5, 10, 0, 2, 3, 4),
  mkPlayer('a41','Rodrigo Lima',     6,  22, 12,  5, 1, 0, 0,  -6, 1, 3,  4,  9, 2, 5, 2, 2),
  mkPlayer('a42','Marcos Felipe',  14,  25,  8,  5, 2, 0, 1,  -4, 2, 2,  3,  7, 0, 2, 2, 3),
  mkPlayer('a48','Sérgio Lima',    17,  28,  5,  3, 1, 0, 0,  -3, 1, 1,  2,  5, 0, 1, 1, 2),
  mkPlayer('a49','Cláudio Melo',   22,  28,  0,  4, 1, 0, 0,  -2, 1, 1,  0,  4, 0, 1, 0, 0),
])

// ─ m2: t4(79) vs t5(74) ─ COMPLETE ──────────────────────────────────────────────
const M2_T4 = mkTeam('t4', [
  mkPlayer('a3', 'Caio Bittencourt',23, 36, 22,  8, 3, 2, 1,   5, 2, 2,  8, 15, 1, 4, 5, 7),
  mkPlayer('a12','Eduardo Lima',    1,  32, 16,  4, 6, 2, 0,   4, 2, 2,  6, 12, 2, 5, 2, 2),
  mkPlayer('a16','Otávio Brandão',34,  30, 14, 10, 1, 1, 2,   2, 1, 3,  5, 10, 0, 1, 4, 5),
  mkPlayer('a28','Jonas Silva',    17,  26, 12,  4, 1, 0, 0,   4, 1, 3,  4,  9, 2, 5, 2, 2),
  mkPlayer('a29','Enzo Carvalho',  25,  22,  8,  3, 1, 0, 0,   2, 1, 2,  3,  7, 0, 2, 2, 3),
  mkPlayer('a30','André Lima',     11,  30,  4,  4, 1, 0, 0,   0, 1, 2,  2,  6, 0, 2, 0, 0),
  mkPlayer('a52','Bruno Motta',    32,  24,  3,  3, 1, 0, 0,   2, 0, 1,  1,  4, 1, 2, 0, 0),
])
const M2_T5 = mkTeam('t5', [
  mkPlayer('a13','Felipe Castro',   5,  36, 20,  5, 6, 2, 0,  -5, 2, 2,  7, 14, 2, 6, 4, 5),
  mkPlayer('a31','Robson Freire',  24,  32, 16,  6, 2, 1, 0,  -4, 2, 3,  5, 11, 1, 4, 5, 6),
  mkPlayer('a32','Nelson Cruz',    42,  28, 14,  8, 1, 0, 1,  -2, 2, 4,  5, 10, 1, 3, 3, 4),
  mkPlayer('a33','Paulo Henrique',  3,  26, 12,  4, 2, 0, 0,  -2, 1, 2,  4,  9, 2, 5, 2, 2),
  mkPlayer('a34','Sandro Lima',    16,  22,  8,  5, 1, 0, 0,  -2, 1, 2,  3,  7, 0, 2, 2, 3),
  mkPlayer('a55','Lucas Gomes',     9,  30,  4,  4, 1, 0, 0,   2, 1, 1,  2,  5, 0, 1, 0, 0),
  mkPlayer('a56','Bruno Santos',   27,  26,  0,  4, 1, 0, 0,   0, 1, 1,  0,  3, 0, 1, 0, 0),
])

// ─ m3: t2(95) vs t8(68) ─ COMPLETE ──────────────────────────────────────────────
const M3_T2 = mkTeam('t2', [
  mkPlayer('a2', 'Diego Valente',   8,  36, 26,  3, 3, 2, 1,  22, 2, 2,  9, 17, 2, 6, 6, 8),
  mkPlayer('a8', 'Marcos Vinícius',35,  33, 22,  9, 2, 1, 1,  18, 1, 3,  8, 15, 1, 4, 5, 6),
  mkPlayer('a10','Gabriel Pires',   4,  32, 18,  4, 8, 2, 0,  16, 3, 1,  7, 13, 0, 2, 4, 5),
  mkPlayer('a21','Renato Campos',  12,  26, 14,  5, 1, 1, 0,  10, 1, 2,  5, 10, 2, 5, 2, 2),
  mkPlayer('a22','Fábio Costa',    22,  22,  8,  6, 1, 0, 1,   8, 1, 3,  3,  7, 0, 2, 2, 3),
  mkPlayer('a23','Giovani Leal',   15,  18,  5,  3, 1, 0, 0,   4, 1, 1,  2,  5, 0, 1, 1, 2),
  mkPlayer('a24','Samuel Torres',   9,  33,  2,  4, 2, 0, 0,   2, 0, 2,  1,  4, 0, 1, 0, 0),
])
const M3_T8 = mkTeam('t8', [
  mkPlayer('a43','Wesley Silva',   11,  34, 18,  4, 3, 1, 0, -22, 3, 3,  6, 13, 2, 5, 4, 5),
  mkPlayer('a44','Ivan Pinto',     22,  32, 14,  8, 1, 0, 1, -18, 2, 4,  5, 11, 1, 4, 3, 4),
  mkPlayer('a45','Rafael Nunes',    7,  28, 12,  5, 2, 2, 0, -14, 2, 2,  4,  9, 2, 5, 2, 2),
  mkPlayer('a46','Claudio Barbosa',33,  25,  8,  4, 1, 0, 1,  -8, 2, 3,  3,  8, 0, 2, 2, 3),
  mkPlayer('a47','Gustavo Lima',   44,  22,  8,  5, 1, 0, 0,  -6, 1, 2,  3,  7, 0, 2, 2, 3),
  mkPlayer('a50','Éder Moura',     14,  30,  6,  4, 1, 0, 0,  -4, 1, 1,  2,  6, 1, 3, 1, 2),
  mkPlayer('a51','Filipe Neto',    20,  29,  2,  3, 1, 0, 0,  -3, 0, 1,  1,  4, 0, 1, 0, 1),
])

// ─ m4: t3(81) vs t6(77) ─ PARTIAL (apenas t3) ──────────────────────────────
const M4_T3 = mkTeam('t3', [
  mkPlayer('a4', 'Lucas Andrade',  10,  35, 24,  4, 6, 2, 0,   4, 2, 1,  8, 16, 2, 6, 6, 7),
  mkPlayer('a7', 'Bruno Capela',   44,  33, 18, 11, 1, 0, 2,   2, 1, 4,  6, 11, 0, 1, 6, 7),
  mkPlayer('a15','Rodrigo Paz',     2,  30, 14,  4, 5, 2, 0,   2, 2, 2,  5, 10, 2, 5, 2, 2),
  mkPlayer('a25','Thiago Mello',    6,  25, 12,  4, 1, 1, 0,   2, 1, 2,  4,  9, 2, 5, 2, 2),
  mkPlayer('a26','César Neves',    19,  22,  9,  5, 1, 0, 0,   0, 1, 3,  3,  7, 0, 2, 3, 4),
  mkPlayer('a27','Matheus Rocha',  30,  20,  4,  3, 1, 0, 0,   0, 1, 1,  2,  5, 0, 1, 0, 0),
  mkPlayer('a53','Fábio Dias',     15,  35,  0,  4, 1, 0, 0,   0, 1, 2,  0,  3, 0, 1, 0, 0),
])

// ─ m5: t1(84) vs t4(80) ─ COMPLETE ──────────────────────────────────────────────
const M5_T1 = mkTeam('t1', [
  mkPlayer('a1', 'Rafael Moura',    3,  35, 24,  4, 4, 2, 0,   4, 2, 2,  8, 16, 2, 5, 6, 8),
  mkPlayer('a6', 'Túlio Ramires',  33,  33, 14, 10, 1, 1, 2,   2, 1, 3,  5, 10, 0, 1, 4, 5),
  mkPlayer('a11','Vitor Hugo',       7,  30, 16,  4, 7, 3, 0,   6, 3, 2,  6, 12, 2, 6, 2, 2),
  mkPlayer('a17','Tiago Freitas',   11,  26, 14,  3, 1, 0, 0,   2, 1, 2,  5, 10, 2, 5, 2, 2),
  mkPlayer('a18','Marcelo Borges',  21,  22,  8,  5, 1, 0, 1,   2, 2, 3,  3,  7, 0, 2, 2, 3),
  mkPlayer('a19','Diego Souza',     14,  18,  6,  3, 1, 0, 0,  -2, 1, 1,  2,  6, 1, 3, 1, 2),
  mkPlayer('a20','Leandro Matos',    5,  36,  2,  5, 2, 0, 0,   0, 2, 3,  1,  4, 0, 1, 0, 0),
])
const M5_T4 = mkTeam('t4', [
  mkPlayer('a3', 'Caio Bittencourt',23, 36, 22,  8, 3, 2, 1,  -4, 2, 2,  8, 15, 1, 4, 5, 7),
  mkPlayer('a12','Eduardo Lima',    1,  32, 16,  4, 5, 2, 0,  -2, 2, 2,  6, 12, 2, 5, 2, 2),
  mkPlayer('a16','Otávio Brandão',34,  30, 14, 10, 1, 1, 2,  -2, 1, 3,  5, 10, 0, 1, 4, 5),
  mkPlayer('a28','Jonas Silva',    17,  26, 12,  4, 1, 0, 0,  -2, 1, 3,  4,  9, 2, 5, 2, 2),
  mkPlayer('a29','Enzo Carvalho',  25,  22, 10,  3, 1, 0, 0,   0, 1, 2,  4,  8, 0, 2, 2, 3),
  mkPlayer('a30','André Lima',     11,  30,  4,  4, 1, 0, 0,   2, 1, 2,  2,  6, 0, 2, 0, 0),
  mkPlayer('a52','Bruno Motta',    32,  24,  2,  3, 0, 0, 0,  -2, 0, 1,  1,  4, 0, 1, 0, 0),
])

// ─ m6: t2(90) vs t3(85) ─ COMPLETE ──────────────────────────────────────────────
const M6_T2 = mkTeam('t2', [
  mkPlayer('a2', 'Diego Valente',   8,  36, 24,  4, 3, 2, 1,   6, 2, 2,  8, 16, 2, 5, 6, 8),
  mkPlayer('a8', 'Marcos Vinícius',35,  33, 18,  9, 2, 1, 1,   4, 1, 3,  6, 12, 1, 4, 5, 6),
  mkPlayer('a10','Gabriel Pires',   4,  32, 20,  4, 9, 2, 0,   8, 3, 1,  7, 14, 3, 7, 3, 3),
  mkPlayer('a21','Renato Campos',  12,  26, 14,  5, 1, 1, 0,   4, 1, 2,  5, 10, 2, 5, 2, 2),
  mkPlayer('a22','Fábio Costa',    22,  22,  8,  5, 1, 0, 1,   2, 2, 3,  3,  7, 0, 2, 2, 3),
  mkPlayer('a23','Giovani Leal',   15,  18,  4,  3, 1, 0, 0,   2, 0, 1,  2,  5, 0, 1, 0, 0),
  mkPlayer('a24','Samuel Torres',   9,  33,  2,  4, 2, 0, 0,   0, 1, 2,  1,  4, 0, 1, 0, 0),
])
const M6_T3 = mkTeam('t3', [
  mkPlayer('a4', 'Lucas Andrade',  10,  36, 24,  4, 7, 2, 0,  -6, 2, 1,  8, 15, 2, 6, 6, 7),
  mkPlayer('a7', 'Bruno Capela',   44,  33, 16, 11, 1, 0, 2,  -4, 1, 4,  6, 11, 0, 1, 4, 5),
  mkPlayer('a15','Rodrigo Paz',     2,  30, 14,  4, 6, 2, 0,  -4, 2, 2,  5, 10, 2, 5, 2, 2),
  mkPlayer('a25','Thiago Mello',    6,  26, 14,  4, 1, 1, 0,  -4, 1, 2,  5, 10, 2, 5, 2, 2),
  mkPlayer('a26','César Neves',    19,  22, 10,  5, 1, 0, 0,  -2, 1, 3,  4,  8, 0, 2, 2, 3),
  mkPlayer('a27','Matheus Rocha',  30,  18,  5,  4, 1, 0, 0,  -2, 1, 1,  2,  5, 0, 1, 1, 2),
  mkPlayer('a53','Fábio Dias',     15,  35,  2,  4, 1, 0, 0,   0, 0, 2,  1,  4, 0, 1, 0, 0),
])

// ─ m7: t1(92) vs t6(78) ─ COMPLETE ──────────────────────────────────────────────
const M7_T1 = mkTeam('t1', [
  mkPlayer('a1', 'Rafael Moura',    3,  36, 26,  4, 5, 2, 0,  14, 2, 2,  9, 18, 2, 6, 6, 8),
  mkPlayer('a6', 'Túlio Ramires',  33,  32, 18, 10, 1, 1, 2,  12, 1, 3,  6, 11, 0, 1, 6, 7),
  mkPlayer('a11','Vitor Hugo',       7,  32, 16,  4, 8, 3, 0,  14, 2, 2,  5, 10, 2, 6, 4, 4),
  mkPlayer('a17','Tiago Freitas',   11,  26, 16,  3, 2, 0, 0,   8, 1, 2,  6, 11, 2, 6, 2, 2),
  mkPlayer('a18','Marcelo Borges',  21,  22, 10,  5, 1, 0, 1,   4, 2, 3,  4,  8, 0, 2, 2, 3),
  mkPlayer('a19','Diego Souza',     14,  18,  6,  3, 1, 0, 0,   2, 1, 1,  2,  6, 1, 3, 1, 2),
  mkPlayer('a20','Leandro Matos',    5,  34,  0,  5, 2, 0, 0,   0, 2, 3,  0,  3, 0, 1, 0, 0),
])
const M7_T6 = mkTeam('t6', [
  mkPlayer('a5', 'Henrique Sales',  20,  36, 22,  4, 4, 2, 0, -14, 2, 2,  8, 15, 2, 5, 4, 5),
  mkPlayer('a9', 'Pedro Tavares',   31,  33, 16,  9, 2, 0, 1, -12, 1, 3,  5, 10, 1, 3, 5, 6),
  mkPlayer('a14','André Nunes',     13,  30, 14,  4, 5, 3, 0, -10, 2, 2,  5, 10, 2, 5, 2, 2),
  mkPlayer('a35','Victor Alves',     7,  26, 12,  5, 1, 1, 0,  -8, 1, 3,  4,  9, 2, 5, 2, 2),
  mkPlayer('a36','Daniel Moreira',  18,  22,  8,  5, 1, 0, 0,  -4, 2, 2,  3,  7, 0, 2, 2, 3),
  mkPlayer('a37','João Paulo',      27,  18,  4,  3, 1, 0, 0,  -2, 1, 1,  2,  5, 0, 1, 0, 0),
  mkPlayer('a54','Marco Braga',     32,  35,  2,  4, 1, 0, 0,   0, 1, 2,  1,  4, 0, 1, 0, 0),
])

// ─ m8: t2(87) vs t5(73) ─ COMPLETE ──────────────────────────────────────────────
const M8_T2 = mkTeam('t2', [
  mkPlayer('a2', 'Diego Valente',   8,  35, 22,  3, 3, 2, 1,  12, 2, 2,  7, 15, 2, 5, 6, 7),
  mkPlayer('a8', 'Marcos Vinícius',35,  32, 20,  9, 2, 1, 1,  10, 1, 3,  7, 13, 1, 4, 5, 6),
  mkPlayer('a10','Gabriel Pires',   4,  32, 18,  4, 8, 2, 0,  12, 3, 1,  6, 12, 3, 7, 3, 3),
  mkPlayer('a21','Renato Campos',  12,  26, 14,  5, 1, 1, 0,   6, 1, 2,  5, 10, 2, 5, 2, 2),
  mkPlayer('a22','Fábio Costa',    22,  22,  8,  5, 1, 0, 1,   4, 1, 3,  3,  7, 0, 2, 2, 3),
  mkPlayer('a23','Giovani Leal',   15,  18,  3,  3, 1, 0, 0,   2, 0, 1,  1,  4, 1, 2, 0, 0),
  mkPlayer('a24','Samuel Torres',   9,  35,  2,  4, 1, 0, 0,   0, 1, 2,  1,  4, 0, 1, 0, 0),
])
const M8_T5 = mkTeam('t5', [
  mkPlayer('a13','Felipe Castro',   5,  36, 20,  5, 6, 2, 0, -12, 2, 2,  7, 14, 2, 6, 4, 5),
  mkPlayer('a31','Robson Freire',  24,  32, 16,  6, 2, 1, 0,  -8, 2, 3,  5, 11, 1, 4, 5, 6),
  mkPlayer('a32','Nelson Cruz',    42,  28, 14,  8, 1, 0, 1,  -6, 2, 4,  5, 10, 1, 3, 3, 4),
  mkPlayer('a33','Paulo Henrique',  3,  26, 12,  4, 2, 0, 0,  -4, 1, 2,  4,  9, 2, 5, 2, 2),
  mkPlayer('a34','Sandro Lima',    16,  22,  8,  5, 1, 0, 0,  -2, 1, 2,  3,  7, 0, 2, 2, 3),
  mkPlayer('a55','Lucas Gomes',     9,  30,  3,  4, 1, 0, 0,  -2, 1, 1,  1,  4, 1, 2, 0, 0),
  mkPlayer('a56','Bruno Santos',   27,  26,  0,  4, 1, 0, 0,   0, 1, 1,  0,  3, 0, 1, 0, 0),
])

// ─ m9: t4(76) vs t3(82) ─ COMPLETE ──────────────────────────────────────────────
const M9_T4 = mkTeam('t4', [
  mkPlayer('a3', 'Caio Bittencourt',23, 34, 20,  7, 3, 1, 1,  -6, 2, 2,  7, 15, 1, 4, 5, 7),
  mkPlayer('a12','Eduardo Lima',    1,  32, 14,  4, 5, 2, 0,  -4, 2, 2,  5, 11, 2, 5, 2, 2),
  mkPlayer('a16','Otávio Brandão',34,  30, 12,  9, 1, 1, 2,  -4, 1, 3,  4, 10, 0, 1, 4, 5),
  mkPlayer('a28','Jonas Silva',    17,  26, 12,  4, 1, 0, 0,  -4, 1, 3,  4,  9, 2, 5, 2, 2),
  mkPlayer('a29','Enzo Carvalho',  25,  22, 10,  3, 1, 0, 0,  -2, 1, 2,  4,  8, 0, 2, 2, 3),
  mkPlayer('a30','André Lima',     11,  30,  6,  4, 1, 0, 0,   0, 1, 2,  3,  6, 0, 1, 0, 0),
  mkPlayer('a52','Bruno Motta',    32,  26,  2,  3, 0, 0, 0,   0, 0, 1,  1,  4, 0, 1, 0, 0),
])
const M9_T3 = mkTeam('t3', [
  mkPlayer('a4', 'Lucas Andrade',  10,  36, 22,  4, 7, 2, 0,   6, 2, 1,  7, 14, 2, 5, 6, 7),
  mkPlayer('a7', 'Bruno Capela',   44,  32, 18, 11, 1, 0, 2,   4, 1, 4,  6, 11, 0, 1, 6, 7),
  mkPlayer('a15','Rodrigo Paz',     2,  30, 14,  4, 6, 2, 0,   4, 2, 2,  5, 10, 2, 5, 2, 2),
  mkPlayer('a25','Thiago Mello',    6,  26, 12,  4, 1, 1, 0,   4, 1, 2,  4,  9, 2, 5, 2, 2),
  mkPlayer('a26','César Neves',    19,  22, 10,  5, 1, 0, 0,   4, 1, 3,  4,  8, 0, 2, 2, 3),
  mkPlayer('a27','Matheus Rocha',  30,  18,  4,  3, 1, 0, 0,   2, 1, 1,  2,  5, 0, 1, 0, 0),
  mkPlayer('a53','Fábio Dias',     15,  36,  2,  4, 1, 0, 0,   2, 0, 2,  1,  4, 0, 1, 0, 0),
])

// ─ m10: t7(70) vs t6(88) ─ PARTIAL (apenas t6) ─────────────────────────────
const M10_T6 = mkTeam('t6', [
  mkPlayer('a5', 'Henrique Sales',  20,  36, 22,  4, 4, 2, 0,  18, 2, 2,  7, 14, 2, 5, 6, 7),
  mkPlayer('a9', 'Pedro Tavares',   31,  33, 18,  9, 2, 0, 1,  16, 1, 3,  6, 11, 1, 3, 5, 6),
  mkPlayer('a14','André Nunes',     13,  30, 16,  4, 5, 3, 0,  14, 2, 2,  5, 10, 2, 5, 4, 4),
  mkPlayer('a35','Victor Alves',     7,  26, 14,  5, 1, 1, 0,  10, 1, 3,  5, 10, 2, 5, 2, 2),
  mkPlayer('a36','Daniel Moreira',  18,  22, 10,  5, 1, 0, 0,   8, 2, 2,  4,  8, 0, 2, 2, 3),
  mkPlayer('a37','João Paulo',      27,  18,  6,  3, 1, 0, 0,   4, 1, 1,  3,  6, 0, 1, 0, 0),
  mkPlayer('a54','Marco Braga',     32,  35,  2,  4, 1, 0, 0,   2, 1, 2,  1,  4, 0, 1, 0, 0),
])

// ─ m11: t1(54) vs t3(49) ─ LIVE (intervalo) ───────────────────────────────
const M11_T1 = mkTeam('t1', [
  mkPlayer('a1', 'Rafael Moura',    3,  20, 18,  2, 3, 1, 0,   4, 1, 2,  6, 11, 2, 4, 4, 5),
  mkPlayer('a6', 'Túlio Ramires',  33,  20, 10,  5, 0, 0, 1,   4, 0, 2,  4,  7, 0, 0, 2, 3),
  mkPlayer('a11','Vitor Hugo',       7,  20, 10,  2, 4, 1, 0,   2, 1, 1,  4,  8, 1, 3, 1, 1),
  mkPlayer('a17','Tiago Freitas',   11,  20,  8,  2, 1, 1, 0,   2, 1, 1,  3,  7, 1, 3, 1, 1),
  mkPlayer('a18','Marcelo Borges',  21,  20,  8,  3, 0, 0, 1,   2, 1, 2,  3,  6, 0, 1, 2, 2),
])
const M11_T3 = mkTeam('t3', [
  mkPlayer('a4', 'Lucas Andrade',  10,  20, 14,  2, 3, 1, 0,  -4, 1, 1,  5,  9, 1, 4, 3, 4),
  mkPlayer('a7', 'Bruno Capela',   44,  20,  8,  5, 1, 0, 1,  -4, 0, 2,  3,  6, 0, 0, 2, 3),
  mkPlayer('a15','Rodrigo Paz',     2,  20,  8,  2, 3, 0, 0,  -2, 1, 1,  3,  7, 1, 3, 1, 1),
  mkPlayer('a25','Thiago Mello',    6,  20,  8,  2, 1, 1, 0,  -4, 1, 2,  3,  7, 1, 3, 1, 1),
  mkPlayer('a26','César Neves',    19,  20, 11,  3, 1, 0, 0,  -2, 0, 2,  4,  8, 1, 3, 2, 2),
])

// ─ mot1: t3(94) vs t2(91) ─ FINISHED com 1 overtime ─ COMPLETE ────────────────────
// Q1:24-22 Q2:20-26 Q3:22-18 Q4:20-20 (tie 86-86) OT:8-5 → 94-91
const MOT1_T3 = mkTeam('t3', [
  mkPlayer('a4', 'Lucas Andrade',  10, 38, 28,  5, 7, 2, 0,   6, 3, 2, 10, 20, 2,  7, 6, 8),
  mkPlayer('a7', 'Bruno Capela',   44, 38, 18, 12, 1, 0, 2,   4, 2, 3,  7, 12, 0,  0, 4, 6),
  mkPlayer('a15','Rodrigo Paz',     2, 36, 16,  4, 6, 2, 0,   4, 2, 1,  5, 11, 2,  6, 4, 5),
  mkPlayer('a25','Thiago Mello',    6, 32, 14,  4, 1, 1, 0,   3, 1, 2,  5, 10, 2,  5, 2, 2),
  mkPlayer('a26','César Neves',    19, 30, 12,  5, 1, 0, 0,   2, 1, 3,  4,  9, 2,  5, 2, 3),
  mkPlayer('a27','Matheus Rocha',  30, 22,  4,  3, 1, 0, 0,   1, 1, 1,  2,  5, 0,  1, 0, 0),
  mkPlayer('a53','Fábio Dias',     15, 18,  2,  4, 1, 0, 0,   0, 1, 2,  1,  3, 0,  1, 0, 0),
])
const MOT1_T2 = mkTeam('t2', [
  mkPlayer('a2', 'Diego Valente',   8, 38, 26,  4, 3, 2, 1,  -4, 3, 2,  9, 18, 2,  6, 6, 8),
  mkPlayer('a8', 'Marcos Vinícius',35, 36, 22,  9, 2, 1, 1,  -2, 2, 3,  8, 15, 1,  3, 5, 7),
  mkPlayer('a10','Gabriel Pires',   4, 36, 16,  4, 8, 2, 0,  -3, 3, 1,  5, 12, 2,  7, 4, 5),
  mkPlayer('a21','Renato Campos',  12, 30, 14,  5, 1, 1, 0,  -3, 1, 2,  5, 10, 2,  5, 2, 3),
  mkPlayer('a22','Fábio Costa',    22, 28,  8,  5, 1, 0, 0,  -2, 2, 3,  3,  7, 0,  2, 2, 3),
  mkPlayer('a23','Giovani Leal',   15, 20,  3,  3, 1, 0, 0,  -1, 1, 2,  1,  4, 1,  3, 0, 0),
  mkPlayer('a24','Samuel Torres',   9, 16,  2,  4, 2, 0, 0,   0, 1, 1,  1,  3, 0,  1, 0, 0),
])

/** Partida showcase: Lobos do Norte 94 × 91 Falcões da Serra — C1 Quartas de final, com 1 OT. */
const MOT1: Match = {
  id: 'mot1',
  championshipId: C1,
  phase: 'Quartas de final',
  date: '2026-05-22T19:00:00',
  homeTeamId: 't3',
  awayTeamId: 't2',
  homeScore: 94,
  awayScore: 91,
  status: 'FINISHED',
  venue: 'Ginásio Olímpico',
  statsStatus: 'COMPLETE',
}

const MOCK_MATCHES: Match[] = [...c1Matches, ...c2Matches, ...c3Matches, ...c5Matches, ...c7Matches, MOT1]

// ─ Master map (matchId → period scores + team stats) ─────────────────────────────
const MATCH_EXTRA: Record<string, {
  periodScores: PeriodScore[] | null
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
}> = {
  // m1: t1(88) vs t7(71)  — 23+22+25+18=88, 18+20+18+15=71
  m1:  { periodScores: mkPeriods([23,18],[22,20],[25,18],[18,15]), homeStats: M1_T1, awayStats: M1_T7 },
  // m2: t4(79) vs t5(74)  — 20+20+21+18=79, 16+20+18+20=74
  m2:  { periodScores: mkPeriods([20,16],[20,20],[21,18],[18,20]), homeStats: M2_T4, awayStats: M2_T5 },
  // m3: t2(95) vs t8(68)  — 24+26+22+23=95, 18+18+16+16=68
  m3:  { periodScores: mkPeriods([24,18],[26,18],[22,16],[23,16]), homeStats: M3_T2, awayStats: M3_T8 },
  // m4: t3(81) vs t6(77)  — 20+22+19+20=81, 18+20+20+19=77
  m4:  { periodScores: mkPeriods([20,18],[22,20],[19,20],[20,19]), homeStats: M4_T3, awayStats: mkTeam('t6',[]) },
  // m5: t1(84) vs t4(80)  — OT ⚠️  22+16+22+16+8=84, 18+20+20+18+4=80
  m5:  { periodScores: mkPeriods([22,18],[16,20],[22,20],[16,18],[8,4]), homeStats: M5_T1, awayStats: M5_T4 },
  // m6: t2(90) vs t3(85)  — 22+24+21+23=90, 20+22+22+21=85
  m6:  { periodScores: mkPeriods([22,20],[24,22],[21,22],[23,21]), homeStats: M6_T2, awayStats: M6_T3 },
  // m7: t1(92) vs t6(78)  — 24+22+24+22=92, 20+20+18+20=78
  m7:  { periodScores: mkPeriods([24,20],[22,20],[24,18],[22,20]), homeStats: M7_T1, awayStats: M7_T6 },
  // m8: t2(87) vs t5(73)  — 22+24+20+21=87, 18+20+18+17=73
  m8:  { periodScores: mkPeriods([22,18],[24,20],[20,18],[21,17]), homeStats: M8_T2, awayStats: M8_T5 },
  // m9: t4(76) vs t3(82)  — 20+18+20+18=76, 22+20+18+22=82
  m9:  { periodScores: mkPeriods([20,22],[18,20],[20,18],[18,22]), homeStats: M9_T4, awayStats: M9_T3 },
  // m10: t7(70) vs t6(88) — 18+17+18+17=70, 24+22+20+22=88
  m10: { periodScores: mkPeriods([18,24],[17,22],[18,20],[17,22]), homeStats: mkTeam('t7',[]), awayStats: M10_T6 },
  // m11: t1(54) vs t3(49) — LIVE, Q3 e Q4 ainda em andamento
  m11: { periodScores: mkPeriods([28,24],[26,25],[null,null],[null,null]), homeStats: M11_T1, awayStats: M11_T3 },
  // mot1: t3(94) vs t2(91) — Q1-Q4 empatado 86-86 + OT: 24+20+22+20+8=94, 22+26+18+20+5=91
  mot1: { periodScores: mkPeriods([24,22],[20,26],[22,18],[20,20],[8,5]), homeStats: MOT1_T3, awayStats: MOT1_T2 },
}

export function getMatchDetailById(id: string): MatchDetail | undefined {
  const match = MOCK_MATCHES.find((m) => m.id === id)
  if (!match) return undefined
  const extra = MATCH_EXTRA[id]
  return {
    ...match,
    periodScores: extra?.periodScores ?? null,
    homeStats: extra?.homeStats ?? { teamId: match.homeTeamId, players: [] },
    awayStats: extra?.awayStats ?? { teamId: match.awayTeamId, players: [] },
  }
}
