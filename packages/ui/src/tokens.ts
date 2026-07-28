/**
 * Armz Clash design tokens — spacing, color, motion, layout.
 * Prefer these tokens over arbitrary utility values in applications.
 */

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

/** Semantic spacing aliases for consistent page rhythm. */
export const space = {
  pageX: 'clamp(1rem, 4vw, 2rem)',
  pageY: 'clamp(1.25rem, 3vw, 2.5rem)',
  section: 'clamp(2rem, 5vw, 4rem)',
  card: '1.25rem',
  cardGap: '1rem',
  stack: '1rem',
  cluster: '0.75rem',
  navGap: '0.5rem',
  control: '0.625rem 1rem',
  safeBottom: 'env(safe-area-inset-bottom, 0px)',
  safeTop: 'env(safe-area-inset-top, 0px)',
  safeLeft: 'env(safe-area-inset-left, 0px)',
  safeRight: 'env(safe-area-inset-right, 0px)',
} as const;

export const containers = {
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  '2xl': '90rem',
} as const;

export const radii = {
  sm: '0.375rem',
  md: '0.625rem',
  lg: '0.875rem',
  xl: '1.125rem',
  full: '9999px',
} as const;

export const colors = {
  bg: {
    base: '#03060b',
    elevated: '#080d15',
    panel: '#0d1521',
    overlay: 'rgba(5, 8, 14, 0.72)',
  },
  surface: {
    default: 'rgba(22, 29, 45, 0.92)',
    muted: 'rgba(18, 24, 38, 0.88)',
    highlight: 'rgba(36, 48, 74, 0.9)',
  },
  border: {
    subtle: 'rgba(148, 163, 184, 0.14)',
    strong: 'rgba(212, 175, 106, 0.35)',
    focus: 'rgba(125, 211, 252, 0.8)',
  },
  text: {
    primary: '#f4f1ea',
    secondary: '#c7cdd8',
    muted: '#93a0b5',
    inverse: '#0b0e14',
  },
  accent: {
    gold: '#c7a056',
    goldSoft: 'rgba(199, 160, 86, 0.16)',
    cyan: '#54cbff',
    cyanSoft: 'rgba(84, 203, 255, 0.14)',
  },
  status: {
    success: '#3ecf8e',
    warning: '#f0b429',
    danger: '#f07178',
    info: '#5ec8ff',
  },
  rarity: {
    common: '#9aa4b2',
    uncommon: '#3ecf8e',
    rare: '#5b9dff',
    epic: '#b07cff',
    legendary: '#f0b429',
    mythic: '#ff6b9d',
  },
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.35)',
  md: '0 8px 24px rgba(0, 0, 0, 0.35)',
  glow: '0 0 0 1px rgba(212, 175, 106, 0.25), 0 12px 40px rgba(0, 0, 0, 0.45)',
} as const;

export const zIndex = {
  base: 0,
  header: 40,
  dropdown: 50,
  overlay: 60,
  modal: 70,
  toast: 80,
} as const;

export const motion = {
  duration: {
    fast: '120ms',
    normal: '200ms',
    slow: '320ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export const header = {
  height: '4rem',
  heightMobile: '3.5rem',
} as const;
