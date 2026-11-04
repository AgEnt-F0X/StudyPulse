import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Notebook, Sparkle } from '@phosphor-icons/react'
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
  { label: 'Today', path: '/home' },
  { label: 'Study & 3D Labs', path: '/library' },
  { label: 'SQL 3D Arena', path: '/sql' },
  { label: 'Exam Plan', path: '/study-plans' },
]

const CLASSES = ['Class 10', 'Class 11', 'Class 12']

const Layout = () => {
  const { aiChatOpen, toggleAIChat, theme, toggleTheme } = useUIStore()
  const { isDemo, exitDemoMode, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { isRunning, isBreak, secondsLeft } = usePomodoroStore()

  
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

  return (
    <div
      className="w-screen"
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      {/* ── Floating spatial pill dock — full-width stretch ── */}
      <header
        className="spatial-dock hw"
        style={{
          flexShrink: 0,
          width: '100%',
          padding: '10px 14px 4px',
          position: 'relative',
          zIndex: 100,
        }}
      >
        <div
          className="glass-dock"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 64, padding: '0 20px',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(52,211,153,0.12)',
            color: C.text,
            overflowX: 'auto', scrollbarWidth: 'none',
            transform: 'translate3d(0,0,0)',
          }}
        >
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

          {/* Center navigation — 5 calm destinations */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
            {NAV_ITEMS.slice(0, 2).map((item) => (
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
                transition: 'background 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out',
              })}>
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/sql" style={({ isActive }) => ({
              display: 'inline-flex', alignItems: 'center',
              padding: '7px 13px', borderRadius: 999,
              fontFamily: fonts.body, fontSize: 12.5,
              fontWeight: isActive ? 700 : 500,
              whiteSpace: 'nowrap', flexShrink: 0,
              background: isActive ? C.active : 'transparent',
              border: isActive ? '1px solid rgba(52,211,153,0.4)' : '1px solid transparent',
              color: isActive ? C.primaryBright : C.textMuted,
              cursor: 'pointer',
              transition: 'background 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out',
            })}>
              SQL 3D Arena
            </NavLink>
            {/* Practice — Quiz & PYQs as one tactile split pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', flexShrink: 0,
              borderRadius: 999, padding: 2,
              background: 'rgba(20,32,27,0.6)', border: `1px solid ${C.borderSoft}`,
            }}>
              <NavLink to="/quiz" style={({ isActive }) => ({
                padding: '5px 11px', borderRadius: 999,
                fontFamily: fonts.body, fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? C.active : 'transparent',
                color: isActive ? C.primaryBright : C.textMuted,
                textDecoration: 'none', cursor: 'pointer',
                transition: 'background 0.2s ease-out, color 0.2s ease-out',
              })}>Quiz</NavLink>
              <NavLink to="/pyq" style={({ isActive }) => ({
                padding: '5px 11px', borderRadius: 999,
                fontFamily: fonts.body, fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? C.active : 'transparent',
                color: isActive ? C.primaryBright : C.textMuted,
                textDecoration: 'none', cursor: 'pointer',
                transition: 'background 0.2s ease-out, color 0.2s ease-out',
              })}>PYQs</NavLink>
            </div>
            <NavLink to="/study-plans" style={({ isActive }) => ({
              display: 'inline-flex', alignItems: 'center',
              padding: '7px 13px', borderRadius: 999,
              fontFamily: fonts.body, fontSize: 12.5,
              fontWeight: isActive ? 700 : 500,
              whiteSpace: 'nowrap', flexShrink: 0,
              background: isActive ? C.active : 'transparent',
              border: isActive ? '1px solid rgba(52,211,153,0.4)' : '1px solid transparent',
              color: isActive ? C.primaryBright : C.textMuted,
              cursor: 'pointer',
              transition: 'background 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out',
            })}>
              Exam Plan
            </NavLink>
          </nav>

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', flexShrink: 0 }}>
            {/* Interactive guide */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('studypulse-open-guide'))}
              title="How to use StudyPulse"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 999,
                background: 'rgba(20,32,27,0.6)', border: `1px solid ${C.borderSoft}`,
                color: C.text, cursor: 'pointer',
                fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
                flexShrink: 0,
                transition: 'transform 0.18s cubic-bezier(0.22,1,0.36,1), border-color 0.18s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = C.borderSoft }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: 999,
                background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.4)',
                color: C.primaryBright, fontSize: 10, fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>?</span>
              Guide
            </button>

            {/* Notes quick access */}
            <button
              onClick={() => navigate('/notes')}
              title="Notes"
              style={{
                width: 32, height: 32, borderRadius: 999, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(20,32,27,0.6)', border: `1px solid ${C.borderSoft}`,
                color: C.textMuted, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Notebook size={13} />
            </button>

            {/* Ask AI quick access */}
            <button
              onClick={() => navigate('/assistant')}
              title="Ask AI"
              style={{
                width: 32, height: 32, borderRadius: 999, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(20,32,27,0.6)', border: `1px solid ${C.borderSoft}`,
                color: C.textMuted, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Sparkle size={13} />
            </button>

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
                transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Exam Mode
            </button>

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

            {/* Profile avatar */}
            <button
              onClick={() => navigate('/profile')}
              title={userName}
              style={{
                width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                background: 'linear-gradient(160deg, #2FB489, #0F7A5C)',
                border: '1px solid rgba(52,211,153,0.4)',
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
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <button
              onClick={() => { exitDemoMode(); navigate('/home') }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 14px', borderRadius: 999,
                background: 'rgba(18,29,24,0.92)', border: `1px solid ${C.borderSoft}`,
                color: C.textMuted, cursor: 'pointer',
                fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '0.06em',
                textTransform: 'uppercase', 
              }}
            >
              <span className="dot dot-warning" /> Demo mode — local only · Sign in
            </button>
          </div>
        )}
      </header>

      {/* ── Full-bleed glass workspace — every pixel of the viewport ── */}
      <main
        className="hw"
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
          padding: '14px 20px 22px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div
          key={location.pathname}
          className="page-enter"
          style={{
            width: '100%',
            minHeight: '100%',
            background: '#131C18',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: 22,
            boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
            padding: '24px 28px 30px',
            transform: 'translate3d(0,0,0)',
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
              style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0, 0, 0, 0.55)' }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              style={{
                position: 'fixed', top: 10, right: 10, bottom: 10, zIndex: 121,
                width: 'min(440px, 100vw - 20px)',
                background: 'rgba(19, 28, 24, 0.985)',
                border: '1px solid rgba(52, 211, 153, 0.24)',
                borderRadius: 24,
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
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
        .spatial-dock::-webkit-scrollbar { display: none; }
        .spatial-dock nav::-webkit-scrollbar { display: none; }
        @media (max-width: 900px) {
          .spatial-dock > div { border-radius: 26px; height: auto; }
        }
      `}</style>
    </div>
  )
}

export default Layout
