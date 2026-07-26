# Phase 3 Registration and Roster Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 3 in-memory registration and roster boundary with the authenticated, tenant-scoped API while preserving the mock-only internals still required by later sports phases.

**Architecture:** Add three small HTTP adapters behind the existing `sportsApi` barrel: paginated catalogs, tournament registrations, and tournament rosters. React Query owns server state; remote selectors use the existing `SearchSelect`; roster rows use the API snapshot and `userId` directly. The in-memory store remains private for unintegrated groups, brackets, matches, standings, and athlete-detail flows, with no HTTP-to-mock fallback.

**Tech Stack:** React 19, TypeScript 6, Axios, TanStack React Query 5, Vitest, Testing Library, Vite, existing UI components.

## Global Constraints

- Work only on `feature/phase-03-registration-roster-integration`, based on `tcc-web/origin/dev` commit `debf59e`.
- Treat the Phase 3 handoff as the source of truth; the API phase is present in `tcc-api/origin/dev` commit `6ad6a61`.
- Every endpoint requires the existing authenticated Axios client and active organization context; never send `organizationId`.
- `/teams`, `/athletes`, and `/tournaments/:id/teams` are paginated with `page >= 1` and `1 <= limit <= 100`; selectors must fetch every result page.
- Operational registration reads must always send `status=ACTIVE`.
- Roster reads are not paginated, accept no query parameters, and already contain `displayNameSnapshot`.
- Use API `userId`; do not preserve the mock `athleteId` name at the HTTP or component boundary.
- Map frontend `jerseyNumber` directly to HTTP `jerseyNumber`; omit it on create when blank and send `null` on update when cleared.
- `tiebreakOrder` and `tiebreakBlockKey` are read-only; registration updates may send only `seed`.
- `DELETE` endpoints return `204 No Content`; do not synthesize or parse a body.
- Do not migrate `AdminTeamsPage` or `adminApi`; global administration remains out of scope until Phase 11.
- Do not expose roster mutation controls to `TEAM_ADMIN` or `COACHING_STAFF` until the bootstrap provides a trustworthy team capability.
- Do not add dependencies, API fallbacks, seed UI, or integrations for groups, brackets, matches, standings, statistics, or athlete detail.
- Do not mark Phase 3 complete in `docs/sports-api-implementation-roadmap.md` before the frontend PR is merged.

---

## File Map

- Create `src/services/sportsApi/pagination.ts`: collect every page from an existing paginated endpoint.
- Create `src/services/sportsApi/catalogs.ts`: `/teams` and `/athletes` page/list/search calls.
- Create `src/services/sportsApi/catalogs.test.ts`: pagination, filters, repeated IDs, and catalog envelopes.
- Create `src/services/sportsApi/tournament-teams.ts`: active registrations, enrollment, seed update, withdrawal, and transitional cross-tournament composition.
- Create `src/services/sportsApi/tournament-teams.test.ts`: exact routes, params, bodies, envelopes, and `204`.
- Create `src/services/sportsApi/tournament-rosters.ts`: roster read/create/update/withdrawal.
- Create `src/services/sportsApi/tournament-rosters.test.ts`: exact identity and nullable/omitted jersey behavior.
- Modify `src/features/sports/types.ts`: add `RosterCandidate` and `TournamentRoster`; align `TournamentTeam` nullable read-only fields.
- Modify `src/services/sportsApi/types.ts`: replace mock-shaped Phase 3 input types with HTTP-shaped inputs.
- Modify `src/services/sportsApi/index.ts`: export the real Phase 3 adapters and stop exporting the equivalent store methods.
- Modify `src/features/sports/queries.ts`: call the real adapters and key roster cache by registration ID.
- Modify `src/features/sports/queries.roster.test.tsx`: prove exact mutation calls and cache invalidation.
- Modify `src/features/sports/components/EnrollTeamPanel.tsx`: use remote `SearchSelect`.
- Modify `src/features/sports/components/EnrollTeamPanel.test.tsx`: cover search, selection, submission, and reset.
- Modify `src/features/sports/components/TournamentRosterPanel.tsx`: use `userId`, snapshots, remote role-filtered search, and nullable jersey numbers.
- Modify `src/features/sports/components/TournamentRosterPanel.test.tsx`: cover snapshot rendering, role changes, create omission, update null, loading/error/empty, and retry.
- Modify `src/pages/tournaments/TournamentDetailPage.tsx`: wire remote catalogs and API errors without loading the athlete catalog.
- Modify `src/pages/tournaments/TournamentDetailPage.test.tsx`: cover page-level registration and roster integration.
- Modify `src/pages/matches/MatchSumulaPage.tsx`: consume roster snapshots and nullable jersey numbers without a full athlete lookup.
- Modify `src/pages/matches/MatchSumulaPage.test.tsx`: prove roster names come from snapshots.
- Modify existing sports page/query tests that currently depend on exported Phase 3 mock methods so they mock the `sportsApi` boundary explicitly.

### Task 1: Paginated team and roster-candidate catalogs

**Files:**
- Create: `src/services/sportsApi/pagination.ts`
- Create: `src/services/sportsApi/catalogs.ts`
- Create: `src/services/sportsApi/catalogs.test.ts`
- Modify: `src/features/sports/types.ts`
- Modify: `src/services/sportsApi/index.ts`

**Interfaces:**
- Consumes: `api` from `src/services/api.ts`, `PaginatedResponse<T>` from `src/types/admin.ts`, and Axios `PARAMS_SERIALIZER` already configured on the shared client.
- Produces:

```ts
export interface RosterCandidate {
  id: number
  name: string
  teamId: number
  role: 'ATHLETE' | 'COACHING_STAFF'
  jerseyNumber: number | null
}

export interface ListTeamsParams {
  page?: number
  limit?: number
  q?: string
  ids?: number[]
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface ListRosterCandidatesParams {
  page?: number
  limit?: number
  q?: string
  ids?: number[]
  teamId?: number
  role?: 'ATHLETE' | 'COACHING_STAFF'
}

export function collectPages<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]>

export const listTeamsPage: (
  params?: ListTeamsParams,
) => Promise<PaginatedResponse<Team>>
export const getTeams: (
  params?: Omit<ListTeamsParams, 'page' | 'limit'>,
) => Promise<Team[]>
export const searchTeams: (q: string) => Promise<Team[]>
export const listRosterCandidatesPage: (
  params?: ListRosterCandidatesParams,
) => Promise<PaginatedResponse<RosterCandidate>>
export const searchRosterCandidates: (
  params: Pick<ListRosterCandidatesParams, 'q' | 'teamId' | 'role'>,
) => Promise<RosterCandidate[]>
```

- [ ] **Step 1: Write failing adapter tests**

Create tests that mock the shared Axios client and assert the public contract:

```ts
vi.mock('../api', () => ({ default: { get: vi.fn() } }))

it('serializes team filters without organizationId', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: teamsPage })
  await listTeamsPage({
    page: 2,
    limit: 20,
    q: 'engenharia',
    ids: [8, 9],
    status: 'ACTIVE',
  })
  expect(api.get).toHaveBeenCalledWith('/teams', {
    params: {
      page: 2,
      limit: 20,
      q: 'engenharia',
      ids: [8, 9],
      status: 'ACTIVE',
    },
  })
})

it('collects every team search page with ACTIVE status', async () => {
  vi.mocked(api.get)
    .mockResolvedValueOnce({ data: page(1, 2, [team8]) })
    .mockResolvedValueOnce({ data: page(2, 2, [team9]) })
  await expect(searchTeams('eng')).resolves.toEqual([team8, team9])
  expect(api.get).toHaveBeenNthCalledWith(1, '/teams', {
    params: { page: 1, limit: 100, q: 'eng', status: 'ACTIVE' },
  })
  expect(api.get).toHaveBeenNthCalledWith(2, '/teams', {
    params: { page: 2, limit: 100, q: 'eng', status: 'ACTIVE' },
  })
})

it('collects roster candidates with team, role, and query filters', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: candidatesPage })
  await searchRosterCandidates({ teamId: 8, role: 'ATHLETE', q: 'rafael' })
  expect(api.get).toHaveBeenCalledWith('/athletes', {
    params: {
      page: 1,
      limit: 100,
      teamId: 8,
      role: 'ATHLETE',
      q: 'rafael',
    },
  })
})
```

Use fixture pages with the real `data`, `meta`, `links`, and `statusCode` shape. Add a separate assertion that `ids: [165, 166]` reaches Axios unchanged so the shared serializer emits repeated keys.

- [ ] **Step 2: Run the catalog tests and verify the red state**

Run:

```bash
npm test -- src/services/sportsApi/catalogs.test.ts
```

Expected: FAIL because `catalogs.ts`, `RosterCandidate`, and its exports do not exist.

- [ ] **Step 3: Add the minimal types and page collector**

Add `RosterCandidate` to `src/features/sports/types.ts`, change `Team.city` to `city?: string | null`, and implement sequential pagination:

```ts
export async function collectPages<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
) {
  const items: T[] = []
  let page = 1
  let totalPages = 1

  do {
    const response = await fetchPage(page)
    items.push(...response.data)
    totalPages = response.meta.totalPages
    page += 1
  } while (page <= totalPages)

  return items
}
```

Sequential requests keep the implementation deterministic and stop at the server-provided page count.

- [ ] **Step 4: Implement the two catalog adapters**

Use the shared Axios instance and a single constant:

```ts
const PAGE_LIMIT = 100

export const listTeamsPage = (params: ListTeamsParams = {}) =>
  api.get<PaginatedResponse<Team>>('/teams', { params }).then(({ data }) => data)

export const getTeams = (
  params: Omit<ListTeamsParams, 'page' | 'limit'> = {},
) =>
  collectPages((page) =>
    listTeamsPage({ ...params, page, limit: PAGE_LIMIT }),
  )

export const searchTeams = (q: string) =>
  getTeams({ q, status: 'ACTIVE' })

export const listRosterCandidatesPage = (
  params: ListRosterCandidatesParams = {},
) =>
  api
    .get<PaginatedResponse<RosterCandidate>>('/athletes', { params })
    .then(({ data }) => data)

export const searchRosterCandidates = (
  params: Pick<ListRosterCandidatesParams, 'q' | 'teamId' | 'role'>,
) =>
  collectPages((page) =>
    listRosterCandidatesPage({ ...params, page, limit: PAGE_LIMIT }),
  )
```

Export these functions and parameter types from `sportsApi/index.ts`. Replace only the exported mock `getTeams`; retain mock `getAthletes` for later-phase athlete and match consumers.

- [ ] **Step 5: Run catalog tests**

Run:

```bash
npm test -- src/services/sportsApi/catalogs.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the catalog boundary**

```bash
git add src/features/sports/types.ts src/services/sportsApi/pagination.ts src/services/sportsApi/catalogs.ts src/services/sportsApi/catalogs.test.ts src/services/sportsApi/index.ts
git commit -m "feat: integrate sports catalogs"
```

### Task 2: Tournament registration HTTP adapter

**Files:**
- Create: `src/services/sportsApi/tournament-teams.ts`
- Create: `src/services/sportsApi/tournament-teams.test.ts`
- Modify: `src/features/sports/types.ts`
- Modify: `src/services/sportsApi/types.ts`
- Modify: `src/services/sportsApi/index.ts`

**Interfaces:**
- Consumes: `collectPages`, the existing real `getTournaments()`, and `ApiResponse<T>`.
- Produces:

```ts
export interface TournamentTeam {
  id: number
  tournamentId: number
  teamId: number
  seed: number | null
  tiebreakOrder: number | null
  tiebreakBlockKey: string | null
  displayNameSnapshot: string
}

export interface EnrollTeamInput {
  tournamentId: number
  teamId: number
}

export interface UpdateTournamentTeamInput {
  seed?: number | null
}

export interface ListTournamentTeamsParams {
  page?: number
  limit?: number
  q?: string
  ids?: number[]
  status?: 'ACTIVE' | 'WITHDRAWN'
}

export const listTournamentTeamsPage: (
  tournamentId: number,
  params?: ListTournamentTeamsParams,
) => Promise<PaginatedResponse<TournamentTeam>>
export const getTournamentTeams: (
  tournamentId: number,
) => Promise<TournamentTeam[]>
export const getAllTournamentTeams: () => Promise<TournamentTeam[]>
export const enrollTeam: (
  input: EnrollTeamInput,
) => Promise<TournamentTeam>
export const updateTournamentTeam: (
  id: number,
  input: UpdateTournamentTeamInput,
) => Promise<TournamentTeam>
export const removeTournamentTeam: (id: number) => Promise<void>
```

- [ ] **Step 1: Write failing registration adapter tests**

Cover active-only pagination, exact enrollment payload, seed-only patch, and empty delete response:

```ts
it('loads every active registration page', async () => {
  vi.mocked(api.get)
    .mockResolvedValueOnce({ data: page(1, 2, [registration41]) })
    .mockResolvedValueOnce({ data: page(2, 2, [registration42]) })
  await expect(getTournamentTeams(12)).resolves.toEqual([
    registration41,
    registration42,
  ])
  expect(api.get).toHaveBeenNthCalledWith(
    1,
    '/tournaments/12/teams',
    { params: { page: 1, limit: 100, status: 'ACTIVE' } },
  )
})

it('enrolls with teamId only', async () => {
  vi.mocked(api.post).mockResolvedValueOnce({
    data: { data: registration41, statusCode: 201 },
  })
  await enrollTeam({ tournamentId: 12, teamId: 8 })
  expect(api.post).toHaveBeenCalledWith('/tournaments/12/teams', { teamId: 8 })
})

it('patches seed without read-only tiebreak fields', async () => {
  vi.mocked(api.patch).mockResolvedValueOnce({
    data: { data: registration41, statusCode: 200 },
  })
  await updateTournamentTeam(41, { seed: null })
  expect(api.patch).toHaveBeenCalledWith('/tournament-teams/41', { seed: null })
})

it('withdraws a registration without reading a response body', async () => {
  vi.mocked(api.delete).mockResolvedValueOnce({ status: 204 })
  await expect(removeTournamentTeam(41)).resolves.toBeUndefined()
  expect(api.delete).toHaveBeenCalledWith('/tournament-teams/41')
})
```

Also mock `getTournaments()` with two tournaments and assert `getAllTournamentTeams()` calls `getTournamentTeams()` for both and flattens the results. This is the bounded transitional fan-out required by the existing all-tournaments matches list.

- [ ] **Step 2: Run the registration adapter tests and verify failure**

```bash
npm test -- src/services/sportsApi/tournament-teams.test.ts
```

Expected: FAIL because the adapter and HTTP-shaped inputs do not exist.

- [ ] **Step 3: Align registration models and inputs**

In `src/features/sports/types.ts`, rename `blockKey` to `tiebreakBlockKey`, make `seed` and `tiebreakOrder` explicitly nullable, and remove mock-only deletion state from the public `TournamentTeam`. In `src/services/sportsApi/types.ts`, replace `EnrollTeamInput` and add `UpdateTournamentTeamInput` exactly as defined above.

Keep any separate internal store fixture type local to `store.ts` if later mock computations still require `blockKey` or `isDeleted`; do not export that shape as the Phase 3 model.

- [ ] **Step 4: Implement the registration adapter**

```ts
const PAGE_LIMIT = 100

export const listTournamentTeamsPage = (
  tournamentId: number,
  params: ListTournamentTeamsParams = {},
) =>
  api
    .get<PaginatedResponse<TournamentTeam>>(
      `/tournaments/${tournamentId}/teams`,
      { params },
    )
    .then(({ data }) => data)

export const getTournamentTeams = (tournamentId: number) =>
  collectPages((page) =>
    listTournamentTeamsPage(tournamentId, {
      page,
      limit: PAGE_LIMIT,
      status: 'ACTIVE',
    }),
  )

export const enrollTeam = ({ tournamentId, teamId }: EnrollTeamInput) =>
  api
    .post<ApiResponse<TournamentTeam>>(
      `/tournaments/${tournamentId}/teams`,
      { teamId },
    )
    .then(({ data }) => data.data)

export const updateTournamentTeam = (
  id: number,
  input: UpdateTournamentTeamInput,
) =>
  api
    .patch<ApiResponse<TournamentTeam>>(`/tournament-teams/${id}`, input)
    .then(({ data }) => data.data)

export const removeTournamentTeam = (id: number) =>
  api.delete(`/tournament-teams/${id}`).then(() => undefined)
```

Implement `getAllTournamentTeams()` with `getTournaments().then(...)`, `Promise.all`, and `flat()`; do not add a cache or invented endpoint.

In `sportsApi/index.ts`, export these real functions and stop exporting `store.getTournamentTeams`, `store.enrollTeam`, and `store.removeTournamentTeam`. Leave store methods private for later mock algorithms.

- [ ] **Step 5: Run registration adapter tests**

```bash
npm test -- src/services/sportsApi/tournament-teams.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the registration adapter**

```bash
git add src/features/sports/types.ts src/services/sportsApi/types.ts src/services/sportsApi/tournament-teams.ts src/services/sportsApi/tournament-teams.test.ts src/services/sportsApi/index.ts
git commit -m "feat: integrate tournament registrations"
```

### Task 3: Tournament roster HTTP adapter

**Files:**
- Create: `src/services/sportsApi/tournament-rosters.ts`
- Create: `src/services/sportsApi/tournament-rosters.test.ts`
- Modify: `src/features/sports/types.ts`
- Modify: `src/services/sportsApi/types.ts`
- Modify: `src/services/sportsApi/index.ts`

**Interfaces:**
- Consumes: the shared Axios client and `ApiResponse<T>`.
- Produces:

```ts
export type RosterRole = 'ATHLETE' | 'COACHING_STAFF'

export interface TournamentRoster {
  id: number
  tournamentId: number
  tournamentTeamId: number
  userId: number
  role: RosterRole
  jerseyNumber: number | null
  displayNameSnapshot: string
}

export interface CreateTournamentRosterInput {
  userId: number
  tournamentTeamId: number
  role: RosterRole
  jerseyNumber?: number | null
}

export interface UpdateTournamentRosterInput {
  role?: RosterRole
  jerseyNumber?: number | null
}

export const getTournamentRoster: (
  tournamentTeamId: number,
) => Promise<TournamentRoster[]>
export const addTournamentRoster: (
  input: CreateTournamentRosterInput,
) => Promise<TournamentRoster>
export const updateTournamentRoster: (
  id: number,
  input: UpdateTournamentRosterInput,
) => Promise<TournamentRoster>
export const removeTournamentRoster: (id: number) => Promise<void>
```

- [ ] **Step 1: Write failing roster adapter tests**

```ts
it('gets the unpaginated roster without query parameters', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({
    data: { data: [roster88], statusCode: 200 },
  })
  await expect(getTournamentRoster(41)).resolves.toEqual([roster88])
  expect(api.get).toHaveBeenCalledWith(
    '/tournament-teams/41/tournament-rosters',
  )
})

it('creates with userId and omits an absent jerseyNumber', async () => {
  vi.mocked(api.post).mockResolvedValueOnce({
    data: { data: roster88, statusCode: 201 },
  })
  await addTournamentRoster({
    userId: 165,
    tournamentTeamId: 41,
    role: 'ATHLETE',
  })
  expect(api.post).toHaveBeenCalledWith('/tournament-rosters', {
    userId: 165,
    tournamentTeamId: 41,
    role: 'ATHLETE',
  })
})

it('preserves an explicit null jerseyNumber', async () => {
  vi.mocked(api.patch).mockResolvedValueOnce({
    data: { data: { ...roster88, jerseyNumber: null }, statusCode: 200 },
  })
  await updateTournamentRoster(88, { jerseyNumber: null })
  expect(api.patch).toHaveBeenCalledWith('/tournament-rosters/88', {
    jerseyNumber: null,
  })
})

it('withdraws a roster row on 204', async () => {
  vi.mocked(api.delete).mockResolvedValueOnce({ status: 204 })
  await expect(removeTournamentRoster(88)).resolves.toBeUndefined()
})
```

Add a creation assertion with `jerseyNumber: 0` to prevent truthiness logic from dropping a valid number.

- [ ] **Step 2: Run roster adapter tests and verify failure**

```bash
npm test -- src/services/sportsApi/tournament-rosters.test.ts
```

Expected: FAIL because the roster adapter and canonical model do not exist.

- [ ] **Step 3: Add canonical roster models and inputs**

Add `RosterRole` and `TournamentRoster` to `src/features/sports/types.ts`. Replace `RosterEntryInput` and `UpdateRosterEntryInput` in `src/services/sportsApi/types.ts` with `CreateTournamentRosterInput` and `UpdateTournamentRosterInput` exactly as shown in the Interfaces block.

Keep the old mock `RosterEntry` type only where an unintegrated store algorithm still needs it; do not expose it through the Phase 3 HTTP adapter.

- [ ] **Step 4: Implement and export the roster adapter**

```ts
export const getTournamentRoster = (tournamentTeamId: number) =>
  api
    .get<ApiResponse<TournamentRoster[]>>(
      `/tournament-teams/${tournamentTeamId}/tournament-rosters`,
    )
    .then(({ data }) => data.data)

export const addTournamentRoster = (
  input: CreateTournamentRosterInput,
) =>
  api
    .post<ApiResponse<TournamentRoster>>('/tournament-rosters', input)
    .then(({ data }) => data.data)

export const updateTournamentRoster = (
  id: number,
  input: UpdateTournamentRosterInput,
) =>
  api
    .patch<ApiResponse<TournamentRoster>>(
      `/tournament-rosters/${id}`,
      input,
    )
    .then(({ data }) => data.data)

export const removeTournamentRoster = (id: number) =>
  api.delete(`/tournament-rosters/${id}`).then(() => undefined)
```

Export these functions from `sportsApi/index.ts`. Remove the public wrappers around `store.getRoster`, `store.addRosterEntry`, `store.updateRosterEntry`, and `store.removeRosterEntry`; retain private store behavior required by future mock phases.

- [ ] **Step 5: Run roster adapter tests**

```bash
npm test -- src/services/sportsApi/tournament-rosters.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the roster adapter**

```bash
git add src/features/sports/types.ts src/services/sportsApi/types.ts src/services/sportsApi/tournament-rosters.ts src/services/sportsApi/tournament-rosters.test.ts src/services/sportsApi/index.ts
git commit -m "feat: integrate tournament rosters"
```

### Task 4: React Query server-state wiring

**Files:**
- Modify: `src/features/sports/queries.ts`
- Modify: `src/features/sports/queries.roster.test.tsx`
- Modify: `src/features/sports/queries.test.tsx`

**Interfaces:**
- Consumes: `getTournamentTeams`, `getTournamentRoster`, `addTournamentRoster`, `updateTournamentRoster`, and `removeTournamentRoster` from Tasks 2–3.
- Produces:

```ts
tournamentKeys.roster(tournamentTeamId: number)

useRosterQuery(tournamentTeamId: number | undefined)

useAddRosterEntry(): UseMutationResult<
  TournamentRoster,
  Error,
  CreateTournamentRosterInput
>

useUpdateRosterEntry(): UseMutationResult<
  TournamentRoster,
  Error,
  {
    id: number
    tournamentTeamId: number
    input: UpdateTournamentRosterInput
  }
>

useRemoveRosterEntry(): UseMutationResult<
  void,
  Error,
  { id: number; tournamentTeamId: number }
>
```

- [ ] **Step 1: Rewrite roster query tests against the real adapter surface**

Mock `sportsApi.getTournamentRoster`, `addTournamentRoster`, `updateTournamentRoster`, and `removeTournamentRoster`. Assert:

```ts
const list = renderHook(() => useRosterQuery(41), { wrapper })
await waitFor(() => expect(list.result.current.data).toEqual([roster88]))
expect(sportsApi.getTournamentRoster).toHaveBeenCalledWith(41)

await act(() =>
  add.result.current.mutateAsync({
    userId: 165,
    tournamentTeamId: 41,
    role: 'ATHLETE',
  }),
)
expect(sportsApi.addTournamentRoster).toHaveBeenCalledWith({
  userId: 165,
  tournamentTeamId: 41,
  role: 'ATHLETE',
})
expect(invalidateQueries).toHaveBeenCalledWith({
  queryKey: tournamentKeys.roster(41),
})
```

Repeat the invalidation assertion for update and remove. Assert an undefined registration ID disables the roster query.

- [ ] **Step 2: Run query tests and verify failure**

```bash
npm test -- src/features/sports/queries.roster.test.tsx src/features/sports/queries.test.tsx
```

Expected: FAIL because the current query accepts two IDs and calls mock roster names.

- [ ] **Step 3: Update query keys, hooks, and mutation signatures**

Implement:

```ts
roster: (tournamentTeamId: number) =>
  [...tournamentKeys.all, 'roster', tournamentTeamId] as const

export function useRosterQuery(tournamentTeamId: number | undefined) {
  return useQuery({
    queryKey: tournamentKeys.roster(tournamentTeamId ?? -1),
    queryFn: () => sportsApi.getTournamentRoster(tournamentTeamId!),
    enabled: tournamentTeamId != null,
  })
}
```

Update mutation functions to the exact Interfaces block. Each roster mutation invalidates only `tournamentKeys.roster(tournamentTeamId)`.

Keep enrollment invalidation at `tournamentKeys.all`; it already covers detail, team lists, roster lists, and champion suggestion. Do not invalidate unrelated match/group/bracket caches until those phases use real registration state.

- [ ] **Step 4: Run query tests**

```bash
npm test -- src/features/sports/queries.roster.test.tsx src/features/sports/queries.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit query wiring**

```bash
git add src/features/sports/queries.ts src/features/sports/queries.roster.test.tsx src/features/sports/queries.test.tsx
git commit -m "refactor: wire phase 3 query state"
```

### Task 5: Remote enrollment and roster panels

**Files:**
- Modify: `src/features/sports/components/EnrollTeamPanel.tsx`
- Modify: `src/features/sports/components/EnrollTeamPanel.test.tsx`
- Modify: `src/features/sports/components/TournamentRosterPanel.tsx`
- Modify: `src/features/sports/components/TournamentRosterPanel.test.tsx`

**Interfaces:**
- Consumes: existing `SearchSelect`, `SearchSelectOption`, `NumberField`, `ErrorState`, `EmptyState`, and canonical `RosterRole`.
- Produces:

```ts
export interface EnrollTeamPanelProps {
  onSearch: (q: string) => Promise<SearchSelectOption[]>
  onEnroll: (teamId: number) => Promise<void>
  errorMessage?: string
}

export interface RosterDisplayEntry {
  id: number
  userId: number
  name: string
  jerseyNumber: number | null
  role: RosterRole
}

export interface RosterEntryDraft {
  userId: number
  role: RosterRole
  jerseyNumber?: number
}

export interface TournamentRosterPanelProps {
  roster: RosterDisplayEntry[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onSearchCandidates: (
    q: string,
    role: RosterRole,
  ) => Promise<SearchSelectOption[]>
  onAdd: (entry: RosterEntryDraft) => Promise<void>
  onRemove: (id: number) => void
  onUpdate: (
    id: number,
    input: { jerseyNumber?: number | null; role?: RosterRole },
  ) => Promise<void>
  errorMessage?: string
}
```

- [ ] **Step 1: Write failing enrollment panel tests**

Use fake timers for the existing `SearchSelect` debounce:

```ts
it('searches remotely and enrolls the selected team', async () => {
  const onSearch = vi.fn().mockResolvedValue([{ id: 8, label: 'Engenharia PUC' }])
  const onEnroll = vi.fn().mockResolvedValue(undefined)
  render(<EnrollTeamPanel onSearch={onSearch} onEnroll={onEnroll} />)
  await user.type(screen.getByRole('combobox'), 'engenharia')
  await vi.advanceTimersByTimeAsync(350)
  await user.click(await screen.findByRole('option', { name: 'Engenharia PUC' }))
  await user.click(screen.getByRole('button', { name: 'Inscrever' }))
  expect(onSearch).toHaveBeenCalledWith('engenharia')
  expect(onEnroll).toHaveBeenCalledWith(8)
})
```

Assert the selected option clears after successful enrollment and remains selected when `onEnroll` rejects.

- [ ] **Step 2: Write failing roster panel tests**

Cover the contract-specific UI behavior:

```ts
it('renders the server snapshot and an em dash for a null jersey', () => {
  renderPanel({
    roster: [{
      id: 88,
      userId: 165,
      name: 'Rafael Moura',
      jerseyNumber: null,
      role: 'ATHLETE',
    }],
  })
  expect(screen.getByText('Rafael Moura')).toBeInTheDocument()
  expect(screen.getByText('—')).toBeInTheDocument()
})

it('omits a blank jersey on create', async () => {
  const onAdd = vi.fn().mockResolvedValue(undefined)
  renderPanel({ onAdd })
  await chooseCandidate('Rafael Moura')
  await user.click(screen.getByRole('button', { name: 'Adicionar ao elenco' }))
  expect(onAdd).toHaveBeenCalledWith({
    userId: 165,
    role: 'ATHLETE',
  })
})

it('sends null when an existing jersey is cleared', async () => {
  const onUpdate = vi.fn().mockResolvedValue(undefined)
  renderPanel({ roster: [roster88], onUpdate })
  await user.click(screen.getByRole('button', { name: 'Editar' }))
  await user.clear(screen.getByRole('spinbutton', { name: 'Número' }))
  await user.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(onUpdate).toHaveBeenCalledWith(88, {
    jerseyNumber: null,
    role: 'ATHLETE',
  })
})
```

Add tests that changing role clears the selected person and causes the next `onSearchCandidates` call to receive `COACHING_STAFF`; loading hides the table and shows the existing loading pattern; error shows retry; retry calls `onRetry`; empty data shows `EmptyState`.

- [ ] **Step 3: Run panel tests and verify failure**

```bash
npm test -- src/features/sports/components/EnrollTeamPanel.test.tsx src/features/sports/components/TournamentRosterPanel.test.tsx
```

Expected: FAIL because both panels still accept local option arrays and mock identity fields.

- [ ] **Step 4: Replace the enrollment `Combobox` with `SearchSelect`**

Store the selected `SearchSelectOption | null`; pass `onSearch` straight to the existing control; call `onEnroll(selected.id)`. Clear selection only after a resolved promise. Remove `availableTeams`, `parsePositiveId`, and the local `Combobox` mapping.

- [ ] **Step 5: Replace roster candidate selection and nullable jersey handling**

Store `selectedCandidate: SearchSelectOption | null`. Invoke:

```ts
onSearch={(q) => onSearchCandidates(q, role)}
```

When role changes:

```ts
setRole(nextRole)
setSelectedCandidate(null)
```

Build create input without a nullable property:

```ts
const input: RosterEntryDraft = {
  userId: selectedCandidate.id,
  role,
  ...(jerseyNumber === '' ? {} : { jerseyNumber }),
}
```

Build update input with an explicit clear:

```ts
await onUpdate(editingId, {
  jerseyNumber: draftNumber === '' ? null : draftNumber,
  role: draftRole,
})
```

Allow blank jersey values through validation; reject only numeric values outside `0..99`. Render `entry.jerseyNumber ?? '—'`. Keep labels, semantic table markup, confirmation, and keyboard-accessible existing controls.

For query states, render the repository’s existing loading treatment while `isLoading`; render `ErrorState` with `onRetry` while `isError`; otherwise render the table or `EmptyState`.

- [ ] **Step 6: Run panel tests**

```bash
npm test -- src/features/sports/components/EnrollTeamPanel.test.tsx src/features/sports/components/TournamentRosterPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the panel integration**

```bash
git add src/features/sports/components/EnrollTeamPanel.tsx src/features/sports/components/EnrollTeamPanel.test.tsx src/features/sports/components/TournamentRosterPanel.tsx src/features/sports/components/TournamentRosterPanel.test.tsx
git commit -m "feat: add remote registration and roster controls"
```

### Task 6: Tournament detail and match-sheet consumers

**Files:**
- Modify: `src/pages/tournaments/TournamentDetailPage.tsx`
- Modify: `src/pages/tournaments/TournamentDetailPage.test.tsx`
- Modify: `src/pages/matches/MatchSumulaPage.tsx`
- Modify: `src/pages/matches/MatchSumulaPage.test.tsx`

**Interfaces:**
- Consumes: panel contracts from Task 5, catalog search functions from Task 1, roster query/mutations from Task 4, `apiErrorCode()` from `src/services/apiError.ts`.
- Produces: no new public API; both pages consume canonical server read models.

- [ ] **Step 1: Add failing tournament-detail integration tests**

Mock the `sportsApi` functions at their boundary and assert:

```ts
expect(sportsApi.searchTeams).toHaveBeenCalledWith('engenharia')
expect(sportsApi.enrollTeam).toHaveBeenCalledWith({
  tournamentId: 12,
  teamId: 8,
})
expect(sportsApi.searchRosterCandidates).toHaveBeenCalledWith({
  q: 'rafael',
  teamId: 8,
  role: 'ATHLETE',
})
expect(sportsApi.addTournamentRoster).toHaveBeenCalledWith({
  userId: 165,
  tournamentTeamId: 41,
  role: 'ATHLETE',
})
```

Provide a roster response containing `displayNameSnapshot: 'Rafael Moura'` while `getAthletes` rejects if called. Assert the snapshot is rendered and `getAthletes` was not called by this page.

Parameterize write failures using Axios-shaped errors. Keep enrollment and
roster maps separate because `DUPLICATE_RECORD` has different context:

```ts
const ENROLLMENT_MESSAGES = {
  DUPLICATE_RECORD: 'Equipe já inscrita neste campeonato.',
  INVALID_TEAM: 'A equipe não está disponível para esta organização.',
  TOURNAMENT_NOT_MUTABLE: 'Este campeonato não permite mais alterações.',
  REGISTRATION_IN_USE: 'A inscrição já está em uso pelo chaveamento.',
} as const

const ROSTER_MESSAGES = {
  DUPLICATE_RECORD: 'A pessoa já está ativa neste elenco.',
  ATHLETE_ALREADY_REGISTERED: 'Atleta já está em outra equipe neste campeonato.',
  INVALID_ROSTER_MEMBER: 'A pessoa não possui vínculo ativo com esta equipe.',
  INVALID_ROSTER_ROLE: 'O papel escolhido não corresponde ao vínculo ativo.',
  INACTIVE_REGISTRATION: 'A inscrição ou o membro não está ativo.',
  TOURNAMENT_NOT_MUTABLE: 'Este campeonato não permite mais alterações.',
} as const
```

Keep contextual fallback text for codes absent from the map.

- [ ] **Step 2: Add a failing match-sheet snapshot test**

Return home and away rosters with `userId`, `displayNameSnapshot`, and a nullable jersey. Make `getAthletes` reject if the match sheet calls it. Assert player names are populated from snapshots and null jersey values render as `—` instead of blocking the page.

- [ ] **Step 3: Run page tests and verify failure**

```bash
npm test -- src/pages/tournaments/TournamentDetailPage.test.tsx src/pages/matches/MatchSumulaPage.test.tsx
```

Expected: FAIL because the pages still resolve names through the mock athlete catalog and pass mock-shaped input.

- [ ] **Step 4: Wire `TournamentDetailPage` to the real identities**

Remove `useAthletesQuery()` from this page. Map roster rows directly:

```ts
const rosterRows = (roster ?? []).map((entry) => ({
  id: entry.id,
  userId: entry.userId,
  name: entry.displayNameSnapshot,
  jerseyNumber: entry.jerseyNumber,
  role: entry.role,
}))
```

Provide remote search callbacks:

```ts
const searchEnrollmentTeams = async (q: string) =>
  (await sportsApi.searchTeams(q))
    .filter((team) => !enrolledTeamIds.has(team.id))
    .map((team) => ({ id: team.id, label: team.name, secondary: team.shortName }))

const searchCandidates = async (q: string, role: RosterRole) =>
  (await sportsApi.searchRosterCandidates({
    q,
    teamId: selectedRegistration.teamId,
    role,
  })).map((candidate) => ({
    id: candidate.id,
    label: candidate.name,
    secondary: candidate.jerseyNumber == null
      ? undefined
      : `Camisa ${candidate.jerseyNumber}`,
  }))
```

Call `useRosterQuery(rosterTournamentTeamId)`. Convert panel drafts to `CreateTournamentRosterInput` without renaming `userId`. Pass query `isPending`, `isError`, and `refetch` to the roster panel.

Use `apiErrorCode(error)` and the context-specific message maps from Step 1.
Preserve current alert placement and the existing `ORG_ADMIN` gate.

- [ ] **Step 5: Remove athlete lookup from `MatchSumulaPage`**

Call `useRosterQuery(match.homeTournamentTeamId)` and `useRosterQuery(match.awayTournamentTeamId)`. Map each row from:

```ts
{
  tournamentRosterId: entry.id,
  name: entry.displayNameSnapshot,
  number: entry.jerseyNumber,
}
```

Change the local match-sheet row type from `number: number` to `number: number | null` and render `number ?? '—'`. Do not change box-score request identity: it remains `tournamentRosterId`.

- [ ] **Step 6: Run page tests**

```bash
npm test -- src/pages/tournaments/TournamentDetailPage.test.tsx src/pages/matches/MatchSumulaPage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit page wiring**

```bash
git add src/pages/tournaments/TournamentDetailPage.tsx src/pages/tournaments/TournamentDetailPage.test.tsx src/pages/matches/MatchSumulaPage.tsx src/pages/matches/MatchSumulaPage.test.tsx
git commit -m "feat: connect registration and roster screens"
```

### Task 7: Preserve future-phase mock tests and validate the branch

**Files:**
- Modify as required by failing imports:
  - `src/features/sports/useBracketView.test.tsx`
  - `src/pages/matches/MatchDetailPage.test.tsx`
  - `src/pages/matches/MatchesPage.test.tsx`
  - `src/pages/tournaments/tabs/GroupsTab.test.tsx`
  - `src/pages/tournaments/tabs/OverviewTab.test.tsx`
  - `src/pages/tournaments/tabs/StandingsTab.test.tsx`
- Modify only if TypeScript reports a private mock-model mismatch:
  - `src/services/sportsApi/store.ts`
  - `src/services/sportsApi/mock-sports-data.ts`

**Interfaces:**
- Consumes: real Phase 3 exports and existing mock fixtures.
- Produces: a green repository without re-exporting the Phase 3 store methods or changing later-phase runtime behavior.

- [ ] **Step 1: Run the complete test suite to expose remaining mock coupling**

```bash
npm test
```

Expected before boundary cleanup: FAIL only in tests importing or relying on the removed public mock Phase 3 wrappers, or PASS if earlier tasks already isolated them.

- [ ] **Step 2: Make affected tests own their future-phase fixtures**

For each failing later-phase test, mock only the public boundary it consumes:

```ts
vi.mock('../../services/sportsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/sportsApi')>()
  return {
    ...actual,
    getTournamentTeams: vi.fn().mockResolvedValue(tournamentTeams),
    getAllTournamentTeams: vi.fn().mockResolvedValue(tournamentTeams),
    getTournamentRoster: vi.fn().mockResolvedValue(roster),
  }
})
```

Use the correct relative path for each file. Reuse existing fixture constants already present in that test or `mock-sports-data.ts`; do not add a second global store or production fallback.

If `store.ts` fails type checking because public canonical types no longer contain mock-only fields, define the smallest local intersections:

```ts
type MockTournamentTeam = TournamentTeam & {
  blockKey?: string
  isDeleted?: boolean
}

type MockRosterEntry = {
  id: number
  tournamentId: number
  tournamentTeamId: number
  athleteId: number
  jerseyNumber: number
  role: RosterRole
  isDeleted?: boolean
}
```

Use these types only inside the store/data module. Do not export them from `sportsApi/index.ts`.

- [ ] **Step 3: Run focused sports tests**

```bash
npm test -- src/services/sportsApi src/features/sports src/pages/tournaments src/pages/matches
```

Expected: PASS.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 5: Run the production build**

```bash
npm run build
```

Expected: exit code 0; TypeScript project build and Vite production build succeed.

- [ ] **Step 6: Run the complete unit/integration suite**

```bash
npm test
```

Expected: exit code 0 with all Vitest files passing.

- [ ] **Step 7: Confirm scope and diff hygiene**

```bash
git diff --check
git status --short
git diff --stat origin/dev...HEAD
```

Expected: no whitespace errors; only Phase 3 frontend integration files are changed; no root roadmap change, no `AdminTeamsPage` migration, no dependency change, and no credentials in the diff.

- [ ] **Step 8: Commit boundary-test cleanup if Step 2 changed files**

```bash
git add src/features/sports/useBracketView.test.tsx src/pages/matches/MatchDetailPage.test.tsx src/pages/matches/MatchesPage.test.tsx src/pages/tournaments/tabs/GroupsTab.test.tsx src/pages/tournaments/tabs/OverviewTab.test.tsx src/pages/tournaments/tabs/StandingsTab.test.tsx src/services/sportsApi/store.ts src/services/sportsApi/mock-sports-data.ts
git commit -m "test: isolate future sports phase fixtures"
```

Skip this commit when Step 2 produced no diff.

## Manual Smoke Check (optional)

Use the supplied local account only in a local browser session; do not place credentials in code, tests, shell history, screenshots, or documentation. If suitable organization/team fixtures exist, verify:

1. Search and enroll a team.
2. Open its roster and add a member with a blank jersey.
3. Edit the member to jersey `0`, then clear it.
4. Withdraw and re-enroll the member; confirm the visible roster returns.
5. Withdraw and re-enroll the team; confirm the same registration is usable.

The API owns historical ID preservation. The frontend check verifies refresh/invalidation and read models, not database internals.

## Merge Gate

Stop after implementation and green validation for code review. Push the feature branch and open a PR to `dev` only after the user approves execution. Mark Phase 3 complete in the root roadmap only after that PR is merged.
