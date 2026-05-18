/**
 * Quadra spacing tokens — 4px base scale.
 * CSS variables in theme.css are the runtime source of truth.
 */

export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
} as const satisfies Record<number, string>

export const density = {
  default: { rowH: '40px', pad: '16px' },
  compact: { rowH: '32px', pad: '12px' },
} as const
