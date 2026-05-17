# Quadra Design System

**Visual direction:** Clean, dense, professional championship-management dashboard.  
**Inspiration:** Supabase-style UI — near-black ink, white surfaces, subtle borders, minimal shadows.  
**Primary font:** Inter  
**Mono font:** JetBrains Mono

---

## Active Accent

| Token | Value | Name |
|-------|-------|------|
| `--accent` | `#EC5D2A` | **Persimmon** ← active |
| `--accent-deep` | `#C2410C` | Persimmon Deep |
| `--accent-soft` | `#FDE7DD` | Persimmon Soft (tints, backgrounds) |
| `--accent-ink` | `#ffffff` | Text on accent fills |

### Alternative Accents (documented, not active)

| Name | Value |
|------|-------|
| Electric Blue | `#2563EB` |
| Cobalt | `#1D4ED8` |
| Coral Warm | `#FF6B57` |
| Tangerine | `#FF8C42` |

To switch accents, update `--accent`, `--accent-deep`, `--accent-soft`, and `--accent-ink` in `theme.css`.

---

## Using CSS Variables

Import `theme.css` once at the app entry point (already done in `main.tsx`).  
Reference variables directly in any CSS file or inline style:

```css
.my-button {
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
}
```

### Available variable groups

| Group | Variables |
|-------|-----------|
| Accent | `--accent`, `--accent-deep`, `--accent-soft`, `--accent-ink` |
| Surfaces | `--bg`, `--surface`, `--surface-2`, `--surface-3`, `--surface-court`, `--surface-inv` |
| Borders | `--border`, `--border-strong`, `--border-bold` |
| Text | `--ink`, `--ink-2`, `--muted`, `--muted-2`, `--muted-3` |
| Status | `--status-live`, `--status-ok`, `--status-warn`, `--status-info` + `*-bg` variants |
| Radius | `--radius-xs`, `--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl`, `--radius-pill` |
| Spacing | `--space-1` … `--space-8` (4 → 64 px) |
| Typography | `--font-sans`, `--font-mono`, `--type-display`, `--type-title`, `--type-body`, … |
| Density | `--row-h`, `--pad` |
| Shadows | `--shadow-1`, `--shadow-2` |

---

## Dark Mode

The app uses the browser/system color scheme as the default on startup. A small inline script in `index.html` sets `data-theme` before the React bundle loads, which avoids a light/dark flash.

Manual preferences can be stored under `quadra.theme` and will override the system default:

```ts
localStorage.setItem('quadra.theme', 'dark')
document.documentElement.setAttribute('data-theme', 'dark')
```

Set `data-theme="dark"` on the `<html>` element for a temporary override:

```ts
document.documentElement.setAttribute('data-theme', 'dark')
```

Remove the stored value to return to following the system preference:

```ts
localStorage.removeItem('quadra.theme')
```

All surface, border, text, and shadow variables are automatically overridden. Accent and status foreground colors remain the same; only their background tints shift to semi-transparent dark-safe values.

---

## Compact Density

Set `data-density="compact"` on the `<html>` element:

```ts
document.documentElement.setAttribute('data-density', 'compact')
```

This reduces `--row-h` from `40px` → `32px` and `--pad` from `16px` → `12px`. Components that size themselves via these variables will automatically compact.

---

## Utility Classes

| Class | Effect |
|-------|--------|
| `.mono` | Switches text to `var(--font-mono)` |
| `.muted` | Sets color to `var(--muted)` |
| `.tiny` | Applies `--type-micro` scale + letter-spacing |

---

## TypeScript Tokens

For JS/TS consumers (e.g., canvas rendering, charting libraries, test assertions):

```ts
import { accent, light, dark, status, radius, space, shadows } from '@/design-system/tokens'

// accent.persimmon → '#EC5D2A'
// light.bg → '#fafafa'
// radius.lg → '12px'
```

These are static references only. CSS variables in `theme.css` remain the runtime source of truth.

---

## Rules

1. **Never hardcode raw color hex values in screens.** Use CSS variables or token imports.
2. **Never use arbitrary radius values** not in the scale. Stick to `--radius-xs` through `--radius-pill`.
3. **Prefer semantic CSS variables** over token constants wherever possible.
4. **Product screens must consume tokens through components** — not by re-declaring the same CSS variables.
5. **Feature-specific UI must not introduce new visual language** without a corresponding update to this design system.
6. **Dark mode and compact density are CSS-only** — no JS logic required in components.
