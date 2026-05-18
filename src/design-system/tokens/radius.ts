/**
 * Quadra radius tokens.
 * CSS variables in theme.css are the runtime source of truth.
 */

export const radius = {
  xs:   '4px',   // tight chips, micro badges
  sm:   '6px',   // inputs, small buttons
  md:   '8px',   // buttons, form controls (alias: --radius)
  lg:   '12px',  // cards, panels
  xl:   '16px',  // modals, large surfaces
  pill: '999px', // pill badges, avatar chips
} as const
