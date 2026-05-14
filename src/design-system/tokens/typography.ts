/**
 * Quadra typography tokens.
 * CSS variables in theme.css are the runtime source of truth.
 * These references are for documentation and TS consumers.
 */

export const fontFamily = {
  sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Menlo, Monaco, monospace",
} as const

export const typeScale = {
  display:  { font: '600 28px/1.2',  tracking: '-0.5px' },
  title:    { font: '600 18px/1.4',  tracking: '-0.2px' },
  body:     { font: '400 14px/1.5',  tracking: 'normal' },
  bodyMd:   { font: '500 14px/1.4',  tracking: 'normal' },
  caption:  { font: '400 13px/1.45', tracking: 'normal' },
  micro:    { font: '500 11px/1.4',  tracking: '0.06em' },
} as const
