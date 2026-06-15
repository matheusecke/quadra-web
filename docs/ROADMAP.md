# Frontend Affiliation Roadmap

## Current Contract

- Normal affiliation flows in `tcc-web` should use the JWT-scoped API contract:
  - `/organization-user-affiliations`
  - `/organization-user-affiliations/:id`
  - `/organization-user-affiliations/:id/resend`
  - `/organization-team-affiliations`
  - `/organization-team-affiliations/:id`
  - `/organization-team-affiliations/:id/resend`
- These normal flows no longer use `:orgId` in the request path to define organization scope.
- The active organization comes from the JWT selected by `POST /auth/org`, exposed in the frontend through `useAuth().user.organizationId`.

## Temporary Exceptions

- The admin status override endpoints still keep explicit organization routing:
  - `PATCH /organizations/:orgId/user-affiliations/:id/status`
  - `PATCH /organizations/:orgId/team-affiliations/:id/status`
- These endpoints are temporary exceptions and are still used today by:
  - `UserAffiliationDrawer`
  - `TeamAffiliationDrawer`

## Planned Migration

- When the backend creates a dedicated admin affiliation module or surface, the frontend should migrate the exceptional admin status flows to that new API.
- The current admin route `/admin/organizations/:orgId/affiliations` should then stop depending on legacy affiliation assumptions tied to `orgId` path scope.
- `GET /teams/:teamId/affiliations` is not used in the current frontend and should stay out of migration scope unless a real UI consumer appears.
