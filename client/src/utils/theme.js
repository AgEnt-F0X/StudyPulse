// StudyPulse Botanical Scholar Design System — LOCKED
// Pine base + Emerald action + Brass reward. Flat reading surfaces,
// gradients only on 4 brand moments (logo/CTA/hero/reward).

export const C = {
  // Surfaces (CSS var refs with fallbacks)
  bg: 'var(--bg-primary, #0a120e)',
  bgSoft: 'var(--surface-low, #0d1712)',
  card: 'var(--bg-card, #101c17)',
  cardGlass: 'var(--bg-card-glass, rgba(16, 28, 22, 0.75))',
  cardSoft: 'var(--surface-card-soft, #14231c)',
  cardHover: 'var(--surface-card-hover, #182b22)',
  border: 'var(--border-color, rgba(52, 211, 153, 0.14))',
  borderSoft: 'var(--border-soft, rgba(52, 211, 153, 0.10))',

  // Ink
  text: 'var(--text-primary, #f0fdf4)',
  textMuted: 'var(--text-secondary, #a7c4b5)',
  textFaint: 'var(--text-muted, #769989)',

  // Action — Emerald Sage (go / progress / correct)
  primary: 'var(--primary, #10b981)',
  primaryDeep: 'var(--primary-deep, #059669)',
  primaryGlow: 'var(--primary-glow, #34d399)',
  green: '#34d399',
  greenDark: '#10b981',

  // Reward — Warm Brass (streak / XP / AI magic only)
  amber: 'var(--accent-amber, #f59e0b)',
  amberDeep: 'var(--accent-amber-deep, #d97706)',

  // Legacy accents (remapped to botanical scale for consistency —
  // C.blue now resolves emerald so ~100 secondary-page usages follow the theme)
  blue: '#34d399',
  blueDark: '#10b981',
  purple: '#c084fc',
  purpleDark: '#a855f7',
  pink: '#f472b6',
  orange: '#fb923c',
  yellow: '#facc15',
  red: '#f87171',
}

// 4 brand gradients ONLY — never on reading surfaces
export const gradients = {
  logo: 'var(--grad-logo, linear-gradient(135deg, #10b981, #059669))',
  primary: 'var(--grad-primary, linear-gradient(135deg, #34d399, #10b981))',
  reward: 'var(--grad-reward, linear-gradient(135deg, #fbbf24, #d97706))',
  hero: 'var(--grad-hero)',
}

// Translucent tint for subtle accent badges / borders
export const tint = (hex, a = 0.12) => {
  if (!hex || typeof hex !== 'string') return `rgba(16,185,129,${a})`
  let targetHex = hex
  if (targetHex.startsWith('var(')) {
    const match = targetHex.match(/#[0-9a-fA-F]{3,6}/)
    if (match) {
      targetHex = match[0]
    } else if (targetHex.includes('primary') || targetHex.includes('blue') || targetHex.includes('green')) {
      targetHex = '#10b981'
    } else if (targetHex.includes('amber') || targetHex.includes('orange')) {
      targetHex = '#f59e0b'
    } else if (targetHex.includes('purple')) {
      targetHex = '#c084fc'
    } else if (targetHex.includes('pink') || targetHex.includes('red')) {
      targetHex = '#f472b6'
    } else {
      targetHex = '#10b981'
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
  if (isNaN(n)) return `rgba(16,185,129,${a})`
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgba(${r},${g},${b},${a})`
}

export const fonts = {
  heading: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

export const radius = { sm: 4, md: 6, lg: 8, xl: 12, xxl: 16, pill: 999 }

export const shadow = {
  card: 'var(--shadow-card, 0 1px 3px rgba(0,0,0,0.4))',
  lift: 'var(--shadow-lift, 0 8px 24px rgba(0,0,0,0.45))',
  modal: '0 24px 64px rgba(0,0,0,0.7)',
  glowEmerald: 'var(--shadow-glow-emerald, 0 4px 20px rgba(0,0,0,0.4))',
  glowAmber: 'var(--shadow-glow-amber, 0 4px 20px rgba(0,0,0,0.4))',
}

export const elevation = {
  card: {
    boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0,0,0,0.4))',
  },
  lift: {
    boxShadow: 'var(--shadow-lift, 0 8px 24px rgba(0,0,0,0.45))',
  },
  glowEmerald: {
    boxShadow: 'var(--shadow-glow-emerald, 0 4px 20px rgba(0,0,0,0.4))',
  },
  glowAmber: {
    boxShadow: 'var(--shadow-glow-amber, 0 4px 20px rgba(0,0,0,0.4))',
  },
  sheenTop: {
    boxShadow: 'var(--sheen-top, inset 0 1px 0 rgba(255,255,255,0.08))',
  },
}

// ---- Reusable style objects ----
// Flat surfaces, hairline botanical borders, top-edge sheen (no left bars).

export const card = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: radius.xxl,
  padding: '20px 22px',
  boxShadow: `${shadow.card}, inset 0 1px 0 rgba(255,255,255,0.08)`,
}

export const cardFlat = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: radius.xl,
  padding: '16px 18px',
}

// DEPRECATED: left-border accent (AI-slop). Use cardTop instead.
export const cardAccent = (color) => ({
  ...card,
  borderTop: `2px solid ${color}`,
})

// Botanical accent: top-edge rule, not left bar
export const cardTop = (color) => ({
  ...card,
  borderTop: `2px solid ${color}`,
})

export const inputStyle = {
  width: '100%',
  padding: '9px 14px',
  minHeight: 36,
  borderRadius: radius.lg,
  background: C.bgSoft,
  border: `1px solid ${C.border}`,
  color: C.text,
  fontSize: 14,
  fontFamily: fonts.body,
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}

export const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '10px 18px',
  borderRadius: radius.lg,
  border: 'none',
  background: 'var(--grad-primary, linear-gradient(135deg, #34d399, #10b981))',
  color: '#04120c',
  cursor: 'pointer',
  fontFamily: fonts.heading,
  fontSize: 13.5, fontWeight: 700,
  letterSpacing: '0.01em',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(16,185,129,0.22)',
  transition: 'transform 0.12s ease, filter 0.12s ease, opacity 0.12s ease',
}

export const btnAmber = {
  ...btnPrimary,
  background: 'var(--grad-reward, linear-gradient(135deg, #fbbf24, #d97706))',
  color: '#1a1005',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(245,158,11,0.22)',
}

export const btnGhost = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '9px 16px',
  borderRadius: radius.lg,
  border: `1px solid ${C.border}`,
  background: 'transparent',
  color: C.text,
  cursor: 'pointer',
  fontFamily: fonts.heading,
  fontSize: 13, fontWeight: 600,
  transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
}

export const btnAccent = (color) => ({
  ...btnGhost,
  color,
  border: `1px solid ${tint(color, 0.4)}`,
  background: tint(color, 0.08),
})

// Tag chip — sentence case, botanical border
export const chip = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '3px 8px',
  borderRadius: radius.sm,
  background: tint(color, 0.12),
  border: `1px solid ${tint(color, 0.28)}`,
  color,
  fontFamily: fonts.body,
  fontSize: 11, fontWeight: 700,
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
})

// Optical icon frame — 32/40px squircle, 10% tint
export const iconBox = (color, size = 36) => ({
  width: size, height: size,
  borderRadius: radius.lg,
  flexShrink: 0,
  background: tint(color, 0.10),
  border: `1px solid ${tint(color, 0.25)}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color,
})
