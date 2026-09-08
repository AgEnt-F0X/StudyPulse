import { useEffect, useState, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { List, Sparkle, MagnifyingGlass, Fire, Lightning, SunDim, MoonStars, SidebarSimple } from '@phosphor-icons/react'
import Sidebar from './Sidebar'
import AIChat from './AIChat'
import CommandPalette from './CommandPalette'
import ToastContainer from './ToastContainer'
import QuickCapture from './QuickCapture'
import InstallBanner from './InstallBanner'
import DemoTour from './DemoTour'
import { useUIStore, useAuthStore, useXPStore, usePomodoroStore } from '../stores'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { C, fonts, tint } from '../utils/theme'

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
          width: sidebarCollapsed ? 84 : 272,
          flexShrink: 0,
          transition: 'width 0.22s cubic-bezier(0.2, 0, 0, 1)',
        }}
      />

      <Sidebar />

      {/* Main content */}
      <main style={{
        flex: 1,
        minHeight: '100vh',
        overflowY: 'auto',
        scrollbarWidth: 'none',
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
            padding: '8px 24px', gap: 12,
            background: tint(C.purpleDark, 0.14),
            borderBottom: `1px solid ${tint(C.purpleDark, 0.35)}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span style={{ fontFamily: fonts.heading, fontSize: 13, fontWeight: 600, color: C.purple, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Demo mode — your data is not saved
              </span>
            </div>
            <button
              onClick={handleExitDemo}
              style={{
                fontFamily: fonts.heading, fontSize: 12, fontWeight: 700, color: C.pink,
                cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0,
              }}
            >Sign in →</button>
          </div>
        )}

        {/* Topbar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: `1px solid ${C.borderSoft}`,
          background: 'var(--bg-card-glass, rgba(16,28,22,0.75))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 30,
          flexShrink: 0, gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={toggleSidebarMobile}
              className="mobile-hamburger"
              aria-label="Open menu"
              style={{
                display: 'none', padding: '6px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                cursor: 'pointer', color: C.text,
              }}
            >
              <List size={18} weight="bold" />
            </button>
            {sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="desktop-sidebar-toggle"
                title="Expand sidebar (⌘B)"
                aria-label="Expand sidebar (⌘B)"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 7,
                  background: 'transparent',
                  border: `1px solid ${C.borderSoft}`,
                  color: C.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = C.text
                  e.currentTarget.style.borderColor = C.border
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = C.textMuted
                  e.currentTarget.style.borderColor = C.borderSoft
                }}
              >
                <SidebarSimple size={16} weight="duotone" />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: fonts.heading, fontSize: 13, fontWeight: 700,
                color: C.text, letterSpacing: '-0.01em',
              }}>
                {today}
              </span>
            </div>
            {/* Cmd+K trigger */}
            <button
              onClick={openPalette}
              title="Search & commands (Cmd+K)"
              aria-label="Search and command palette"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 8, minWidth: 180,
                background: 'var(--surface-low, #0d1712)',
                border: `1px solid ${C.borderSoft}`,
                color: C.textFaint, cursor: 'pointer',
                fontFamily: fonts.body, fontSize: 12.5,
              }}
            >
              <MagnifyingGlass size={14} weight="duotone" />
              <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
              <kbd style={{
                fontFamily: fonts.body, fontSize: 10, fontWeight: 700,
                padding: '1px 6px', borderRadius: 4,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
                color: C.textMuted,
              }}>⌘K</kbd>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Streak + XP mini-badge (interactive link to Profile) */}
            <button
              onClick={() => navigate('/profile')}
              title="View XP & Study Streak in Profile"
              aria-label="View XP and Study Streak"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '5px 12px', borderRadius: 999,
                background: tint(C.amberDeep || '#d97706', 0.10),
                border: `1px solid ${tint('#f59e0b', 0.30)}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.amber; e.currentTarget.style.background = tint(C.amberDeep || '#d97706', 0.18) }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = tint('#f59e0b', 0.30); e.currentTarget.style.background = tint(C.amberDeep || '#d97706', 0.10) }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: C.amber }}>
                <Fire size={15} weight="duotone" />{streak}
              </span>
              <span style={{ width: 1, height: 14, background: tint('#f59e0b', 0.30) }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: fonts.body, fontSize: 12, fontWeight: 700, color: C.amber }}>
                <Lightning size={15} weight="duotone" />{xp}
              </span>
            </button>

            {/* AI Assistant Quick Toggle */}
            <button
              onClick={toggleAIChat}
              title="Open AI Study Assistant"
              aria-label="Open AI Study Assistant"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 12px', borderRadius: 8,
                background: 'var(--accent-blue-soft, rgba(16,185,129,0.12))',
                border: '1px solid rgba(52,211,153,0.30)',
                color: C.primary, cursor: 'pointer',
                fontFamily: fonts.heading, fontSize: 12.5, fontWeight: 700,
                transition: 'transform 0.1s ease, background 0.12s ease',
              }}
            >
              <Sparkle size={15} weight="duotone" />
              <span className="hide-mobile">AI Assistant</span>
            </button>

            {/* Theme toggle pill with spring */}
            <button
              onClick={useUIStore.getState().toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              style={{
                display: 'flex', alignItems: 'center',
                padding: 3, borderRadius: 999,
                background: 'var(--surface-low, #0d1712)',
                border: `1px solid ${C.border}`,
                cursor: 'pointer', position: 'relative',
              }}
            >
              {['dark', 'light'].map((m) => {
                const selected = theme === m || (!theme && m === 'dark')
                return (
                  <span key={m} style={{ position: 'relative', padding: '4px 8px', display: 'flex' }}>
                    {selected && (
                      <motion.span
                        layoutId="theme-pill"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        style={{
                          position: 'absolute', inset: 0, borderRadius: 999,
                          background: 'var(--accent-blue-soft, rgba(16,185,129,0.12))',
                          border: '1px solid rgba(52,211,153,0.30)',
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', display: 'flex', color: selected ? C.primary : C.textFaint }}>
                      {m === 'dark' ? <MoonStars size={14} weight="duotone" /> : <SunDim size={14} weight="duotone" />}
                    </span>
                  </span>
                )
              })}
            </button>
          </div>
        </header>

        <div key={location.pathname} className="page-enter page-content" style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>

      {/* AI Chat slide-in panel */}
      <AnimatePresence>
        {aiChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={toggleAIChat}
              style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.6)' }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="ai-chat-panel"
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 121,
                width: 'min(420px, 100vw)',
                background: C.bgSoft,
                borderLeft: `1px solid ${C.border}`,
                boxShadow: '-16px 0 48px rgba(0,0,0,0.5)',
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
        .sidebar-spacer { transition: width 0.22s cubic-bezier(0.2, 0, 0, 1); }
        .page-content { padding: 24px 28px 48px; background: var(--grad-hero); background-repeat: no-repeat; }
        @media (max-width: 1023px) {
          .sidebar-spacer { display: none !important; width: 0 !important; }
          .mobile-hamburger { display: flex !important; }
          .desktop-sidebar-toggle { display: none !important; }
          .hide-mobile { display: none; }
        }
        @media (max-width: 640px) {
          .page-content { padding: 16px 14px 40px; }
        }
      `}</style>
    </div>
  )
}

export default Layout
