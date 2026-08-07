# Product

## Register

product

## Users

Quadra serves authenticated users operating inside a multi-tenant basketball championship platform. The primary user groups are:

- System administrators who manage global users, organizations, teams, and cross-tenant lifecycle operations.
- Organization administrators who manage an active organization's users, team affiliations, invitations, and basic organization settings.
- Team administrators who represent a team inside an organization context and need a clear view of team affiliation status.
- Athletes who need organization-scoped access to their participation context, future schedules, history, and statistics.
- Coaching staff who need organization-scoped access to their team context, future roster or match workflows, and account actions.

Every user experience is shaped by the active organization selected in the session. User and team identities are global, but operational data, roles, history, and permissions are contextual to the active tenant.

## Product Purpose

Quadra centralizes basketball championship operations that are otherwise scattered across spreadsheets, chats, social networks, and informal records. The product exists to make organizations, teams, memberships, invitations, competition participation, schedules, match results, and sporting history manageable in one isolated multi-tenant system.

The current frontend should prioritize the real backend surface: authentication, session bootstrap, organization selection, platform administration, organization and team lifecycle, user and team affiliations, championship operation, matches, schedules, athlete history, standings, statistics, and account/session management. Notifications, uploads, and advanced analytics remain future product areas until their APIs are implemented.

Success means users always understand which organization they are operating in, which role they have there, what actions are currently available, and where the product is intentionally waiting on backend capability rather than presenting fake dashboards.

## Brand Personality

Dense, disciplined, operational, and court-aware.

Quadra should feel like a serious control room for basketball operations: compact enough for repeated administrative work, calm enough for long sessions, and specific enough to avoid generic SaaS dashboard language. It should favor direct labels, visible state, and fast decision paths over decorative storytelling.

## Anti-references

Quadra should not look like:

- A generic SaaS template with oversized hero metrics, gradient text, identical cards, and empty marketing gloss.
- A consumer sports fan site focused on spectacle, player hype, or entertainment-first visuals.
- A spreadsheet clone that ignores hierarchy, role context, and critical workflow states.
- A fake analytics product that invents data beyond the implemented championship, match, schedule, standings, or statistics APIs.
- A modal-heavy admin panel where simple edits and status changes are hidden behind unnecessary interruption.

## Design Principles

1. Make tenant context impossible to miss. Every authenticated surface should clearly show the active organization, role, and any reduced or missing context.
2. Respect API reality. Build only on implemented endpoints and use empty, blocked, or informational states for capabilities that are still unavailable, such as notifications and uploads.
3. Design for operational density. Lists, filters, statuses, invitations, and role changes should be compact, scannable, and keyboard-friendly.
4. Separate platform administration from organization operation. System-admin flows cross tenants intentionally; organization-role flows stay scoped to the active tenant.
5. Preserve sporting specificity without theatrical UI. Basketball vocabulary, statuses, and workflows should inform the interface, but the product should remain a professional management tool.

## Accessibility & Inclusion

No project-specific accessibility exception is documented. Default to WCAG 2.2 AA expectations for contrast, focus visibility, semantic structure, labels, keyboard access, and form errors.

Respect `prefers-reduced-motion` for spinners and future motion. Do not rely on color alone for role, invite, or status meaning. Keep dense tables readable with clear header structure, visible row states, and explicit empty/error messaging.
