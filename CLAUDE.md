# Project Instructions

## Commit Attribution

Keep commit messages limited to the repository change. Do not add `Co-authored-by`, `Signed-off-by`, `Generated-by`, or equivalent authorship, provenance, or tool-identification trailers or commit-body metadata.

## Commands

```bash
# Build
npm run build            # build for production

# Lint
npm run lint             # check code style
npm run lint -- --fix    # auto-fix linting issues

# Dev
npm run dev              # start Vite dev server
npm run preview          # preview production build locally
```

## Architecture

React frontend with feature-based structure:
- `src/components/`: Reusable UI components (Quadra DS primitives in `ui/` folder)
- `src/pages/`: Page-level components for routes
- `src/services/`: API calls and business logic
- `src/contexts/`: React context for state management
- `src/hooks/`: Custom React hooks
- `src/design-system/`: Design tokens, CSS variables, and theme configuration
- CSS Modules for component styling with design-system variables

## Key Decisions

- Using Quadra DS (custom design system) for consistent UI across the app
- Before introducing visible native controls, follow `docs/design-system/interactive-controls.md`; prefer accessible Quadra DS primitives or reusable visual layers over generic browser styling.
- CSS Modules for scoped styling instead of global CSS
- React Router v7 for client-side routing
- React Query for server state management
- Axios for HTTP requests
