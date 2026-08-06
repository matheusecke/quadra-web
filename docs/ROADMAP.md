# Frontend Roadmap

Planned and pending frontend work across areas. Each area is its own section.

## Affiliations

### Current Contract

- Normal affiliation flows in `quadra-web` should use the JWT-scoped API contract:
  - `/organization-user-affiliations`
  - `/organization-user-affiliations/:id`
  - `/organization-user-affiliations/:id/resend`
  - `/organization-team-affiliations`
  - `/organization-team-affiliations/:id`
  - `/organization-team-affiliations/:id/resend`
- These normal flows no longer use `:orgId` in the request path to define organization scope.
- The active organization comes from the JWT selected by `POST /auth/org`, exposed in the frontend through `useAuth().user.organizationId`.

### Temporary Exceptions

- The admin status override endpoints still keep explicit organization routing:
  - `PATCH /organizations/:orgId/user-affiliations/:id/status`
  - `PATCH /organizations/:orgId/team-affiliations/:id/status`
- These endpoints are temporary exceptions and are still used today by:
  - `UserAffiliationDrawer`
  - `TeamAffiliationDrawer`

### Planned Migration

- When the backend creates a dedicated admin affiliation module or surface, the frontend should migrate the exceptional admin status flows to that new API.
- The current admin route `/admin/organizations/:orgId/affiliations` should then stop depending on legacy affiliation assumptions tied to `orgId` path scope.
- `GET /teams/:teamId/affiliations` is not used in the current frontend and should stay out of migration scope unless a real UI consumer appears.

## Team Detail Page

No dedicated team detail screen exists today. Routing only exposes the team list (`/teams`, `OrgTeamsPage`) and the admin team list (`/admin/teams`); there is no `/teams/:teamId` route, and nothing in the app links to a single team.

### Planned

- Add a `/teams/:teamId` route with a team detail page (roster, tournaments, standings context — scope TBD when built).
- Once it exists, the **champion highlight** on the tournament detail screen should become a link to `/teams/:championTeamId`.

### Pending consumer

- The champion highlight (tournament detail, `COMPLETED` status) is shipping as a non-interactive result element for now, because there is no team destination to link to. It becomes clickable once the team detail page above exists. See `docs/superpowers/specs/*-tournament-header-actions-design.md`.

## Tab Navigation via Nested Routes

Detail pages with tabs (`TournamentDetailPage`, `MatchDetailPage`, `AthleteDetailPage`, `AdminAffiliationsPage`) currently hold the active tab in local `useState`, so a tab is not addressable, shareable, or refresh-safe. As a first step, tournament detail seeds and syncs its active tab through a `?tab=` query param (see `docs/superpowers/specs/*-tournament-match-creation-and-edit-return-design.md`).

### Planned

- Standardize tab navigation across these pages onto **nested routes** (`/tournaments/:id/matches`, `/tournaments/:id/teams`, …) with `<Outlet>` layouts, replacing both local state and the interim query param.
- Migration from the query-param seam is mechanical: swap `searchParams.get('tab')` for the route segment and change return links from `?tab=matches` to `/matches`.

### Known friction

- `TournamentDetailPage` is the bulk of the effort: its tabs are **conditional on tournament format**, and the page owns heavy shared admin state (enroll, roster, complete, reopen). That state must move to an `<Outlet context>`, context provider, or route loader, and the tab `.test.tsx` suites need reworking.
- Conditional tabs conflict with static route config: an invalid path like `/tournaments/:id/bracket` for a league needs a guard/redirect, whereas the query param falls back to `overview` for free.
- `MatchSumulaPage` and `OrgSelectionPage` use `Tabs` for team/context switching, not navigation — they stay out of scope.
- This is a dedicated refactor project and should get its own spec, not be folded into feature work.
