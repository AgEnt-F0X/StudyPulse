// StudyPulse Spatial Editorial Design System
// Warm travertine canvas + botanical obsidian-emerald glass panels with
// champagne-gold rims. Ivory paper where the book opens. Emerald/amber action.

export const C = {
  // Warm canvas
  bg: 'var(--bg-primary, #E6DFD5)',
  bgHi: 'var(--bg-canvas-hi, #F4F0EA)',
  bgSoft: 'var(--surface-low, rgba(16,26,21,0.72))',
  card: 'var(--bg-card, rgba(18,29,24,0.92))',
  cardGlass: 'var(--bg-card-glass, rgba(18,29,24,0.92))',
  cardSoft: 'var(--surface-card-soft, rgba(30,53,43,0.55))',
  cardHover: 'var(--surface-card-hover, rgba(30,53,43,0.85))',
  active: 'var(--surface-active, #1E352B)',
  glassRaised: 'rgba(20, 32, 27, 0.95)',

  // Champagne hairlines
  border: 'var(--border-color, rgba(212,195,163,0.28))',
  borderSoft: 'var(--border-soft, rgba(212,195,163,0.14))',
  borderStrong: 'rgba(212,195,163,0.45)',
  gold: '#D4C3A3',

  // Ink on glass
  text: 'var(--text-primary, #F4F0EA)',
  textMuted: 'var(--text-secondary, #C9C2B4)',
  textFaint: 'var(--text-muted, #8F8A7E)',
  ink: '#232019', // ink on warm paper

  // Action
  primary: 'var(--primary, #10B981)',
  primaryDeep: 'var(--primary-deep, #059669)',
  primaryGlow: 'var(--primary-glow, #34D399)',
  primaryBright: '#6EE7B7',
  fill: '#10B981',
  fillText: '#06251A',

  // Status
  success: '#34D399',
  warning: '#F59E0B',
  error: '#EF4444',

  // Legacy accents remapped into the spatial palette
  blue: '#6EE7B7',
  blueDark: '#10B981',
  green: '#34D399',
  greenDark: '#059669',
  amber: '#F59E0B',
  amberDeep: '#D97706',
  red: '#EF4444',
  orange: '#F59E0B',
  yellow: '#F59E0B',
  purple: '#D4C3A3',
  purpleDark: '#A8987A',
  pink: '#EF4444',

  // Paper
  paper: '#FAF7F2',
  paperHi: '#FBF8F3',
}

// Solid fills for legacy gradient consumers
export const gradients = {
  logo: 'var(--grad-logo, #10B981)',
  primary: 'var(--grad-primary, #10B981)',
  reward: 'var(--grad-reward, #F59E0B)',
  hero: 'none',
}

export const tint = (hex, a = 0.12) => {
  if (!hex || typeof hex !== 'string') return `rgba(212,195,163,${a})`
  let targetHex = hex
  if (targetHex.startsWith('var(')) {
    const match = targetHex.match(/#[0-9a-fA-F]{3,6}/)
    if (match) targetHex = match[0]
    else if (targetHex.includes('amber') || targetHex.includes('orange') || targetHex.includes('yellow')) targetHex = '#F59E0B'
    else if (targetHex.includes('red') || targetHex.includes('pink') || targetHex.includes('error')) targetHex = '#EF4444'
    else if (targetHex.includes('green') || targetHex.includes('success')) targetHex = '#34D399'
    else targetHex = '#D4C3A3'
  }
  const cleanHex = targetHex.startsWith('#') ? targetHex.slice(1) : targetHex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return `rgba(${r},${g},${b},${a})`
  }
  const n = parseInt(cleanHex, 16)
  if (isNaN(n)) return `rgba(212,195,163,${a})`
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgba(${r},${g},${b},${a})`
}

export const fonts = {
  heading: "'Instrument Serif', Georgia, serif",
  body: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace",
  hand: "'Caveat', 'Segoe Print', cursive",
}

export const radius = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 24, pill: 999 }

export const shadow = {
  card: '0 10px 28px rgba(30,25,15,0.22)',
  lift: '0 20px 50px rgba(30,25,15,0.30)',
  dock: '0 20px 50px rgba(10,14,10,0.45)',
  book: '0 24px 40px rgba(30,25,15,0.35)',
  modal: '0 24px 64px rgba(20,18,12,0.5)',
  glowEmerald: '0 0 25px rgba(16,185,129,0.4)',
  glowAmber: 'none',
}

export const elevation = {
  card: { boxShadow: shadow.card },
  lift: { boxShadow: shadow.lift },
  glowEmerald: { boxShadow: shadow.glowEmerald },
  glowAmber: {},
  sheenTop: {},
}

// Glass panel
export const card = {
  background: C.card,
  backdropFilter: 'blur(24px) saturate(1.15)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
  border: `1px solid ${C.border}`,
  borderRadius: radius.xl,
  padding: '18px 20px',
  boxShadow: '0 20px 50px rgba(30,25,15,0.30), inset 0 1px 0 rgba(244,240,234,0.06)',
}

export const cardFlat = {
  ...card,
  borderRadius: radius.lg,
  padding: '14px 16px',
  boxShadow: '0 10px 28px rgba(30,25,15,0.22)',
}

export const cardAccent = card
export const cardTop = card

export const inputStyle = {
  width: '100%',
  padding: '9px 14px',
  minHeight: 36,
  borderRadius: radius.md,
  background: C.bgSoft,
  border: `1px solid ${C.border}`,
  color: C.text,
  fontSize: 13,
  fontFamily: fonts.body,
  fontVariantNumeric: 'tabular-nums',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s ease, background 0.15s ease',
}

// Primary action — emerald fill, deep botanical ink
export const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '9px 16px',
  borderRadius: radius.pill,
  border: '1px solid rgba(52,211,153,0.4)',
  background: C.fill,
  color: C.fillText,
  cursor: 'pointer',
  fontFamily: fonts.body,
  fontSize: 12.5, fontWeight: 700,
  letterSpacing: '-0.01em',
  boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 10px 24px rgba(16,185,129,0.35)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
}

// Amber-gold action — Exam Mode
export const btnAmber = {
  ...btnPrimary,
  background: 'linear-gradient(180deg, #F0B24A, #D97706)',
  color: '#2A1B04',
  border: '1px solid rgba(240, 200, 130, 0.5)',
  boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 10px 24px rgba(217,119,6,0.4)',
}

export const btnGhost = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '8px 14px',
  borderRadius: radius.pill,
  border: `1px solid ${C.border}`,
  background: 'rgba(20,32,27,0.4)',
  color: C.text,
  cursor: 'pointer',
  fontFamily: fonts.body,
  fontSize: 12.5, fontWeight: 600,
  transition: 'border-color 0.15s ease, background 0.15s ease',
}

export const btnAccent = (color) => ({
  ...btnGhost,
  color,
  border: `1px solid ${tint(color, 0.4)}`,
  background: tint(color, 0.08),
})

export const chip = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '3px 10px',
  borderRadius: radius.pill,
  background: tint(color, 0.12),
  border: `1px solid ${tint(color, 0.35)}`,
  color,
  fontFamily: fonts.mono,
  fontSize: 10, fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

export const statusDot = (kind = 'neutral', size = 6) => ({
  width: size, height: size,
  borderRadius: '50%',
  flexShrink: 0,
  background: kind === 'success' ? C.success
    : kind === 'warning' ? C.warning
    : kind === 'error' ? C.error
    : C.textFaint,
})

export const iconBox = (color, size = 36) => ({
  width: size, height: size,
  borderRadius: radius.md,
  flexShrink: 0,
  background: C.cardSoft,
  border: `1px solid ${C.border}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: C.text,
})
