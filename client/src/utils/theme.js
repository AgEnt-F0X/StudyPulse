// StudyPulse — Material You (MD3) theme engine.
// Tonal tokens (--md-*) are generated per palette × colorMode × uiStyle and
// injected onto :root. The legacy `C` export bridges every existing page to
// the engine, so the whole app re-themes live. ZERO GREEN anywhere.

// ── Curated non-green palettes ────────────────────────────────

export const MD3_PALETTES = {
  'iris-indigo': {
    label: 'Iris Indigo',
    swatch: '#818CF8',
    dark: {
      bg: '#0B0C14', surfaceLow: '#121422', surface: '#181B2E', surfaceHigh: '#21253E',
      primary: '#818CF8', onPrimary: '#1E1B4B', primaryContainer: '#2E2B73', onPrimaryContainer: '#E0E7FF',
      secondary: '#C084FC', outline: 'rgba(129, 140, 248, 0.18)',
      text: '#ECECF6', textMuted: '#A6A8C4', textFaint: '#6F7294',
    },
    light: {
      bg: '#F6F7FF', surfaceLow: '#EFEFFD', surface: '#E6E7FA', surfaceHigh: '#D9DBF5',
      primary: '#4F46E5', onPrimary: '#FFFFFF', primaryContainer: '#E0E7FF', onPrimaryContainer: '#1E1B4B',
      secondary: '#7C3AED', outline: 'rgba(79, 70, 229, 0.16)',
      text: '#191A2E', textMuted: '#4D4F70', textFaint: '#6F7294',
    },
  },
  'ocean-sapphire': {
    label: 'Ocean Sapphire',
    swatch: '#60A5FA',
    dark: {
      bg: '#090E17', surfaceLow: '#101827', surface: '#162033', surfaceHigh: '#1E2B44',
      primary: '#60A5FA', onPrimary: '#0B1B36', primaryContainer: '#172E5C', onPrimaryContainer: '#DBEAFE',
      secondary: '#38BDF8', outline: 'rgba(96, 165, 250, 0.18)',
      text: '#E8F0FB', textMuted: '#9DB2CE', textFaint: '#647999',
    },
    light: {
      bg: '#F5F9FF', surfaceLow: '#EBF3FF', surface: '#E1EEFF', surfaceHigh: '#D2E4FF',
      primary: '#2563EB', onPrimary: '#FFFFFF', primaryContainer: '#DBEAFE', onPrimaryContainer: '#0B1B36',
      secondary: '#0284C7', outline: 'rgba(37, 99, 235, 0.16)',
      text: '#0C1A2E', textMuted: '#44608C', textFaint: '#647999',
    },
  },
  'amethyst-violet': {
    label: 'Amethyst Violet',
    swatch: '#C084FC',
    dark: {
      bg: '#0E0A17', surfaceLow: '#171126', surface: '#1F1733', surfaceHigh: '#2B2046',
      primary: '#C084FC', onPrimary: '#2A1244', primaryContainer: '#3B1D64', onPrimaryContainer: '#F3E8FF',
      secondary: '#A78BFA', outline: 'rgba(192, 132, 252, 0.18)',
      text: '#F1EAFB', textMuted: '#B3A3CE', textFaint: '#7D6E99',
    },
    light: {
      bg: '#FAF5FF', surfaceLow: '#F3EBFF', surface: '#EDE0FF', surfaceHigh: '#E3D2FF',
      primary: '#7C3AED', onPrimary: '#FFFFFF', primaryContainer: '#F3E8FF', onPrimaryContainer: '#2A1244',
      secondary: '#8B5CF6', outline: 'rgba(124, 58, 237, 0.16)',
      text: '#1E1230', textMuted: '#5D4B7E', textFaint: '#7D6E99',
    },
  },
  'sunset-coral': {
    label: 'Sunset Coral',
    swatch: '#FB923C',
    dark: {
      bg: '#140C09', surfaceLow: '#21140F', surface: '#2C1B14', surfaceHigh: '#3B241B',
      primary: '#FB923C', onPrimary: '#2A1204', primaryContainer: '#5C2810', onPrimaryContainer: '#FFEDD5',
      secondary: '#FBBF24', outline: 'rgba(251, 146, 60, 0.18)',
      text: '#FCF0E6', textMuted: '#C9A98F', textFaint: '#94765F',
    },
    light: {
      bg: '#FFF7F2', surfaceLow: '#FFF0E6', surface: '#FFE4D4', surfaceHigh: '#FFD9BF',
      primary: '#EA580C', onPrimary: '#FFFFFF', primaryContainer: '#FFEDD5', onPrimaryContainer: '#2A1204',
      secondary: '#D97706', outline: 'rgba(234, 88, 12, 0.16)',
      text: '#251209', textMuted: '#7E5433', textFaint: '#94765F',
    },
  },
  'crimson-sakura': {
    label: 'Crimson Sakura',
    swatch: '#FB7185',
    dark: {
      bg: '#14090D', surfaceLow: '#221017', surface: '#2E161F', surfaceHigh: '#3D1D29',
      primary: '#FB7185', onPrimary: '#2C0710', primaryContainer: '#5E1728', onPrimaryContainer: '#FFE4E6',
      secondary: '#F9A8D4', outline: 'rgba(251, 113, 133, 0.18)',
      text: '#FBEAEE', textMuted: '#CBA0AB', textFaint: '#976673',
    },
    light: {
      bg: '#FFF5F7', surfaceLow: '#FFEBEF', surface: '#FFDCE2', surfaceHigh: '#FFCFD8',
      primary: '#E11D48', onPrimary: '#FFFFFF', primaryContainer: '#FFE4E6', onPrimaryContainer: '#2C0710',
      secondary: '#DB2777', outline: 'rgba(225, 29, 72, 0.16)',
      text: '#230910', textMuted: '#7C4351', textFaint: '#976673',
    },
  },
  'monochrome-obsidian': {
    label: 'Monochrome Obsidian',
    swatch: '#F8FAFC',
    dark: {
      bg: '#09090B', surfaceLow: '#121215', surface: '#18181C', surfaceHigh: '#222228',
      primary: '#F8FAFC', onPrimary: '#09090B', primaryContainer: '#27272A', onPrimaryContainer: '#FAFAFA',
      secondary: '#A1A1AA', outline: 'rgba(248, 250, 252, 0.14)',
      text: '#F4F4F6', textMuted: '#A8A9B0', textFaint: '#71717C',
    },
    light: {
      bg: '#FAFAFA', surfaceLow: '#F1F2F4', surface: '#E8E9ED', surfaceHigh: '#DCDEE3',
      primary: '#0F172A', onPrimary: '#FFFFFF', primaryContainer: '#E2E8F0', onPrimaryContainer: '#0F172A',
      secondary: '#475569', outline: 'rgba(15, 23, 42, 0.16)',
      text: '#0D0E12', textMuted: '#4A4C56', textFaint: '#71717C',
    },
  },
}

export const PALETTE_IDS = Object.keys(MD3_PALETTES)
export const DEFAULT_PREFS = {
  uiStyle: 'material-you',     // 'material-you' | 'spatial-3d'
  colorMode: 'dark',           // 'dark' | 'light' | 'amoled'
  paletteId: 'iris-indigo',
  seedHex: '#818CF8',          // used when paletteId === 'custom'
}

// ── Custom seed → MD3 tonal tokens (Material You dynamic color) ──

function hexToHsl(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let hue = 0
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    if (max === r) hue = 60 * (((g - b) / d) % 6)
    else if (max === g) hue = 60 * ((b - r) / d + 2)
    else hue = 60 * ((r - g) / d + 4)
  }
  if (hue < 0) hue += 360
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) }
}

const clampL = (v) => Math.max(2, Math.min(97, v))

function generateCustomPalette(seedHex, colorMode) {
  const { h, s } = hexToHsl(seedHex || '#818CF8')
  const sat = Math.max(28, Math.min(85, s || 60))
  const hsl = (l, ss = sat, hh = h) => `hsl(${Math.round(hh)}, ${Math.round(ss)}%, ${Math.round(clampL(l))}%)`
  const hsla = (l, a, ss = sat, hh = h) => `hsla(${Math.round(hh)}, ${Math.round(ss)}%, ${Math.round(clampL(l))}%, ${a})`

  if (colorMode === 'light') {
    return {
      bg: hsl(97, sat * 0.35), surfaceLow: hsl(93.5), surface: hsl(90), surfaceHigh: hsl(85),
      primary: hsl(44), onPrimary: '#FFFFFF', primaryContainer: hsl(91, sat * 0.75), onPrimaryContainer: hsl(18),
      secondary: hsl(40, sat * 0.6), outline: hsla(44, 0.16),
      text: hsl(12, sat * 0.25), textMuted: hsl(30, sat * 0.3), textFaint: hsl(42, sat * 0.28),
    }
  }
  return {
    bg: hsl(5, sat * 0.3), surfaceLow: hsl(8.5), surface: hsl(11.5), surfaceHigh: hsl(16),
    primary: hsl(70), onPrimary: hsl(12), primaryContainer: hsl(21, sat * 0.6), onPrimaryContainer: hsl(88, sat * 0.45),
    secondary: hsl(68, sat * 0.55, (h + 30) % 360), outline: hsla(70, 0.18),
    text: hsl(95, sat * 0.18), textMuted: hsl(66, sat * 0.22), textFaint: hsl(50, sat * 0.2),
  }
}

// AMOLED — pure #000 pitch-black surfaces, palette accents preserved
function amoledify(t) {
  return { ...t, bg: '#000000', surfaceLow: '#0B0B0E', surface: '#101014', surfaceHigh: '#1B1B22' }
}

// ── Theme preference state ────────────────────────────────────

export const THEME_PREFS_KEY = 'studypulse-theme-prefs'

export function getThemePrefs() {
  try {
    const raw = localStorage.getItem(THEME_PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_PREFS, ...parsed }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

// Resolve the tonal token set for the current prefs
function resolveTokens(prefs) {
  const { colorMode, paletteId, seedHex } = prefs
  let t
  if (paletteId === 'custom') {
    t = generateCustomPalette(seedHex, colorMode === 'light' ? 'light' : 'dark')
    if (colorMode === 'amoled') t = amoledify(t)
  } else {
    const pal = MD3_PALETTES[paletteId] || MD3_PALETTES['iris-indigo']
    t = colorMode === 'light' ? pal.light : pal.dark
    if (colorMode === 'amoled') t = amoledify(t)
  }
  return t
}

// Apply --md-* tokens + uiStyle meta to :root. Safe to call anytime.
export function applyTheme(prefs = getThemePrefs()) {
  if (typeof document === 'undefined') return
  const { uiStyle, colorMode } = prefs
  const t = resolveTokens(prefs)
  const root = document.documentElement

  const vars = {
    '--md-bg': t.bg,
    '--md-surface-low': t.surfaceLow,
    '--md-surface': t.surface,
    '--md-surface-high': t.surfaceHigh,
    '--md-primary': t.primary,
    '--md-on-primary': t.onPrimary,
    '--md-primary-container': t.primaryContainer,
    '--md-on-primary-container': t.onPrimaryContainer,
    '--md-secondary': t.secondary,
    '--md-outline': t.outline,
    '--md-text': t.text,
    '--md-text-muted': t.textMuted,
    '--md-text-faint': t.textFaint,
    '--md-error': '#EF4444',
    '--md-warning': '#F59E0B',
    // uiStyle expressiveness
    '--md-radius': uiStyle === 'material-you' ? '28px' : '16px',
    '--md-radius-sm': uiStyle === 'material-you' ? '18px' : '10px',
    '--md-shadow-card': uiStyle === 'material-you'
      ? '0 2px 14px rgba(0,0,0,0.28)'
      : '0 12px 32px rgba(0,0,0,0.4)',
    '--md-shadow-lift': uiStyle === 'material-you'
      ? '0 6px 24px rgba(0,0,0,0.32)'
      : '0 20px 50px rgba(0,0,0,0.5)',
    '--md-glow-primary': '0 0 25px color-mix(in srgb, var(--md-primary) 40%, transparent)',
  }
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)

  root.dataset.uiStyle = uiStyle
  root.dataset.colorMode = colorMode
  return t
}

export function setThemePrefs(partial) {
  const next = { ...getThemePrefs(), ...partial }
  try { localStorage.setItem(THEME_PREFS_KEY, JSON.stringify(next)) } catch {}
  applyTheme(next)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('studypulse-theme-change', { detail: next }))
  }
  return next
}

// Apply persisted theme at module load
applyTheme(getThemePrefs())

// ── Legacy token bridge — every existing page re-themes live ──

export const C = {
  // Surfaces
  bg: 'var(--md-bg)',
  bgHi: 'var(--md-surface)',
  bgSoft: 'var(--md-surface-low)',
  card: 'var(--md-surface)',
  cardGlass: 'var(--md-surface)',
  cardSoft: 'color-mix(in srgb, var(--md-primary) 7%, transparent)',
  cardHover: 'var(--md-surface-high)',
  active: 'var(--md-surface-high)',
  glassRaised: 'var(--md-surface-high)',

  // Rims
  border: 'var(--md-outline)',
  borderSoft: 'color-mix(in srgb, var(--md-primary) 9%, transparent)',
  borderStrong: 'color-mix(in srgb, var(--md-primary) 38%, transparent)',
  gold: '#D4C3A3',

  // Ink
  text: 'var(--md-text)',
  textMuted: 'var(--md-text-muted)',
  textFaint: 'var(--md-text-faint)',
  ink: '#232019',

  // Action — tonal, zero green
  primary: 'var(--md-primary)',
  primaryDeep: 'var(--md-secondary)',
  primaryGlow: 'var(--md-primary)',
  primaryBright: 'var(--md-primary)',
  fill: 'var(--md-primary)',
  fillText: 'var(--md-on-primary)',

  // Status
  success: 'var(--md-primary)',
  warning: '#F59E0B',
  error: '#EF4444',

  // Legacy accents remapped to the tonal engine
  blue: 'var(--md-primary)',
  blueDark: 'var(--md-secondary)',
  green: 'var(--md-primary)',
  greenDark: 'var(--md-secondary)',
  amber: '#F59E0B',
  amberDeep: '#D97706',
  red: '#EF4444',
  orange: '#F59E0B',
  yellow: '#F59E0B',
  purple: 'var(--md-secondary)',
  purpleDark: 'var(--md-secondary)',
  pink: '#EF4444',

  // Paper
  paper: '#FAF7F2',
  paperHi: '#FBF8F3',
}

// Solid fills for legacy gradient consumers
export const gradients = {
  logo: 'var(--md-primary)',
  primary: 'var(--md-primary)',
  reward: '#F59E0B',
  hero: 'none',
}

export const tint = (hex, a = 0.12) => {
  if (!hex || typeof hex !== 'string') return `color-mix(in srgb, var(--md-primary) ${Math.round(a * 100)}%, transparent)`
  if (hex.startsWith('var(') || hex.startsWith('hsl(')) {
    return `color-mix(in srgb, ${hex} ${Math.round(a * 100)}%, transparent)`
  }
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return `rgba(${r},${g},${b},${a})`
  }
  const n = parseInt(cleanHex, 16)
  if (isNaN(n)) return `color-mix(in srgb, var(--md-primary) ${Math.round(a * 100)}%, transparent)`
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgba(${r},${g},${b},${a})`
}

export const fonts = {
  heading: "'Instrument Serif', Georgia, serif",
  body: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace",
  hand: "'Caveat', 'Segoe Print', cursive",
}

export const radius = { sm: 8, md: 12, lg: 18, xl: 'var(--md-radius)', xxl: 'var(--md-radius)', pill: 999 }

export const shadow = {
  card: 'var(--md-shadow-card)',
  lift: 'var(--md-shadow-lift)',
  dock: '0 10px 30px rgba(0,0,0,0.35)',
  book: '0 24px 40px rgba(0,0,0,0.45)',
  modal: '0 24px 64px rgba(0,0,0,0.55)',
  glowEmerald: 'var(--md-glow-primary)',
  glowAmber: 'none',
}

export const elevation = {
  card: { boxShadow: shadow.card },
  lift: { boxShadow: shadow.lift },
  glowEmerald: { boxShadow: shadow.glowEmerald },
  glowAmber: {},
  sheenTop: {},
}

// MD3 card — squircle radius from the live engine, no backdrop blur
export const card = {
  background: 'var(--md-surface)',
  border: '1px solid var(--md-outline)',
  borderRadius: 'var(--md-radius)',
  padding: '18px 20px',
  boxShadow: 'var(--md-shadow-card)',
  contain: 'layout style paint',
  transform: 'translateZ(0)',
}

export const cardFlat = {
  ...card,
  borderRadius: 'var(--md-radius-sm)',
  padding: '14px 16px',
  boxShadow: 'none',
}

export const cardAccent = card
export const cardTop = card

export const inputStyle = {
  width: '100%',
  padding: '9px 14px',
  minHeight: 38,
  borderRadius: 14,
  background: 'var(--md-surface-low)',
  border: '1px solid var(--md-outline)',
  color: 'var(--md-text)',
  fontSize: 13,
  fontFamily: fonts.body,
  fontVariantNumeric: 'tabular-nums',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.18s cubic-bezier(0.22,1,0.36,1), background 0.18s ease',
}

// MD3 filled primary button
export const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '10px 20px',
  borderRadius: 999,
  border: 'none',
  background: 'var(--md-primary)',
  color: 'var(--md-on-primary)',
  cursor: 'pointer',
  fontFamily: fonts.body,
  fontSize: 13, fontWeight: 700,
  letterSpacing: '-0.01em',
  boxShadow: 'var(--md-shadow-card)',
  transition: 'transform 180ms cubic-bezier(0.22,1,0.36,1), box-shadow 180ms ease, filter 180ms ease',
}

// Warm amber accent (allowed — not green)
export const btnAmber = {
  ...btnPrimary,
  background: 'linear-gradient(180deg, #F0B24A, #D97706)',
  color: '#2A1B04',
  boxShadow: '0 4px 14px rgba(217,119,6,0.35)',
}

export const btnGhost = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '9px 16px',
  borderRadius: 999,
  border: '1px solid var(--md-outline)',
  background: 'var(--md-surface-low)',
  color: 'var(--md-text)',
  cursor: 'pointer',
  fontFamily: fonts.body,
  fontSize: 12.5, fontWeight: 600,
  transition: 'transform 180ms cubic-bezier(0.22,1,0.36,1), border-color 180ms ease',
}

export const btnAccent = (color) => ({
  ...btnGhost,
  color,
  border: `1px solid ${tint(color, 0.4)}`,
  background: tint(color, 0.08),
})

// Tonal chip — primary-container when given a token color
export const chip = (color) => {
  if (!color || typeof color !== 'string' || color.startsWith('var(') || color.startsWith('hsl(')) {
    return {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px',
      borderRadius: 999,
      background: 'var(--md-primary-container)',
      color: 'var(--md-on-primary-container)',
      fontFamily: fonts.mono,
      fontSize: 10, fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    }
  }
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 10px',
    borderRadius: 999,
    background: tint(color, 0.12),
    border: `1px solid ${tint(color, 0.35)}`,
    color,
    fontFamily: fonts.mono,
    fontSize: 10, fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  }
}

export const statusDot = (kind = 'neutral', size = 6) => ({
  width: size, height: size,
  borderRadius: '50%',
  flexShrink: 0,
  background: kind === 'success' ? 'var(--md-primary)'
    : kind === 'warning' ? '#F59E0B'
    : kind === 'error' ? '#EF4444'
    : 'var(--md-text-faint)',
})

export const iconBox = (color, size = 36) => ({
  width: size, height: size,
  borderRadius: 14,
  flexShrink: 0,
  background: 'var(--md-surface-low)',
  border: '1px solid var(--md-outline)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--md-primary)',
})
