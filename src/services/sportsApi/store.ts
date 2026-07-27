import type {
  Match,
  MatchDetail,
  MatchMvp,
  PeriodScore,
  PlayerMatchStats,
  BracketRound,
  BracketSlot,
  RosterEntry,
  TeamMatchStats,
  TournamentTeam,
} from '../../features/sports/types'
import { periodsSum } from '../../features/sports/statistics'
import type {
  CreateBracketRoundInput,
  CreateBracketSlotInput,
  LinkSlotMatchInput,
  ScheduleMatchInput,
  PlayerBoxScoreInput,
  SetSlotWinnerInput,
  SubmitMatchResultInput,
  UpdateBracketRoundInput,
  UpdateBracketSlotInput,
} from './types'

/** The real `EnrollTeamInput` (Phase 3) narrowed to `{ tournamentId, teamId }` once the API
 *  started deriving `displayName`/`seed` server-side. The still-mock-only phases (groups,
 *  brackets, standings) seed their fixtures through this store directly and still need both. */
interface MockEnrollTeamInput {
  tournamentId: number
  teamId: number
  displayName: string
  seed?: number | null
}

/** `RosterEntryInput`/`UpdateRosterEntryInput` were replaced at the real HTTP boundary by
 *  `CreateTournamentRosterInput`/`UpdateTournamentRosterInput` (`userId`, optional jersey).
 *  The mock roster used by groups/brackets/standings fixtures keeps its own athleteId shape. */
interface MockRosterEntryInput {
  tournamentId: number
  tournamentTeamId: number
  athleteId: number
  jerseyNumber: number
  role: 'ATHLETE' | 'COACHING_STAFF'
}

interface MockUpdateRosterEntryInput {
  jerseyNumber?: number
  role?: 'ATHLETE' | 'COACHING_STAFF'
}

export interface SportsStoreSeed {
  matches: Match[]
  tournamentTeams?: TournamentTeam[]
  rosterEntries?: RosterEntry[]
  tournamentGroups?: MockTournamentGroup[]
  tournamentGroupTeams?: MockTournamentGroupTeam[]
  bracketRounds?: BracketRound[]
  bracketSlots?: BracketSlot[]
  /** Optional pre-computed match details (reference box scores for seeded matches). */
  matchDetails?: MatchDetail[]
}

export interface MatchExtra {
  periodScores: PeriodScore[] | null
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
  mvp: MatchMvp | null
}

type StoredMatch = Omit<Match, 'bracketRound'>

/** The canonical `TournamentTeam` dropped `isDeleted` once registrations moved to the real API
 *  (§ Phase 3). Withdrawal for the still-mock-only phases (groups, brackets, matches) keeps
 *  soft-deleting locally, so the store keeps its own superset type instead of exporting it. */
type MockTournamentTeam = TournamentTeam & { isDeleted?: boolean }

/** The canonical `TournamentGroup`/`TournamentGroupTeam` moved to the real API (Phase 4) and
 *  adopted the server's own field names and a server-owned `sortOrder`. The still-mock-only
 *  standings and match fixtures keep their own shape: a local `groupId` and a client-assigned
 *  `sortOrder` the store can compute deterministically for its seed data. */
export type MockTournamentGroup = {
  id: number
  tournamentId: number
  name: string
  sortOrder: number
  isDeleted?: boolean
}

export type MockTournamentGroupTeam = {
  id: number
  tournamentId: number
  groupId: number
  tournamentTeamId: number
  isDeleted?: boolean
}

interface MockCreateGroupInput {
  tournamentId: number
  name: string
  sortOrder?: number
}

interface MockAssignGroupTeamInput {
  tournamentId: number
  groupId: number
  tournamentTeamId: number
}

const isActive = (record: { isDeleted?: boolean }) => record.isDeleted !== true

export function createSportsStore(seed: SportsStoreSeed) {
  const matches: StoredMatch[] = seed.matches.map((match) => {
    const { bracketRound, ...rest } = match
    void bracketRound
    return rest
  })
  const tournamentTeams: MockTournamentTeam[] = seed.tournamentTeams?.map((entry) => ({ ...entry })) ?? []
  const rosterEntries: RosterEntry[] = seed.rosterEntries?.map((entry) => ({ ...entry })) ?? []
  const tournamentGroups: MockTournamentGroup[] = seed.tournamentGroups?.map((g) => ({ ...g })) ?? []
  const tournamentGroupTeams: MockTournamentGroupTeam[] = seed.tournamentGroupTeams?.map((g) => ({ ...g })) ?? []
  const bracketRounds: BracketRound[] = seed.bracketRounds?.map((round) => ({ ...round })) ?? []
  const bracketSlots: BracketSlot[] = seed.bracketSlots?.map((slot) => ({ ...slot })) ?? []
  const matchExtras = new Map<number, MatchExtra>()

  for (const detail of seed.matchDetails ?? []) {
    matchExtras.set(detail.id, {
      periodScores: detail.periodScores,
      homeStats: detail.homeStats,
      awayStats: detail.awayStats,
      mvp: detail.mvp,
    })
  }

  let nextNumericId = 10_000
  const nextId = () => nextNumericId++

  const emptyTeamStats = (tournamentTeamId: number): TeamMatchStats => ({ tournamentTeamId, players: [] })

  const toBoxScore = (
    tournamentTeamId: number,
    input: Exclude<SubmitMatchResultInput, { resultType: 'FORFEIT' }>,
  ): TeamMatchStats => ({
    tournamentTeamId,
    players: input.playerStats.flatMap<PlayerMatchStats>((line) => {
      const rosterEntry = rosterEntries.find((entry) => entry.id === line.tournamentRosterId && isActive(entry))
      if (!rosterEntry || rosterEntry.tournamentTeamId !== tournamentTeamId) return []
      return [{
        tournamentRosterId: rosterEntry.id,
        athleteId: rosterEntry.athleteId,
        athleteName: String(rosterEntry.athleteId),
        number: rosterEntry.jerseyNumber,
        minutesSeconds: line.minutesSeconds,
        pts: line.pts,
        reb: line.reb,
        ast: line.ast,
        stl: line.stl,
        blk: line.blk,
        tov: line.tov,
        pf: line.pf,
        fgm: line.fgm,
        fga: line.fga,
        threeFgm: line.threeFgm,
        threeFga: line.threeFga,
        ftm: line.ftm,
        fta: line.fta,
      }]
    }),
  })

  const resolveMvp = (
    mvpTournamentRosterId: number | null | undefined,
    playerStats: PlayerBoxScoreInput[],
  ): MatchMvp | null => {
    if (!mvpTournamentRosterId) return null
    const line = playerStats.find((stat) => stat.tournamentRosterId === mvpTournamentRosterId)
    const rosterEntry = rosterEntries.find((entry) => entry.id === mvpTournamentRosterId && isActive(entry))
    if (!line || !rosterEntry || rosterEntry.role !== 'ATHLETE') {
      throw new Error('MVP must be one of the players in the box score')
    }
    return { tournamentRosterId: rosterEntry.id, athleteId: rosterEntry.athleteId }
  }

  const isHomeSide = (match: StoredMatch, tournamentTeamId: number): boolean => {
    if (tournamentTeamId !== match.homeTournamentTeamId && tournamentTeamId !== match.awayTournamentTeamId) {
      throw new Error(`Tournament team ${tournamentTeamId} not found on this match`)
    }
    return tournamentTeamId === match.homeTournamentTeamId
  }

  const bracketRoundOf = (matchId: number): Match['bracketRound'] => {
    const slot = bracketSlots.find((entry) => isActive(entry) && entry.matchId === matchId)
    if (!slot) return null
    const round = bracketRounds.find((entry) => entry.id === slot.roundId && isActive(entry))
    return round ? { id: round.id, number: round.number, label: round.label } : null
  }

  const toMatch = (match: StoredMatch): Match => ({ ...match, bracketRound: bracketRoundOf(match.id) })

  return {
    // ── Tournament teams (enrollment) ──────────────────────────────────────────
    listTournamentTeams(tournamentId: number): TournamentTeam[] {
      return tournamentTeams.filter((tt) => isActive(tt) && tt.tournamentId === tournamentId)
    },
    listAllTournamentTeams(): TournamentTeam[] {
      return tournamentTeams.filter((tt) => isActive(tt))
    },
    enrollTeam(input: MockEnrollTeamInput): TournamentTeam {
      const exists = tournamentTeams.some(
        (tt) => isActive(tt) && tt.tournamentId === input.tournamentId && tt.teamId === input.teamId,
      )
      if (exists) throw new Error('Team already enrolled in this tournament')
      const record: TournamentTeam = {
        id: nextId(),
        tournamentId: input.tournamentId,
        teamId: input.teamId,
        displayNameSnapshot: input.displayName,
        seed: input.seed ?? null,
        tiebreakOrder: null,
        tiebreakBlockKey: null,
      }
      tournamentTeams.push(record)
      return record
    },
    removeTournamentTeam(id: number): void {
      const record = tournamentTeams.find((tt) => tt.id === id)
      if (!record) return
      record.isDeleted = true
    },

    // ── Bracket ────────────────────────────────────────────────────────────────
    listBracketRounds(tournamentId: number): BracketRound[] {
      return bracketRounds
        .filter((round) => isActive(round) && round.tournamentId === tournamentId)
        .sort((a, b) => a.number - b.number)
    },
    createBracketRound(input: CreateBracketRoundInput): BracketRound {
      const existing = bracketRounds.filter((round) => isActive(round) && round.tournamentId === input.tournamentId)
      const round: BracketRound = {
        id: nextId(),
        tournamentId: input.tournamentId,
        number: input.number ?? existing.reduce((max, entry) => Math.max(max, entry.number), 0) + 1,
        label: input.label ?? null,
      }
      bracketRounds.push(round)
      return round
    },
    updateBracketRound(id: number, input: UpdateBracketRoundInput): BracketRound {
      const round = bracketRounds.find((entry) => entry.id === id && isActive(entry))
      if (!round) throw new Error(`Bracket round ${id} not found`)
      if (input.label !== undefined) round.label = input.label
      return round
    },
    removeBracketRound(id: number): void {
      const round = bracketRounds.find((entry) => entry.id === id && isActive(entry))
      if (!round) return
      if (bracketSlots.some((slot) => isActive(slot) && slot.roundId === id)) {
        throw new Error('Cannot remove a round that still has slots')
      }
      round.isDeleted = true
    },
    listBracketSlots(tournamentId: number): BracketSlot[] {
      const numberOf = (roundId: number) => bracketRounds.find((round) => round.id === roundId)?.number ?? 0
      return bracketSlots
        .filter((slot) => isActive(slot) && slot.tournamentId === tournamentId)
        .sort((a, b) => numberOf(a.roundId) - numberOf(b.roundId) || a.position - b.position)
    },
    createBracketSlot(input: CreateBracketSlotInput): BracketSlot {
      const round = bracketRounds.find((entry) => entry.id === input.roundId && isActive(entry))
      if (!round || round.tournamentId !== input.tournamentId) throw new Error('Round does not belong to this tournament')
      const inRound = bracketSlots.filter((slot) => isActive(slot) && slot.roundId === input.roundId)
      const position = input.position ?? inRound.reduce((max, slot) => Math.max(max, slot.position), 0) + 1
      const slot: BracketSlot = {
        id: nextId(),
        tournamentId: input.tournamentId,
        roundId: input.roundId,
        position,
        label: input.label ?? null,
        homeTournamentTeamId: null,
        awayTournamentTeamId: null,
        matchId: null,
        winnerTournamentTeamId: null,
      }
      bracketSlots.push(slot)
      return slot
    },
    updateBracketSlot(id: number, input: UpdateBracketSlotInput): BracketSlot {
      const slot = bracketSlots.find((entry) => entry.id === id && isActive(entry))
      if (!slot) throw new Error(`Bracket slot ${id} not found`)
      if (input.homeTournamentTeamId !== undefined) slot.homeTournamentTeamId = input.homeTournamentTeamId
      if (input.awayTournamentTeamId !== undefined) slot.awayTournamentTeamId = input.awayTournamentTeamId
      if (input.label !== undefined) slot.label = input.label
      if (
        slot.winnerTournamentTeamId !== null &&
        slot.winnerTournamentTeamId !== slot.homeTournamentTeamId &&
        slot.winnerTournamentTeamId !== slot.awayTournamentTeamId
      ) {
        slot.winnerTournamentTeamId = null
      }
      return slot
    },
    linkSlotMatch(input: LinkSlotMatchInput): BracketSlot {
      const slot = bracketSlots.find((entry) => entry.id === input.slotId && isActive(entry))
      if (!slot) throw new Error(`Bracket slot ${input.slotId} not found`)
      slot.matchId = input.matchId
      return slot
    },
    setSlotWinner(input: SetSlotWinnerInput): BracketSlot {
      const slot = bracketSlots.find((entry) => entry.id === input.slotId && isActive(entry))
      if (!slot) throw new Error(`Bracket slot ${input.slotId} not found`)
      if (![slot.homeTournamentTeamId, slot.awayTournamentTeamId].includes(input.winnerTournamentTeamId)) {
        throw new Error('Winner must be one of the slot sides')
      }
      slot.winnerTournamentTeamId = input.winnerTournamentTeamId
      // A reabertura em cascata ao trocar o vencedor de uma vaga é regra de servidor (fase 7):
      // o store não alcança mais o campeonato, que agora vive na API.
      return slot
    },

    removeBracketSlot(id: number): void {
      const slot = bracketSlots.find((entry) => entry.id === id && isActive(entry))
      if (!slot) return
      if (slot.matchId) {
        const match = matches.find((entry) => entry.id === slot.matchId)
        if (match?.status === 'FINISHED') throw new Error('Cannot remove a slot whose match is finished')
        if (match) match.status = 'CANCELLED'
      }
      slot.isDeleted = true
    },

    // ── Roster ─────────────────────────────────────────────────────────────────
    listRoster(tournamentId: number, tournamentTeamId: number): RosterEntry[] {
      return rosterEntries.filter((r) => isActive(r) && r.tournamentId === tournamentId && r.tournamentTeamId === tournamentTeamId)
    },
    addRosterEntry(input: MockRosterEntryInput): RosterEntry {
      if (input.role === 'ATHLETE') {
        const conflict = rosterEntries.some(
          (r) =>
            isActive(r) &&
            r.tournamentId === input.tournamentId &&
            r.athleteId === input.athleteId &&
            r.role === 'ATHLETE' &&
            r.tournamentTeamId !== input.tournamentTeamId,
        )
        if (conflict) throw new Error('Athlete already on a team in the same tournament')
      }
      const record: RosterEntry = {
        id: nextId(),
        tournamentId: input.tournamentId,
        tournamentTeamId: input.tournamentTeamId,
        athleteId: input.athleteId,
        jerseyNumber: input.jerseyNumber,
        role: input.role,
      }
      rosterEntries.push(record)
      return record
    },
    updateRosterEntry(id: number, input: MockUpdateRosterEntryInput): RosterEntry {
      const entry = rosterEntries.find((record) => record.id === id)
      if (!entry) throw new Error('Roster entry not found')
      Object.assign(entry, input)
      return entry
    },
    removeRosterEntry(id: number): void {
      const entry = rosterEntries.find((record) => record.id === id)
      if (entry) entry.isDeleted = true
    },

    // ── Groups ─────────────────────────────────────────────────────────────────
    listGroups(tournamentId: number): MockTournamentGroup[] {
      return tournamentGroups
        .filter((g) => isActive(g) && g.tournamentId === tournamentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },
    createGroup(input: MockCreateGroupInput): MockTournamentGroup {
      const existing = tournamentGroups.filter((g) => isActive(g) && g.tournamentId === input.tournamentId)
      const sortOrder = input.sortOrder ?? existing.reduce((max, g) => Math.max(max, g.sortOrder), 0) + 1
      const group: MockTournamentGroup = { id: nextId(), tournamentId: input.tournamentId, name: input.name, sortOrder }
      tournamentGroups.push(group)
      return group
    },
    listGroupTeams(tournamentId: number): MockTournamentGroupTeam[] {
      return tournamentGroupTeams.filter((gt) => isActive(gt) && gt.tournamentId === tournamentId)
    },
    assignTeamToGroup(input: MockAssignGroupTeamInput): MockTournamentGroupTeam {
      const taken = tournamentGroupTeams.some(
        (gt) => isActive(gt) && gt.tournamentId === input.tournamentId && gt.tournamentTeamId === input.tournamentTeamId,
      )
      if (taken) throw new Error('Team already assigned to a group in this tournament')
      const record: MockTournamentGroupTeam = {
        id: nextId(),
        tournamentId: input.tournamentId,
        groupId: input.groupId,
        tournamentTeamId: input.tournamentTeamId,
      }
      tournamentGroupTeams.push(record)
      return record
    },
    removeGroupTeam(id: number): void {
      const record = tournamentGroupTeams.find((gt) => gt.id === id)
      if (record) record.isDeleted = true
    },

    // ── Matches ────────────────────────────────────────────────────────────────
    listMatches(filter?: { tournamentId?: number }): Match[] {
      return matches
        .filter((m) => !filter?.tournamentId || m.tournamentId === filter.tournamentId)
        .map(toMatch)
    },
    getMatchDetail(id: number): MatchDetail | undefined {
      const storedMatch = matches.find((m) => m.id === id)
      if (!storedMatch) return undefined
      const match = toMatch(storedMatch)
      const extra = matchExtras.get(id)
      return {
        ...match,
        periodScores: extra?.periodScores ?? null,
        homeStats: extra?.homeStats ?? { tournamentTeamId: match.homeTournamentTeamId, players: [] },
        awayStats: extra?.awayStats ?? { tournamentTeamId: match.awayTournamentTeamId, players: [] },
        mvp: extra?.mvp ?? null,
      }
    },
    scheduleMatch(input: ScheduleMatchInput): Match {
      // A match filed into a group its two teams do not share would enter no classification
      // table at all — the ranking only counts a match when both sides are in the scope.
      if (input.groupId) {
        const inGroup = (tournamentTeamId: number) =>
          tournamentGroupTeams.some((gt) => isActive(gt) && gt.groupId === input.groupId && gt.tournamentTeamId === tournamentTeamId)
        if (!inGroup(input.homeTournamentTeamId) || !inGroup(input.awayTournamentTeamId)) {
          throw new Error('Both teams must belong to the group of the match')
        }
      }

      const match: StoredMatch = {
        id: nextId(),
        tournamentId: input.tournamentId,
        date: input.scheduledAt,
        homeTournamentTeamId: input.homeTournamentTeamId,
        awayTournamentTeamId: input.awayTournamentTeamId,
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED',
        venue: input.venue,
        homeLossType: null,
        awayLossType: null,
        scoreSource: null,
        tournamentGroupId: input.groupId ?? null,
      }
      matches.push(match)
      return toMatch(match)
    },
    submitMatchResult(input: SubmitMatchResultInput): Match {
      const match = matches.find((m) => m.id === input.matchId)
      if (!match) throw new Error(`Match ${input.matchId} not found`)

      if (input.resultType === 'FORFEIT') {
        const offenderIsHome = isHomeSide(match, input.offendingTournamentTeamId)
        match.status = 'FINISHED'
        match.homeScore = offenderIsHome ? 0 : 20
        match.awayScore = offenderIsHome ? 20 : 0
        match.homeLossType = offenderIsHome ? 'FORFEIT' : null
        match.awayLossType = offenderIsHome ? null : 'FORFEIT'
        match.scoreSource = 'AWARDED'
        matchExtras.set(match.id, {
          periodScores: [],
          homeStats: emptyTeamStats(match.homeTournamentTeamId),
          awayStats: emptyTeamStats(match.awayTournamentTeamId),
          mvp: null,
        })
        return toMatch(match)
      }

      const mvp = resolveMvp(input.mvpTournamentRosterId, input.playerStats)
      const court = periodsSum(input.periods)
      match.status = 'FINISHED'

      if (input.resultType === 'DEFAULT') {
        const offenderIsHome = isHomeSide(match, input.offendingTournamentTeamId)
        const offenderScore = offenderIsHome ? court.home : court.away
        const opponentScore = offenderIsHome ? court.away : court.home
        if (opponentScore > offenderScore) {
          match.homeScore = court.home
          match.awayScore = court.away
          match.scoreSource = 'PERIODS'
        } else {
          match.homeScore = offenderIsHome ? 0 : 2
          match.awayScore = offenderIsHome ? 2 : 0
          match.scoreSource = 'AWARDED'
        }
        match.homeLossType = offenderIsHome ? 'DEFAULT' : null
        match.awayLossType = offenderIsHome ? null : 'DEFAULT'
      } else {
        match.homeScore = court.home
        match.awayScore = court.away
        match.scoreSource = 'PERIODS'
        match.homeLossType = court.home < court.away ? 'NORMAL' : null
        match.awayLossType = court.away < court.home ? 'NORMAL' : null
      }

      matchExtras.set(match.id, {
        periodScores: input.periods,
        homeStats: toBoxScore(match.homeTournamentTeamId, input),
        awayStats: toBoxScore(match.awayTournamentTeamId, input),
        mvp,
      })
      return toMatch(match)
    },
  }
}

export type SportsStore = ReturnType<typeof createSportsStore>
