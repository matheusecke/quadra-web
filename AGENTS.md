# AGENTS.md

This file supplements the repository-level `AGENTS.md` for work inside `tcc-web/`.

## Scope

- Treat this package as frontend-only unless the task explicitly requires cross-project changes.
- Preserve existing architecture, naming, and styling patterns. Reuse existing components, hooks, utilities, and design tokens before creating new ones.

## Frontend Conventions

- Follow the existing design system in `src/design-system/` and the UI primitives already used by the project.
- Before introducing a visible native control, consult [`docs/design-system/interactive-controls.md`](docs/design-system/interactive-controls.md). Do not leave generic browser styling when Quadra DS requires a reusable, accessible treatment.
- Do not hardcode colors, spacing, radius, shadows, or typography in components when a token or existing primitive already covers the case.
- Keep styling aligned with the current CSS approach. Do not introduce a competing styling system for a localized change.
- Use semantic HTML and keep keyboard interaction, focus states, labels, and contrast intact.
- Respect `prefers-reduced-motion` when changing animations or transitions.

## Security

- Never store tokens, secrets, or sensitive personal data in `localStorage` or `sessionStorage`.
- Do not use `dangerouslySetInnerHTML` unless the task explicitly requires it and the content is sanitized.
- Never log tokens, passwords, API keys, or PII to the console or external services.
- Treat client-side validation as UX only. If a change affects input handling, preserve server-side validation assumptions.
- Treat any value read from browser storage as untrusted input.

## Performance

- Prefer targeted imports over whole-library imports.
- Keep animations on `transform` and `opacity` when possible.
- Add lazy loading and explicit dimensions for images when relevant to the change.
- Avoid unnecessary rerender triggers and expensive work in render paths.

## Code Quality

- Prefer explicit code over premature abstractions.
- Do not refactor adjacent code unless it directly supports the requested change.
- Use clear names: booleans with `is` / `has` / `should` / `can`, functions with verb-first names, internal handlers with `handle*`, prop callbacks with `on*`.
- Keep imports grouped and ordered consistently with the surrounding code.
- Prefer named exports unless the existing file pattern clearly uses default exports.

## Testing

- Test behavior, not implementation details.
- After changes, run the most specific relevant test file first, then broader validation only if needed.
- Do not rely on retries to pass flaky tests.
- Prefer real implementations and mock only at system boundaries.
