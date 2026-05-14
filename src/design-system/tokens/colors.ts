/**
 * Quadra color tokens.
 * These are static references for JS/TS code and documentation.
 * The runtime source of truth is CSS variables in theme.css.
 */

export const accent = {
  /** Active accent — Persimmon */
  persimmon: '#EC5D2A',
  persimmonDeep: '#C2410C',
  persimmonSoft: '#FDE7DD',
  persimmonInk: '#ffffff',

  /** Alternative accents (documented, not active) */
  electricBlue: '#2563EB',
  cobalt: '#1D4ED8',
  coralWarm: '#FF6B57',
  tangerine: '#FF8C42',
} as const

export const light = {
  bg: '#fafafa',
  surface: '#ffffff',
  surface2: '#f5f5f5',
  surface3: '#ededed',
  surfaceInv: '#1c1c1c',

  border: '#ededed',
  borderStrong: '#dfdfdf',
  borderBold: '#c7c7c7',

  ink: '#171717',
  ink2: '#2a2a2a',
  muted: '#707070',
  muted2: '#9a9a9a',
  muted3: '#b2b2b2',
} as const

export const dark = {
  bg: '#0f0f0f',
  surface: '#171717',
  surface2: '#1f1f1f',
  surface3: '#2a2a2a',
  surfaceInv: '#ffffff',

  border: '#262626',
  borderStrong: '#333333',
  borderBold: '#525252',

  ink: '#f5f5f5',
  ink2: '#d4d4d4',
  muted: '#a3a3a3',
  muted2: '#737373',
  muted3: '#525252',
} as const

export const status = {
  live: '#ef4444',
  liveBg: '#fee2e2',
  liveBgDark: 'rgba(239, 68, 68, 0.18)',

  ok: '#16a34a',
  okBg: '#dcfce7',
  okBgDark: 'rgba(22, 163, 74, 0.18)',

  warn: '#d97706',
  warnBg: '#fef3c7',
  warnBgDark: 'rgba(217, 119, 6, 0.18)',
} as const
