---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
  - "src/components/**"
  - "src/pages/**"
  - "src/design-system/**"
---

# Frontend

## Design System: Quadra DS

All UI must follow Quadra DS (custom design system in `src/design-system/`). This includes:
- Design tokens and CSS variables in `theme.css`
- Primitive components in `src/components/ui/`
- Color palette: Persimmon accent, supporting colors, dark/compact mode variants
- Typography: Inter for body, JetBrains Mono for code

Never hardcode colors, spacing, or typography values in components. Always reference design tokens via CSS variables or component props.

## Design Principles

Pick one primary principle. Don't mix randomly.

| Principle | When to use |
|---|---|
| **Glassmorphism** | Overlays, modern dashboards |
| **Neumorphism** | Settings panels, minimal controls |
| **Brutalism** | Developer tools, editorial sites |
| **Minimalism** | Portfolios, documentation, content-first |
| **Maximalism** | Creative agencies, e-commerce |
| **Claymorphism** | Playful apps, onboarding |
| **Bento Grid** | Dashboards, feature showcases |
| **Aurora / Mesh Gradients** | Landing pages, hero sections |
| **Flat Design** | Mobile apps, system UI |
| **Material Elevation** | Data-heavy apps, enterprise |
| **Editorial** | Blogs, long-form content |

## Component Framework

This project uses **CSS Modules** for component styling. Don't mix competing approaches.

| Category | This Project |
|---|---|
| CSS | CSS Modules (one `.module.css` per component file) |
| Primitives | shadcn/ui, Radix, Headless UI, Ark UI, DaisyUI, Mantine, Chakra, Vuetify |
| Animation | CSS transitions, Framer Motion, GSAP, View Transitions API, AutoAnimate |
| Charts | Recharts, D3, Chart.js, Visx, ECharts, Nivo |
| Icons | Lucide, Phosphor, Heroicons, Tabler Icons, Iconify |

## Layout

- CSS Grid for 2D, Flexbox for 1D. Use `gap`, not margin hacks.
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- Mobile-first. Touch targets: minimum 44x44px.

## Accessibility (non-negotiable)

- All interactive elements keyboard-accessible.
- Images: meaningful `alt` text. Decorative: `alt=""`.
- Form inputs: associated `<label>` or `aria-label`.
- Contrast: 4.5:1 normal text, 3:1 large text.
- Visible focus indicators. Never `outline: none` without replacement.
- Color never the sole indicator.
- `aria-live` for dynamic content. Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Performance

- Images: `loading="lazy"` below fold, explicit `width`/`height`.
- Fonts: `font-display: swap`.
- Animations: `transform` and `opacity` only.
- Large lists: virtualize at 100+ items.
- Bundle size: never import a whole library for one function.
