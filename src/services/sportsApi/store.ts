import type {
  Match,
  MatchDetail,
  MatchMvp,
  PeriodScore,
  PlayerMatchStats,
  BracketRound,
  BracketSlot,
  RosterEntry,
  StandingsEnvelope,
  TeamMatchStats,
  Tournament,
  TournamentGroup,
  TournamentGroupTeam,
  TournamentTeam,
} from '../../features/sports/types'
import { periodsSum } from '../../features/sports/statistics'
import { computeStandings } from './standings'
import type { StandingTeamInput } from './standings'
import type {
  AssignGroupTeamInput,
  ClearTiebreakOrderInput,
  CompleteTournamentInput,
  CreateBracketRoundInput,
  CreateBracketSlotInput,
  CreateGroupInput,
  CreateTournamentInput,
  EnrollTeamInput,
  LinkSlotMatchInput,
  RosterEntryInput,
  ReopenTournamentInput,
  ScheduleMatchInput,
  PlayerBoxScoreInput,
  SetTiebreakOrderInput,
  SetSlotWinnerInput,
  SubmitMatchResultInput,
  UpdateBracketRoundInput,
  UpdateBracketSlotInput,
  UpdateRosterEntryInput,
  UpdateTournamentInput,
} from './types'

export interface SportsStoreSeed {
  tournaments: Tournament[]
  matches: Match[]
  tournamentTeams?: TournamentTeam[]
  rosterEntries?: RosterEntry[]
  tournamentGroups?: TournamentGroup[]
  tournamentGroupTeams?: TournamentGroupTeam[]
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

const isActive = (record: { isDeleted?: boolean }) => record.isDeleted !== true

export function createSportsStore(seed: SportsStoreSeed) {
  const tournaments: Tournament[] = seed.tournaments.map((t) => ({ ...t }))
  const matches: StoredMatch[] = seed.matches.map((match) => {
    const { bracketRound, ...rest } = match
    void bracketRound
    return rest
  })
  const tournamentTeams: TournamentTeam[] = seed.tournamentTeams?.map((entry) => ({ ...entry })) ?? []
  const rosterEntries: RosterEntry[] = seed.rosterEntries?.map((entry) => ({ ...entry })) ?? []
  const tournamentGroups: TournamentGroup[] = seed.tournamentGroups?.map((g) => ({ ...g })) ?? []
  const tournamentGroupTeams: TournamentGroupTeam[] = seed.tournamentGroupTeams?.map((g) => ({ ...g })) ?? []
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

  const requireTournament = (id: number): Tournament => {
    const found = tournaments.find((t) => t.id === id)
    if (!found) throw new Error(`Tournament ${id} not found`)
    return found
  }

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

  const bumpFinished = (match: StoredMatch) => {
    const tournament = tournaments.find((entry) => entry.id === match.tournamentId)
    if (tournament) tournament.finishedMatchCount += 1
  }

  const toStandingTeam = (tt: TournamentTeam): StandingTeamInput => ({
    tournamentTeamId: tt.id,
    teamId: tt.teamId,
    name: tt.displayNameSnapshot,
    tiebreakOrder: tt.tiebreakOrder,
    tiebreakBlockKey: tt.tiebreakBlockKey,
  })

  const bracketRoundOf = (matchId: number): Match['bracketRound'] => {
    const slot = bracketSlots.find((entry) => isActive(entry) && entry.matchId === matchId)
    if (!slot) return null
    const round = bracketRounds.find((entry) => entry.id === slot.roundId && isActive(entry))
    return round ? { id: round.id, number: round.number, label: round.label } : null
  }

  const toMatch = (match: StoredMatch): Match => ({ ...match, bracketRound: bracketRoundOf(match.id) })

  /** GET /tournaments/:id/standings — §8.7. The ranking rule lives here, not in the UI. */
  const buildStandings = (tournamentId: number, groupId?: number | null): StandingsEnvelope[] => {
    const tournament = requireTournament(tournamentId)
    const enrolled = tournamentTeams.filter((tt) => isActive(tt) && tt.tournamentId === tournamentId)
    const tournamentMatches = matches.filter((m) => m.tournamentId === tournamentId).map(toMatch)

    const hasGroups = tournament.format === 'GROUP_STAGE' || tournament.format === 'GROUP_STAGE_KNOCKOUT'
    if (!hasGroups) {
      // A knockout bracket has no classification; a LEAGUE is one single group.
      if (tournament.format === 'KNOCKOUT') return []
      return [computeStandings(enrolled.map(toStandingTeam), tournamentMatches, null)]
    }

    const groups = tournamentGroups
      .filter((g) => isActive(g) && g.tournamentId === tournamentId && (!groupId || g.id === groupId))
      .sort((a, b) => a.sortOrder - b.sortOrder)

    return groups.map((group) => {
      const memberTournamentTeamIds = new Set(
        tournamentGroupTeams
          .filter((gt) => isActive(gt) && gt.groupId === group.id)
          .map((gt) => gt.tournamentTeamId),
      )
      const members = enrolled.filter((tt) => memberTournamentTeamIds.has(tt.id))
      const groupMatches = tournamentMatches.filter((m) => m.tournamentGroupId === group.id)
      return computeStandings(members.map(toStandingTeam), groupMatches, { id: group.id, name: group.name })
    })
  }

  return {
    // ── Tournaments ──────────────────────────────────────────────────────────
    listTournaments(): Tournament[] {
      return [...tournaments]
    },
    getTournament(id: number): Tournament | undefined {
      return tournaments.find((t) => t.id === id)
    },
    createTournament(input: CreateTournamentInput): Tournament {
      const tournament: Tournament = {
        id: nextId(),
        name: input.name,
        seasonId: input.seasonId,
        categoryId: input.categoryId ?? null,
        regulation: input.regulation ?? null,
        format: input.format,
        status: 'DRAFT',
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        registrationStartsAt: input.registrationStartsAt ?? null,
        registrationEndsAt: input.registrationEndsAt ?? null,
        isRegistrationOpen: false,
        championTournamentTeamId: null,
        enrolledTeamCount: 0,
        matchCount: 0,
        finishedMatchCount: 0,
        updatedAt: new Date().toISOString(),
      }
      tournaments.push(tournament)
      return tournament
    },
    updateTournament(id: number, input: UpdateTournamentInput): Tournament {
      const tournament = requireTournament(id)
      Object.assign(tournament, input)
      tournament.updatedAt = new Date().toISOString()
      return tournament
    },

    // ── Tournament teams (enrollment) ──────────────────────────────────────────
    listTournamentTeams(tournamentId: number): TournamentTeam[] {
      return tournamentTeams.filter((tt) => isActive(tt) && tt.tournamentId === tournamentId)
    },
    listAllTournamentTeams(): TournamentTeam[] {
      return tournamentTeams.filter((tt) => isActive(tt))
    },
    enrollTeam(input: EnrollTeamInput): TournamentTeam {
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
      const tournament = requireTournament(input.tournamentId)
      tournament.enrolledTeamCount += 1
      return record
    },
    removeTournamentTeam(id: number): void {
      const record = tournamentTeams.find((tt) => tt.id === id)
      if (!record) return
      record.isDeleted = true
      const tournament = tournaments.find((t) => t.id === record.tournamentId)
      if (tournament) tournament.enrolledTeamCount -= 1
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
      const tournament = requireTournament(slot.tournamentId)
      if (tournament.status === 'COMPLETED') {
        tournament.status = 'IN_PROGRESS'
        tournament.championTournamentTeamId = null
      }
      return slot
    },

    championSuggestion(tournamentId: number): number | null {
      const tournament = requireTournament(tournamentId)
      if (tournament.format === 'GROUP_STAGE') return null
      if (tournament.format === 'LEAGUE') {
        const envelope = buildStandings(tournamentId)[0]
        return envelope?.standingsState === 'FINAL' ? envelope.rows.find((row) => row.position === 1)?.tournamentTeamId ?? null : null
      }
      const slots = bracketSlots.filter((slot) => isActive(slot) && slot.tournamentId === tournamentId)
      if (slots.length === 0) return null
      const numberOf = (roundId: number) => bracketRounds.find((round) => round.id === roundId)?.number ?? 0
      const lastNumber = Math.max(...slots.map((slot) => numberOf(slot.roundId)))
      const finalSlots = slots.filter((slot) => numberOf(slot.roundId) === lastNumber)
      return finalSlots.length === 1 ? finalSlots[0].winnerTournamentTeamId : null
    },
    completeTournament(input: CompleteTournamentInput): Tournament {
      const tournament = requireTournament(input.tournamentId)
      if (tournament.status !== 'IN_PROGRESS') throw new Error('Only a tournament in progress can be completed')
      const champion = input.championTournamentTeamId
      if (tournament.format === 'GROUP_STAGE') {
        if (champion) throw new Error('A group stage has no champion')
      } else {
        if (!champion) throw new Error('Champion is required for this format')
        const enrolled = tournamentTeams.find((entry) => entry.id === champion && isActive(entry) && entry.tournamentId === input.tournamentId)
        if (!enrolled) throw new Error('Champion must be a team enrolled in this tournament')
        if ((tournament.format === 'KNOCKOUT' || tournament.format === 'GROUP_STAGE_KNOCKOUT') && !bracketSlots.some((slot) => isActive(slot) && slot.tournamentId === input.tournamentId && slot.winnerTournamentTeamId === champion)) {
          throw new Error('Champion must have won a bracket slot')
        }
      }
      tournament.status = 'COMPLETED'
      tournament.championTournamentTeamId = champion
      tournament.updatedAt = new Date().toISOString()
      return tournament
    },
    reopenTournament(input: ReopenTournamentInput): Tournament {
      const tournament = requireTournament(input.tournamentId)
      if (tournament.status !== 'COMPLETED') throw new Error('Only a completed tournament can be reopened')
      tournament.status = 'IN_PROGRESS'
      tournament.championTournamentTeamId = null
      tournament.updatedAt = new Date().toISOString()
      return tournament
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
    addRosterEntry(input: RosterEntryInput): RosterEntry {
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
    updateRosterEntry(id: number, input: UpdateRosterEntryInput): RosterEntry {
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
    listGroups(tournamentId: number): TournamentGroup[] {
      return tournamentGroups
        .filter((g) => isActive(g) && g.tournamentId === tournamentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },
    createGroup(input: CreateGroupInput): TournamentGroup {
      const existing = tournamentGroups.filter((g) => isActive(g) && g.tournamentId === input.tournamentId)
      const sortOrder = input.sortOrder ?? existing.reduce((max, g) => Math.max(max, g.sortOrder), 0) + 1
      const group: TournamentGroup = { id: nextId(), tournamentId: input.tournamentId, name: input.name, sortOrder }
      tournamentGroups.push(group)
      return group
    },
    listGroupTeams(tournamentId: number): TournamentGroupTeam[] {
      return tournamentGroupTeams.filter((gt) => isActive(gt) && gt.tournamentId === tournamentId)
    },
    assignTeamToGroup(input: AssignGroupTeamInput): TournamentGroupTeam {
      const taken = tournamentGroupTeams.some(
        (gt) => isActive(gt) && gt.tournamentId === input.tournamentId && gt.tournamentTeamId === input.tournamentTeamId,
      )
      if (taken) throw new Error('Team already assigned to a group in this tournament')
      const record: TournamentGroupTeam = {
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
      const tournament = tournaments.find((t) => t.id === input.tournamentId)
      if (tournament) tournament.matchCount += 1
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
        bumpFinished(match)
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
      bumpFinished(match)
      return toMatch(match)
    },

    // ── Standings ──────────────────────────────────────────────────────────────
    listStandings(tournamentId: number, groupId?: number | null): StandingsEnvelope[] {
      return buildStandings(tournamentId, groupId)
    },
    setTiebreakOrder(input: SetTiebreakOrderInput): void {
      const submitted = input.entries.map((entry) => entry.tournamentTeamId)
      const key = [...submitted].sort().join('-')

      // The block must be one the norm itself produced — not a set the admin invented.
      const currentBlockKeys = new Set(
        buildStandings(input.tournamentId)
          .flatMap((envelope) => envelope.rows)
          .map((row) => row.tieBlockKey)
          .filter((blockKey): blockKey is string => blockKey !== null),
      )
      if (new Set(submitted).size !== submitted.length || !currentBlockKeys.has(key)) {
        throw new Error('Tied block no longer matches')
      }

      const orders = input.entries.map((entry) => entry.order).sort((a, b) => a - b)
      if (!orders.every((order, i) => order === i + 1)) {
        throw new Error('Tiebreak order must be a complete permutation')
      }

      for (const entry of input.entries) {
        const record = tournamentTeams.find((tt) => tt.id === entry.tournamentTeamId && isActive(tt))
        if (!record) throw new Error('Tied block no longer matches')
        record.tiebreakOrder = entry.order
        record.tiebreakBlockKey = key
      }
    },
    clearTiebreakOrder(input: ClearTiebreakOrderInput): void {
      for (const record of tournamentTeams) {
        if (record.tournamentId === input.tournamentId && record.tiebreakBlockKey === input.blockKey) {
          record.tiebreakOrder = null
          record.tiebreakBlockKey = null
        }
      }
    },
  }
}

export type SportsStore = ReturnType<typeof createSportsStore>
