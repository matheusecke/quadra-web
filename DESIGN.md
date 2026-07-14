# Quadra Design System

## Theme

Quadra is a product interface for administrators and role-based users operating basketball organizations during repeated work sessions on desktop and laptop screens. The physical scene is an organizer or admin reviewing memberships, invitations, and tenant state from a bright office or gym-side table, needing clarity more than spectacle.

Default theme: light, restrained, dense, and professional.

Dark mode exists as a supported system state through `html[data-theme="dark"]`, but it should remain charcoal, readable, and operational rather than near-black or theatrical. It should not become the default aesthetic unless a task explicitly targets dim operational environments.

## Color Palette

Use the runtime CSS variables in `src/design-system/theme.css` as the source of truth. Prefer semantic variables over raw values.

### Strategy

Restrained product palette: tinted neutral surfaces, clear borders, and one Persimmon accent used for primary actions, focus, and important active states. Accent should stay below roughly 10% of most application screens.

### Core Tokens

- Background: `--bg`
- Primary surface: `--surface`
- Secondary surfaces: `--surface-2`, `--surface-3`
- Court surface: `--surface-court`
- Inverse surface: `--surface-inv`
- Text: `--ink`, `--ink-2`
- Muted text: `--muted`, `--muted-2`, `--muted-3`
- Borders: `--border`, `--border-strong`, `--border-bold`
- Accent: `--accent`
- Accent deep: `--accent-deep`
- Accent soft: `--accent-soft`
- Accent foreground: `--accent-ink`

### Status Tokens

- Live or danger emphasis: `--status-live`, `--status-live-bg`
- Success or active state: `--status-ok`, `--status-ok-bg`
- Warning or pending state: `--status-warn`, `--status-warn-bg`
- Informational state: `--status-info`, `--status-info-bg`

Do not introduce feature-specific color systems without updating the design system. Status meaning must also be present in text, icons, labels, or structure.

## Typography

Primary font: `Inter` through `--font-sans`.

Monospace font: `JetBrains Mono` through `--font-mono`.

Use the type tokens from `theme.css`:

- Display: `--type-display` with `--type-display-tracking`
- Title: `--type-title` with `--type-title-tracking`
- Body: `--type-body`
- Medium body: `--type-body-md`
- Caption: `--type-caption`
- Micro labels: `--type-micro` with `--type-micro-tracking`

Typography should be compact and legible. Use scale, weight, and spacing to create hierarchy rather than decorative color. Keep prose line length near 65 to 75 characters when pages include explanatory text.

## Layout

Use the 4px spacing scale from `--space-1` through `--space-8`. Product screens should feel dense but not cramped.

Recommended structure:

- Auth screens: minimal, centered, direct, with clear error recovery.
- App shell: persistent navigation, visible user/session context, and a clear organization switch entry point.
- Admin lists: tables, filters, badges, and inline or side-panel editing when appropriate.
- Account screens: compact cards for identity, session, organizations, and password actions.
- Role-context screens with missing backend support: small informational surfaces, not fake dashboards.

Avoid nested cards. Use cards when grouping account or form content, tables when comparing records, and empty states when the backend does not yet expose a real workflow.

## Components

Prefer primitives from `src/components/ui` before creating new UI:

- `Button`
- `Card`
- `Input`
- `Field`
- `Badge`
- `Tabs`
- `Avatar`
- `Table`
- `StatCard`
- `EmptyState`
- `LoadingState`
- `ErrorState`

Component use:

- Buttons should use `primary` for the main action, `secondary` for standard alternatives, `ghost` for low-emphasis navigation, and `danger` for destructive actions.
- Badges should represent role, status, admin flags, invite state, and active context.
- Tables are the default for users, organizations, teams, and affiliations.
- Tabs are appropriate for closely related admin workspaces such as user affiliations and team affiliations.
- Empty and error states must be explicit about whether the state is empty, blocked, unauthorized, or not implemented by the API yet.

### Interactive controls

The complete, normative policy for native and custom interactive controls is [docs/design-system/interactive-controls.md](docs/design-system/interactive-controls.md). Visible controls must not retain a generic browser appearance when it conflicts with Quadra DS; reuse or extend an accessible primitive, preserve native semantics and behavior, and consume `theme.css` tokens.

## Motion

Motion should be purposeful and restrained. Use motion for session transitions, loading feedback, focus, and small state changes only.

Do not animate layout properties. Respect `prefers-reduced-motion`. Use smooth ease-out timing, never bounce or elastic motion.

## Density

Default density uses `--row-h: 40px` and `--pad: 16px`.

Compact density is supported through `html[data-density="compact"]`, reducing row height and padding. Components should size themselves through these variables so dense admin tables can adapt without alternate component implementations.

## Implementation Rules

- Import `src/design-system/theme.css` once at the app entry point.
- Never hardcode raw color values in screens. Use CSS variables or token imports.
- Never use arbitrary radius values. Use `--radius-xs`, `--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl`, or `--radius-pill`.
- Prefer semantic CSS variables over static token constants in component CSS.
- Product screens should consume tokens through reusable components instead of redefining visual language.
- Dark mode and compact density must remain CSS-only.
- Do not use gradient text, decorative glassmorphism, colored side-stripe card accents, or repeated identical card grids.
