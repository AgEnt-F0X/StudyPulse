// StudyPulse Workbench Design System — OBSIDIAN
// Matte surfaces + hairline grid + monochrome actions. Semantic status
// lives in 6px dots only. No gradients on surfaces. No glass. No glow.

export const C = {
  // Surfaces (CSS var refs with obsidian fallbacks)
  bg: 'var(--bg-primary, #09090B)',
  bgSoft: 'var(--surface-low, #0C0C0E)',
  card: 'var(--bg-card, #121215)',
  cardGlass: 'var(--bg-card, #121215)',
  cardSoft: 'var(--surface-card-soft, #18181C)',
  cardHover: 'var(--surface-card-hover, #18181C)',
  border: 'var(--border-color, #232329)',
  borderSoft: 'var(--border-soft, #1C1C21)',
  borderStrong: '#2E2E36',

  // Ink
  text: 'var(--text-primary, #FAFAFA)',
  textMuted: 'var(--text-secondary, #A1A1AA)',
  textFaint: 'var(--text-muted, #71717A)',

  // Action — monochrome. Primary fills are #EDEDED with #09090B ink.
  primary: 'var(--primary, #EDEDED)',
  primaryDeep: 'var(--primary-deep, #A1A1AA)',
  primaryGlow: 'var(--primary-glow, #FAFAFA)',
  fill: '#EDEDED',
  fillText: '#09090B',

  // Semantic status — the only chromatic ink in the system
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Legacy accents (remapped: blue→neutral, chromatics→semantic status)
  blue: '#EDEDED',
  blueDark: '#A1A1AA',
  green: '#10B981',
  greenDark: '#059669',
  amber: '#F59E0B',
  amberDeep: '#D97706',
  red: '#EF4444',
  orange: '#F59E0B',
  yellow: '#F59E0B',
  purple: '#A1A1AA',
  purpleDark: '#71717A',
  pink: '#EF4444',
}

// Flat solids — legacy gradient consumers resolve to matte fills
export const gradients = {
  logo: 'var(--grad-logo, #EDEDED)',
  primary: 'var(--grad-primary, #EDEDED)',
  reward: 'var(--grad-reward, #F59E0B)',
  hero: 'none',
}

// Translucent tint for subtle borders / hovers (neutral by default)
export const tint = (hex, a = 0.12) => {
  if (!hex || typeof hex !== 'string') return `rgba(255,255,255,${a})`
  let targetHex = hex
  if (targetHex.startsWith('var(')) {
    const match = targetHex.match(/#[0-9a-fA-F]{3,6}/)
    if (match) {
      targetHex = match[0]
    } else if (targetHex.includes('amber') || targetHex.includes('orange') || targetHex.includes('yellow')) {
      targetHex = '#F59E0B'
    } else if (targetHex.includes('red') || targetHex.includes('pink') || targetHex.includes('error')) {
      targetHex = '#EF4444'
    } else if (targetHex.includes('green') || targetHex.includes('success')) {
      targetHex = '#10B981'
    } else {
      targetHex = '#FFFFFF'
    }
  }
  const cleanHex = targetHex.startsWith('#') ? targetHex.slice(1) : targetHex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return `rgba(${r},${g},${b},${a})`
  }
  const n = parseInt(cleanHex, 16)
  if (isNaN(n)) return `rgba(255,255,255,${a})`
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgba(${r},${g},${b},${a})`
}

export const fonts = {
  heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace",
}

export const radius = { sm: 3, md: 4, lg: 6, xl: 6, xxl: 8, pill: 999 }

export const shadow = {
  card: '0 1px 2px rgba(0,0,0,0.5)',
  lift: '0 8px 24px rgba(0,0,0,0.5)',
  modal: '0 16px 48px rgba(0,0,0,0.7)',
  glowEmerald: 'none',
  glowAmber: 'none',
}

export const elevation = {
  card: { boxShadow: shadow.card },
  lift: { boxShadow: shadow.lift },
  glowEmerald: {},
  glowAmber: {},
  sheenTop: {},
}

// ---- Reusable style objects ----
// Flat panels, hairline borders, hover = surface fill change only.

export const card = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: radius.lg,
  padding: '16px 18px',
}

export const cardFlat = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: radius.lg,
  padding: '14px 16px',
}

// Hairline accent panel — a bordered cell, not a decorated card
export const cardAccent = (color) => ({
  ...card,
  borderTop: `1px solid ${C.border}`,
})

export const cardTop = cardAccent

export const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  minHeight: 34,
  borderRadius: radius.lg,
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

// Primary action — high-contrast monochrome fill
export const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '8px 14px',
  borderRadius: radius.lg,
  border: 'none',
  background: C.fill,
  color: C.fillText,
  cursor: 'pointer',
  fontFamily: fonts.body,
  fontSize: 12.5, fontWeight: 600,
  letterSpacing: '-0.01em',
  transition: 'background 0.13s ease, opacity 0.13s ease',
}

// Reward / warning action — solid semantic fill, no gradient
export const btnAmber = {
  ...btnPrimary,
  background: C.warning,
  color: '#09090B',
}

export const btnGhost = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '7px 12px',
  borderRadius: radius.lg,
  border: `1px solid ${C.border}`,
  background: 'transparent',
  color: C.text,
  cursor: 'pointer',
  fontFamily: fonts.body,
  fontSize: 12.5, fontWeight: 500,
  transition: 'border-color 0.13s ease, background 0.13s ease, color 0.13s ease',
}

export const btnAccent = (color) => ({
  ...btnGhost,
  color,
  border: `1px solid ${tint(color, 0.4)}`,
  background: tint(color, 0.08),
})

// Tag chip — mono, uppercase, hairline
export const chip = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '2px 7px',
  borderRadius: radius.sm,
  background: tint(color, 0.10),
  border: `1px solid ${tint(color, 0.28)}`,
  color,
  fontFamily: fonts.mono,
  fontSize: 10, fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
})

// Semantic status dot — the sole chromatic indicator in the system
export const statusDot = (kind = 'neutral', size = 6) => ({
  width: size, height: size,
  borderRadius: '50%',
  flexShrink: 0,
  background: kind === 'success' ? C.success
    : kind === 'warning' ? C.warning
    : kind === 'error' ? C.error
    : C.textFaint,
})

// Optical icon frame — kept for compatibility, restyled hairline/neutral
export const iconBox = (color, size = 36) => ({
  width: size, height: size,
  borderRadius: radius.lg,
  flexShrink: 0,
  background: C.cardSoft,
  border: `1px solid ${C.border}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: C.text,
})
