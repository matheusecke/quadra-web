/**
 * Quadra shadow tokens — minimal elevation scale.
 * CSS variables in theme.css are the runtime source of truth.
 */

export const shadows = {
  /** Subtle lift — cards, inputs */
  shadow1: '0 1px 2px rgba(0, 0, 0, 0.04)',
  /** Floating elements — dropdowns, modals */
  shadow2: '0 4px 16px rgba(0, 0, 0, 0.06)',

  /** Dark mode equivalents */
  shadow1Dark: '0 1px 2px rgba(0, 0, 0, 0.5)',
  shadow2Dark: '0 4px 16px rgba(0, 0, 0, 0.4)',
} as const
