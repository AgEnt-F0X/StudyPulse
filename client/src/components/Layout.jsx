import { useEffect, useState, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { List, MagnifyingGlass, SunDim, MoonStars, SidebarSimple } from '@phosphor-icons/react'
import Sidebar from './Sidebar'
import AIChat from './AIChat'
import CommandPalette from './CommandPalette'
import ToastContainer from './ToastContainer'
import QuickCapture from './QuickCapture'
import InstallBanner from './InstallBanner'
import DemoTour from './DemoTour'
import { useUIStore, useAuthStore, useXPStore, usePomodoroStore } from '../stores'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { C, fonts } from '../utils/theme'

const StatusBarChip = ({ keys, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    {keys.map((k) => (
      <kbd key={k} className="kbd">{k}</kbd>
    ))}
    <span style={{ color: C.textFaint }}>{label}</span>
  </span>
)

const Layout = () => {
  const { aiChatOpen, toggleAIChat, toggleSidebar, toggleSidebarMobile, sidebarCollapsed, theme } = useUIStore()
  const { isDemo, exitDemoMode } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'dark')
  }, [theme])

  useKeyboardShortcuts()

  const handleExitDemo = () => {
    exitDemoMode()
    navigate('/home')
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const xp = useXPStore((s) => s.xp || 0)
  const dailyFocusLog = usePomodoroStore((s) => s.dailyFocusLog || {})
  const { isRunning, isBreak, secondsLeft, sessionCount } = usePomodoroStore()
  const streak = useMemo(() => {
    let count = 0
    const d = new Date()
    // count back consecutive days with focus minutes (today may be 0, start from yesterday if so)
    if (!dailyFocusLog[d.toISOString().split('T')[0]]) d.setDate(d.getDate() - 1)
    while (dailyFocusLog[d.toISOString().split('T')[0]] > 0) {
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [dailyFocusLog])
  const openPalette = () => window.dispatchEvent(new Event('open-command-palette'))

  // Ctrl+Enter — execute the pending AI query (or open the panel when closed)
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

  const timerLabel = isRunning ? (isBreak ? 'BREAK' : 'FOCUS') : 'IDLE'
  const timerStatus = !isRunning ? 'neutral' : isBreak ? 'warning' : 'success'
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: C.bg,
      position: 'relative',
    }}>
      {/* Sidebar spacer (desktop) */}
      <div
        className="sidebar-spacer"
        style={{
          width: sidebarCollapsed ? 84 : 232,
          flexShrink: 0,
          transition: 'width 0.18s cubic-bezier(0.2, 0, 0, 1)',
        }}
      />

      <Sidebar />

      {/* Main content */}
      <main style={{
        flex: 1,
        minHeight: '100vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
        minWidth: 0,
      }}>
        {/* Demo banner */}
        {isDemo && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 20px', gap: 12,
            background: 'var(--surface-card-soft, #18181C)',
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="dot dot-warning" />
              <span style={{ fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textMuted }}>
                Demo mode — local data only
              </span>
            </span>
            <button
              onClick={handleExitDemo}
              style={{
                fontFamily: fonts.body, fontSize: 12, fontWeight: 500, color: C.text,
                cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0,
              }}
            >Sign in</button>
          </div>
        )}

        {/* Topbar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
          height: 44,
          borderBottom: `1px solid ${C.border}`,
          background: C.bg,
          position: 'sticky', top: 0, zIndex: 30,
          flexShrink: 0, gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button
              onClick={toggleSidebarMobile}
              className="mobile-hamburger"
              aria-label="Open menu"
              style={{
                display: 'none', padding: '6px 8px', borderRadius: 4,
                background: 'transparent',
                border: `1px solid ${C.border}`,
                cursor: 'pointer', color: C.text,
              }}
            >
              <List size={16} weight="regular" />
            </button>
            {sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="desktop-sidebar-toggle"
                title="Expand sidebar (⌘B)"
                aria-label="Expand sidebar (⌘B)"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 4,
                  background: 'transparent',
                  border: `1px solid ${C.borderSoft}`,
                  color: C.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.13s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = C.cardHover
                  e.currentTarget.style.color = C.text
                  e.currentTarget.style.borderColor = C.border
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = C.textMuted
                  e.currentTarget.style.borderColor = C.borderSoft
                }}
              >
                <SidebarSimple size={14} weight="regular" />
              </button>
            )}
            <span style={{
              fontFamily: fonts.body, fontSize: 12.5, fontWeight: 500,
              color: C.textMuted, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
            }}>
              {today}
            </span>
            {/* Cmd+K trigger */}
            <button
              onClick={openPalette}
              title="Search & commands (Cmd+K)"
              aria-label="Search and command palette"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px', borderRadius: 4, minWidth: 180,
                background: C.bgSoft,
                border: `1px solid ${C.borderSoft}`,
                color: C.textFaint, cursor: 'pointer',
                fontFamily: fonts.body, fontSize: 12,
              }}
            >
              <MagnifyingGlass size={13} weight="regular" />
              <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
              <kbd className="kbd">⌘K</kbd>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Focus timer telemetry */}
            <button
              onClick={() => navigate('/focus')}
              title="Open Focus Mode"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 10px', borderRadius: 4,
                background: 'transparent',
                border: `1px solid ${C.borderSoft}`,
                cursor: 'pointer',
                fontFamily: fonts.mono, fontSize: 11,
                fontVariantNumeric: 'tabular-nums',
                color: C.textMuted,
                transition: 'border-color 0.13s ease, background 0.13s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.cardHover }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.background = 'transparent' }}
            >
              <span className={`dot dot-${timerStatus}`} />
              {timerLabel}
              <span style={{ color: C.text }}>{fmt(secondsLeft)}</span>
            </button>

            {/* Streak + XP telemetry */}
            <button
              onClick={() => navigate('/profile')}
              title="XP & study streak"
              aria-label="XP and study streak"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '5px 10px', borderRadius: 4,
                background: 'transparent',
                border: `1px solid ${C.borderSoft}`,
                cursor: 'pointer',
                fontFamily: fonts.mono, fontSize: 11,
                fontVariantNumeric: 'tabular-nums',
                color: C.textMuted,
                transition: 'border-color 0.13s ease, background 0.13s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.cardHover }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span className={`dot dot-${streak > 0 ? 'success' : 'neutral'}`} />
                {streak}d
              </span>
              <span style={{ width: 1, height: 12, background: C.border }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.text }}>
                {xp}<span style={{ color: C.textFaint }}>XP</span>
              </span>
            </button>

            {/* AI panel toggle */}
            <button
              onClick={toggleAIChat}
              title="Open AI tutor (Ctrl+Enter to execute)"
              aria-label="Open AI tutor panel"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 10px', borderRadius: 4,
                background: C.cardHover,
                border: `1px solid ${C.border}`,
                color: C.text, cursor: 'pointer',
                fontFamily: fonts.body, fontSize: 12, fontWeight: 500,
                transition: 'background 0.13s ease, border-color 0.13s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderStrong }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border }}
            >
              <span className={`dot dot-success`} />
              <span className="hide-mobile">Tutor</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={useUIStore.getState().toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 4,
                background: 'transparent',
                border: `1px solid ${C.borderSoft}`,
                color: C.textMuted, cursor: 'pointer',
                transition: 'border-color 0.13s ease, color 0.13s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.color = C.textMuted }}
            >
              {theme === 'dark' ? <SunDim size={14} weight="regular" /> : <MoonStars size={14} weight="regular" />}
            </button>
          </div>
        </header>

        <div key={location.pathname} className="page-enter page-content" style={{ flex: 1 }}>
          <Outlet />
        </div>

        {/* Keyboard shortcut status bar */}
        <div className="status-bar" style={{
          position: 'sticky', bottom: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 30, padding: '0 16px', gap: 16,
          background: C.bg,
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, overflow: 'hidden' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'none', border: 'none' }} onClick={openPalette}>
              <StatusBarChip keys={['⌘K']} label="Palette" />
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <StatusBarChip keys={['⌘B']} label="Sidebar" />
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <StatusBarChip keys={['Ctrl', '↵']} label="Execute AI" />
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            fontFamily: fonts.mono, fontSize: 10.5,
            fontVariantNumeric: 'tabular-nums', color: C.textFaint,
            whiteSpace: 'nowrap',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className={`dot dot-${timerStatus}`} />
              {sessionCount} sessions
            </span>
            <span>{xp} XP · {streak}d streak</span>
          </div>
        </div>
      </main>

      {/* AI panel — right dock, flush hairline, no overlay blur */}
      <AnimatePresence>
        {aiChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={toggleAIChat}
              style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="ai-chat-panel"
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 121,
                width: 'min(440px, 100vw)',
                background: C.card,
                borderLeft: `1px solid ${C.border}`,
                display: 'flex', flexDirection: 'column',
              }}
            >
              <AIChat onClose={toggleAIChat} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <QuickCapture />
      <CommandPalette />
      <InstallBanner />
      {isDemo && <DemoTour />}
      <ToastContainer />

      <style>{`
        .sidebar-spacer { transition: width 0.18s cubic-bezier(0.2, 0, 0, 1); }
        .page-content { padding: 20px 24px 40px; }
        .status-bar button { background: none; border: none; padding: 0; font: inherit; }
        @media (max-width: 1023px) {
          .sidebar-spacer { display: none !important; width: 0 !important; }
          .mobile-hamburger { display: flex !important; }
          .desktop-sidebar-toggle { display: none !important; }
          .hide-mobile { display: none; }
          .status-bar span:last-child { display: none; }
        }
        @media (max-width: 640px) {
          .page-content { padding: 14px 14px 32px; }
        }
      `}</style>
    </div>
  )
}

export default Layout
