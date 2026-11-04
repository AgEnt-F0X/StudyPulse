import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Palette, Gear, Notebook, Sparkle, CaretDown, Check } from '@phosphor-icons/react'
import CommandPalette from './CommandPalette'
import ToastContainer from './ToastContainer'
import DemoTour from './DemoTour'
import AIChat from './AIChat'
import { useUIStore, useAuthStore, usePomodoroStore } from '../stores'
import { fonts, getThemePrefs, setThemePrefs, MD3_PALETTES, PALETTE_IDS } from '../utils/theme'

// ── ECG waveform mark — tinted with the live palette ──────────
const EcgMark = () => (
  <svg width="30" height="18" viewBox="0 0 30 18" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M1 9 H8 L11 3 L14 15 L17 6 L19 9 H29"
      stroke="var(--md-primary)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ecg-trace"
      style={{ filter: 'drop-shadow(0 0 5px var(--md-glow-primary))' }}
    />
  </svg>
)

// ── Palette / Material You quick switcher popover ─────────────

function PalettePopover({ onClose }) {
  const [prefs, setPrefs] = useState(() => getThemePrefs())
  useEffect(() => {
    const sync = () => setPrefs(getThemePrefs())
    window.addEventListener('studypulse-theme-change', sync)
    return () => window.removeEventListener('studypulse-theme-change', sync)
  }, [])

  const update = (partial) => setThemePrefs(partial)

  const Seg = ({ options, value, onChange }) => (
    <div style={{
      display: 'flex', gap: 2, padding: 2, borderRadius: 999,
      background: 'var(--md-surface-low)', border: '1px solid var(--md-outline)',
    }}>
      {options.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="motion-spring"
          style={{
            flex: 1, padding: '5px 0', borderRadius: 999, border: 'none',
            background: value === id ? 'var(--md-primary)' : 'transparent',
            color: value === id ? 'var(--md-on-primary)' : 'var(--md-text-muted)',
            cursor: 'pointer', fontFamily: fonts.body, fontSize: 11, fontWeight: value === id ? 700 : 500,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 66, right: 14, zIndex: 151,
        width: 280,
        background: 'var(--md-surface)',
        border: '1px solid var(--md-outline)',
        borderRadius: 'var(--md-radius-sm)',
        boxShadow: 'var(--md-shadow-lift)',
        padding: 14,
        animation: 'studypulseFadeUp 0.18s cubic-bezier(0.22,1,0.36,1) both',
        maxHeight: 'calc(100vh - 90px)', overflowY: 'auto',
      }}>
        <span className="metric-label" style={{ padding: 0, display: 'block', marginBottom: 6 }}>
          Design language
        </span>
        <Seg options={[['material-you', 'Material You'], ['spatial-3d', 'Spatial 3D']]} value={prefs.uiStyle} onChange={(v) => update({ uiStyle: v })} />

        <span className="metric-label" style={{ padding: 0, display: 'block', margin: '12px 0 6px' }}>
          Surface mode
        </span>
        <Seg options={[['dark', 'Dark'], ['light', 'Light'], ['amoled', 'AMOLED']]} value={prefs.colorMode} onChange={(v) => update({ colorMode: v })} />

        <span className="metric-label" style={{ padding: 0, display: 'block', margin: '12px 0 6px' }}>
          Palette
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          {PALETTE_IDS.map((id) => {
            const pal = MD3_PALETTES[id]
            const active = prefs.paletteId === id
            return (
              <button
                key={id}
                onClick={() => update({ paletteId: id })}
                className="motion-spring"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 12,
                  background: active ? 'var(--md-primary-container)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 8, flexShrink: 0,
                  background: `linear-gradient(135deg, ${pal.swatch}, ${pal.dark.primary})`,
                  border: '1px solid var(--md-outline)',
                }} />
                <span style={{
                  flex: 1, fontFamily: fonts.body, fontSize: 12.5, fontWeight: active ? 700 : 500,
                  color: active ? 'var(--md-on-primary-container)' : 'var(--md-text)',
                }}>
                  {pal.label}
                </span>
                {active && <Check size={13} weight="bold" style={{ color: 'var(--md-on-primary-container)' }} />}
              </button>
            )
          })}
          {/* Custom seed */}
          <button
            onClick={() => update({ paletteId: 'custom', seedHex: prefs.seedHex })}
            className="motion-spring"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px', borderRadius: 12,
              background: prefs.paletteId === 'custom' ? 'var(--md-primary-container)' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 8, flexShrink: 0,
              background: prefs.seedHex, border: '1px solid var(--md-outline)',
            }} />
            <span style={{
              flex: 1, fontFamily: fonts.body, fontSize: 12.5, fontWeight: prefs.paletteId === 'custom' ? 700 : 500,
              color: prefs.paletteId === 'custom' ? 'var(--md-on-primary-container)' : 'var(--md-text)',
            }}>
              Custom seed
            </span>
            <input
              type="color"
              value={prefs.seedHex}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => update({ paletteId: 'custom', seedHex: e.target.value })}
              style={{ width: 26, height: 26, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
              title="Material You seed color"
            />
          </button>
        </div>
      </div>
    </>
  )
}

const NAV_ITEMS = [
  { label: 'Today', path: '/home' },
  { label: 'Library & 3D Labs', path: '/library' },
  { label: 'SQL 3D Arena', path: '/sql' },
  { label: 'Exam Plan', path: '/study-plans' },
]

const Layout = () => {
  const { aiChatOpen, toggleAIChat } = useUIStore()
  const { isDemo, exitDemoMode, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { isRunning, isBreak, secondsLeft } = usePomodoroStore()

  const [paletteOpen, setPaletteOpen] = useState(false)

  // Ctrl+Enter — execute AI query globally
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!aiChatOpen) {
          toggleAIChat()
          setTimeout(() => window.dispatchEvent(new CustomEvent('studypulse-ai-focus')), 120)
        } else {
          window.dispatchEvent(new CustomEvent('studypulse-ai-send'))
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [aiChatOpen, toggleAIChat])

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const timerStatus = !isRunning ? 'neutral' : isBreak ? 'warning' : 'success'
  const userName = user?.name?.split(' ')[0] || 'Student'
  const userInitial = userName[0]?.toUpperCase() || 'S'

  const navPill = ({ isActive }) => ({
    display: 'inline-flex', alignItems: 'center',
    padding: '7px 14px', borderRadius: 999,
    fontFamily: fonts.body, fontSize: 12.5,
    fontWeight: isActive ? 700 : 500,
    whiteSpace: 'nowrap', flexShrink: 0,
    background: isActive ? 'var(--md-primary-container)' : 'transparent',
    color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-text-muted)',
    cursor: 'pointer',
    transition: 'background 0.2s cubic-bezier(0.22,1,0.36,1), color 0.2s ease',
  })

  return (
    <div
      className="w-screen hw"
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Material You top navigation bar — the only blur ── */}
      <header
        className="md-navbar hw"
        style={{ flexShrink: 0, width: '100%', position: 'relative', zIndex: 100 }}
      >
        <div className="w-full px-4 lg:px-8" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          height: 60,
        }}>
          {/* Brand */}
          <button
            onClick={() => navigate('/home')}
            style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <EcgMark />
            <span style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 19, letterSpacing: '-0.01em', color: 'var(--md-text)', whiteSpace: 'nowrap',
            }}>
              StudyPulse
            </span>
          </button>

          <span style={{ width: 1, height: 26, background: 'var(--md-outline)', flexShrink: 0, margin: '0 4px' }} />

          {/* Center — 5 clean destinations */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} style={navPill}>
                {item.label}
              </NavLink>
            ))}
            {/* Practice — Quiz & PYQs as one split pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', flexShrink: 0,
              borderRadius: 999, padding: 2,
              background: 'var(--md-surface-low)', border: '1px solid var(--md-outline)',
            }}>
              <NavLink to="/quiz" style={({ isActive }) => ({
                padding: '5px 12px', borderRadius: 999,
                fontFamily: fonts.body, fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? 'var(--md-primary-container)' : 'transparent',
                color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-text-muted)',
                textDecoration: 'none', cursor: 'pointer',
                transition: 'background 0.2s cubic-bezier(0.22,1,0.36,1), color 0.2s ease',
              })}>Quiz</NavLink>
              <NavLink to="/pyq" style={({ isActive }) => ({
                padding: '5px 12px', borderRadius: 999,
                fontFamily: fonts.body, fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? 'var(--md-primary-container)' : 'transparent',
                color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-text-muted)',
                textDecoration: 'none', cursor: 'pointer',
                transition: 'background 0.2s cubic-bezier(0.22,1,0.36,1), color 0.2s ease',
              })}>PYQs</NavLink>
            </div>
          </nav>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', flexShrink: 0 }}>
            {/* Material You palette quick switcher */}
            <button
              onClick={() => setPaletteOpen((o) => !o)}
              title="Material You — palettes, dark/light/AMOLED, custom seed"
              className="motion-spring"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 999,
                background: 'var(--md-surface-low)', border: '1px solid var(--md-outline)',
                color: 'var(--md-text)', cursor: 'pointer',
                fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
              }}
            >
              <Palette size={13} style={{ color: 'var(--md-primary)' }} />
              <CaretDown size={9} weight="bold" style={{ color: 'var(--md-text-faint)' }} />
            </button>

            {/* Guide */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('studypulse-open-guide'))}
              title="How to use StudyPulse"
              className="motion-spring"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 999,
                background: 'var(--md-surface-low)', border: '1px solid var(--md-outline)',
                color: 'var(--md-text)', cursor: 'pointer',
                fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
              }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: 999,
                background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)',
                fontSize: 10, fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>?</span>
              Guide
            </button>

            {/* Notes quick access */}
            <button
              onClick={() => navigate('/notes')}
              title="Notes"
              style={{
                width: 34, height: 34, borderRadius: 999, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--md-surface-low)', border: '1px solid var(--md-outline)',
                color: 'var(--md-text-muted)', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Notebook size={14} />
            </button>

            {/* Ask AI quick access */}
            <button
              onClick={() => navigate('/assistant')}
              title="Ask AI"
              style={{
                width: 34, height: 34, borderRadius: 999, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--md-surface-low)', border: '1px solid var(--md-outline)',
                color: 'var(--md-text-muted)', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Sparkle size={14} />
            </button>

            {/* Focus timer */}
            <button
              onClick={() => navigate('/focus')}
              title="Focus timer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 999,
                background: 'var(--md-surface-low)', border: '1px solid var(--md-outline)',
                color: 'var(--md-text-muted)', cursor: 'pointer',
                fontFamily: fonts.mono, fontSize: 11, fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              <span className={`dot dot-${timerStatus}`} />
              {fmt(secondsLeft)}
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate('/settings')}
              title="Settings — Material You Studio"
              style={{
                width: 34, height: 34, borderRadius: 999, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--md-surface-low)', border: '1px solid var(--md-outline)',
                color: 'var(--md-text-muted)', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Gear size={14} />
            </button>

            {/* Profile avatar */}
            <button
              onClick={() => navigate('/profile')}
              title={userName}
              style={{
                width: 34, height: 34, borderRadius: 999, flexShrink: 0,
                background: 'var(--md-primary-container)',
                border: '1px solid var(--md-outline)',
                color: 'var(--md-on-primary-container)', fontWeight: 800, fontSize: 13,
                fontFamily: fonts.body, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {userInitial}
            </button>
          </div>
        </div>

        {/* Demo chip */}
        {isDemo && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 6 }}>
            <button
              onClick={() => { exitDemoMode(); navigate('/home') }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '4px 14px', borderRadius: 999,
                background: 'var(--md-surface-low)', border: '1px solid var(--md-outline)',
                color: 'var(--md-text-muted)', cursor: 'pointer',
                fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <span className="dot dot-warning" /> Demo mode — local only · Sign in
            </button>
          </div>
        )}
      </header>

      {/* ── Full-bleed content — every pixel of the viewport ── */}
      <main
        className="hw w-full px-4 lg:px-8"
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
          paddingTop: 16,
          paddingBottom: 24,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div
          key={location.pathname}
          className="page-enter w-full"
          style={{
            width: '100%',
            minHeight: '100%',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline)',
            borderRadius: 'var(--md-radius)',
            boxShadow: 'var(--md-shadow-card)',
            padding: '24px 28px 30px',
            transform: 'translate3d(0,0,0)',
          }}
        >
          <Outlet />
        </div>
      </main>

      {/* ── Palette popover ── */}
      <AnimatePresence>
        {paletteOpen && <PalettePopover onClose={() => setPaletteOpen(false)} />}
      </AnimatePresence>

      {/* ── AI panel — solid MD3 slide-in ── */}
      <AnimatePresence>
        {aiChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={toggleAIChat}
              style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0, 0, 0, 0.55)' }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              style={{
                position: 'fixed', top: 10, right: 10, bottom: 10, zIndex: 121,
                width: 'min(440px, 100vw - 20px)',
                background: 'var(--md-surface)',
                border: '1px solid var(--md-outline)',
                borderRadius: 'var(--md-radius)',
                boxShadow: 'var(--md-shadow-lift)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                willChange: 'transform',
              }}
            >
              <AIChat onClose={toggleAIChat} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <CommandPalette />
      {isDemo && <DemoTour />}
      <ToastContainer />

      <style>{`
        .md-navbar nav::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

export default Layout
