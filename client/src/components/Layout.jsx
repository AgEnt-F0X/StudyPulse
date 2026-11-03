import { useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SunDim, MoonStars, CaretDown } from '@phosphor-icons/react'
import CommandPalette from './CommandPalette'
import ToastContainer from './ToastContainer'
import DemoTour from './DemoTour'
import AIChat from './AIChat'
import { useUIStore, useAuthStore, usePomodoroStore } from '../stores'
import { C, fonts } from '../utils/theme'

// ── ECG waveform mark ─────────────────────────────────────────
const EcgMark = () => (
  <svg width="30" height="18" viewBox="0 0 30 18" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M1 9 H8 L11 3 L14 15 L17 6 L19 9 H29"
      stroke="#34D399"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ecg-trace"
      style={{ filter: 'drop-shadow(0 0 5px rgba(52,211,153,0.8))' }}
    />
  </svg>
)

const NAV_ITEMS = [
  { label: 'Home', path: '/home' },
  { label: 'Ask AI', path: '/assistant' },
  { label: 'Library', path: '/library' },
  { label: 'Notes', path: '/notes' },
  { label: 'PYQs', path: '/pyq' },
  { label: 'Quiz', path: '/quiz' },
  { label: 'Plan', path: '/study-plans' },
  { label: 'SQL Pulse 3D', path: '/sql' },
]

const CLASSES = ['Class 10', 'Class 11', 'Class 12']

const Layout = () => {
  const { aiChatOpen, toggleAIChat, theme, toggleTheme } = useUIStore()
  const { isDemo, exitDemoMode, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { isRunning, isBreak, secondsLeft } = usePomodoroStore()

  const [classLevel, setClassLevel] = useState(() => localStorage.getItem('studypulse-class') || 'All')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'dark')
  }, [theme])

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

  const pickClass = (c) => {
    setClassLevel(c)
    localStorage.setItem('studypulse-class', c)
    window.dispatchEvent(new CustomEvent('studypulse-class-change', { detail: c }))
  }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const timerStatus = !isRunning ? 'neutral' : isBreak ? 'warning' : 'success'
  const userName = user?.name?.split(' ')[0] || 'Student'
  const userInitial = userName[0]?.toUpperCase() || 'S'

  const isSql = location.pathname.startsWith('/sql')

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ── Floating spatial pill dock ── */}
      <header
        className="spatial-dock"
        style={{
          position: 'sticky', top: 12, zIndex: 100,
          maxWidth: 1152, margin: '12px auto 0',
          padding: '0 16px',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          height: 64, padding: '0 18px', borderRadius: 999,
          background: 'rgba(18, 29, 24, 0.92)',
          backdropFilter: 'blur(24px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
          border: '1px solid rgba(212, 195, 163, 0.25)',
          boxShadow: '0 20px 50px rgba(10,14,10,0.45), inset 0 1px 0 rgba(244,240,234,0.07)',
          color: C.text,
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {/* Brand */}
          <button
            onClick={() => navigate('/home')}
            style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <EcgMark />
            <span style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 19, letterSpacing: '-0.01em', color: C.text, whiteSpace: 'nowrap',
            }}>
              StudyPulse
            </span>
          </button>

          <span style={{ width: 1, height: 26, background: C.borderSoft, flexShrink: 0, margin: '0 2px' }} />

          {/* Center navigation pills */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
                display: 'inline-flex', alignItems: 'center',
                padding: '7px 13px', borderRadius: 999,
                fontFamily: fonts.body, fontSize: 12.5,
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap', flexShrink: 0,
                background: isActive ? C.active : 'transparent',
                border: isActive ? '1px solid rgba(52,211,153,0.4)' : '1px solid transparent',
                color: isActive ? C.primaryBright : C.textMuted,
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              })}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', flexShrink: 0 }}>
            {/* Exam Mode amber pill */}
            <button
              onClick={() => navigate('/study-plans')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 15px', borderRadius: 999,
                background: 'linear-gradient(180deg, #F0B24A, #D97706)',
                color: '#2A1B04', border: '1px solid rgba(240,200,130,0.5)',
                boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(217,119,6,0.4)',
                fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Exam Mode
            </button>

            {/* Class selector */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <select
                value={classLevel}
                onChange={(e) => pickClass(e.target.value)}
                style={{
                  appearance: 'none', WebkitAppearance: 'none',
                  padding: '7px 26px 7px 12px', borderRadius: 999,
                  background: 'rgba(20,32,27,0.6)', border: `1px solid ${C.borderSoft}`,
                  color: C.textMuted, fontFamily: fonts.mono, fontSize: 11,
                  cursor: 'pointer', outline: 'none',
                }}
              >
                {['All', ...CLASSES].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <CaretDown size={9} weight="bold" style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                color: C.textFaint, pointerEvents: 'none',
              }} />
            </div>

            {/* Mini focus timer */}
            <button
              onClick={() => navigate('/focus')}
              title="Focus timer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 11px', borderRadius: 999,
                background: 'rgba(20,32,27,0.6)', border: `1px solid ${C.borderSoft}`,
                color: C.textMuted, cursor: 'pointer',
                fontFamily: fonts.mono, fontSize: 11, fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              <span className={`dot dot-${timerStatus}`} />
              {fmt(secondsLeft)}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} canvas`}
              style={{
                width: 32, height: 32, borderRadius: 999, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(20,32,27,0.6)', border: `1px solid ${C.borderSoft}`,
                color: C.textMuted, cursor: 'pointer', flexShrink: 0,
              }}
            >
              {theme === 'dark' ? <SunDim size={13} /> : <MoonStars size={13} />}
            </button>

            {/* Profile avatar */}
            <button
              onClick={() => navigate('/profile')}
              title={userName}
              style={{
                width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                background: 'linear-gradient(160deg, #2FB489, #0F7A5C)',
                border: '1px solid rgba(212,195,163,0.4)',
                color: '#06251A', fontWeight: 800, fontSize: 13,
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
          <div style={{
            display: 'flex', justifyContent: 'center', marginTop: 8,
          }}>
            <button
              onClick={() => { exitDemoMode(); navigate('/home') }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 14px', borderRadius: 999,
                background: 'rgba(18,29,24,0.92)', border: `1px solid ${C.borderSoft}`,
                color: C.textMuted, cursor: 'pointer',
                fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '0.06em',
                textTransform: 'uppercase', backdropFilter: 'blur(16px)',
              }}
            >
              <span className="dot dot-warning" /> Demo mode — local only · Sign in
            </button>
          </div>
        )}
      </header>

      {/* ── Floating glass workspace sheet ── */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        <div
          key={location.pathname}
          className="page-enter workspace-sheet"
          style={{
            maxWidth: isSql ? 1360 : 1152,
            margin: '18px auto 40px',
            background: 'rgba(18, 29, 24, 0.92)',
            backdropFilter: 'blur(24px) saturate(1.15)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
            border: '1px solid rgba(212, 195, 163, 0.28)',
            borderRadius: 26,
            boxShadow: '0 30px 80px rgba(30, 25, 15, 0.35), inset 0 1px 0 rgba(244,240,234,0.06)',
            padding: '24px 26px 28px',
            minHeight: 560,
          }}
        >
          <Outlet />
        </div>
      </main>

      {/* AI panel — spatial glass slide-in */}
      <AnimatePresence>
        {aiChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={toggleAIChat}
              style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(30, 25, 15, 0.35)', backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              style={{
                position: 'fixed', top: 12, right: 12, bottom: 12, zIndex: 121,
                width: 'min(440px, 100vw - 24px)',
                background: 'rgba(18, 29, 24, 0.94)',
                backdropFilter: 'blur(28px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
                border: '1px solid rgba(212, 195, 163, 0.3)',
                borderRadius: 24,
                boxShadow: '0 30px 80px rgba(10,14,10,0.5)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
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
        .spatial-dock::-webkit-scrollbar { display: none; }
        .spatial-dock nav::-webkit-scrollbar { display: none; }
        .workspace-sheet::-webkit-scrollbar { display: none; }
        @media (max-width: 900px) {
          .spatial-dock > div { border-radius: 26px; height: auto; flex-wrap: nowrap; }
          .workspace-sheet { margin: 14px 10px 28px !important; padding: 16px 14px 22px !important; }
        }
      `}</style>
    </div>
  )
}

export default Layout
