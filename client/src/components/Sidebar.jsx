import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  House, ClipboardText, CalendarDots, ChartBar, Notebook, Cards,
  Brain, CheckCircle, TrendUp, BookOpenText, Trophy, Target,
  UploadSimple, User, Gear, X, Sparkle, Plant,
  SidebarSimple
} from '@phosphor-icons/react'
import { useAuthStore, useUIStore } from '../stores'
import { C, fonts } from '../utils/theme'

const navSections = [
  {
    label: 'Overview',
    items: [
      { icon: House, label: 'Home', path: '/home', shortcut: 'gh' },
      { icon: ClipboardText, label: 'Assignments', path: '/assignments', shortcut: 'ga' },
      { icon: CalendarDots, label: 'Calendar', path: '/calendar', shortcut: 'gc' },
      { icon: ChartBar, label: 'Grades', path: '/grades', shortcut: 'gg' },
    ],
  },
  {
    label: 'Study',
    items: [
      { icon: Sparkle, label: 'AI Assistant', path: '/assistant' },
      { icon: Notebook, label: 'Notes', path: '/notes', shortcut: 'gn' },
      { icon: Cards, label: 'Flashcards', path: '/flashcards', shortcut: 'gf' },
      { icon: Brain, label: 'Quiz', path: '/quiz', shortcut: 'gq' },
      { icon: BookOpenText, label: 'Study Plans', path: '/study-plans', shortcut: 'gs' },
      { icon: Target, label: 'Focus Mode', path: '/focus' },
    ],
  },
  {
    label: 'Progress',
    items: [
      { icon: CheckCircle, label: 'Habits', path: '/habits', shortcut: 'gb' },
      { icon: TrendUp, label: 'Analytics', path: '/analytics', shortcut: 'gr' },
      { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', shortcut: 'gl' },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: UploadSimple, label: 'Import', path: '/import', shortcut: 'gi' },
      { icon: User, label: 'Profile', path: '/profile' },
      { icon: Gear, label: 'Settings', path: '/settings' },
    ],
  },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, closeSidebarMobile } = useUIStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isActive = (path) => {
    if (path === '/home') return location.pathname === '/home'
    if (path === '/study-plans') return location.pathname.startsWith('/study')
    return location.pathname.startsWith(path)
  }

  const handleNav = (path) => {
    navigate(path)
    closeSidebarMobile()
  }

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.name || user?.username || 'Student'
  const userInitial = userName[0]?.toUpperCase() || 'S'

  const showLabels = !sidebarCollapsed || isMobile
  const sidebarWidth = showLabels ? 248 : 60

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          onClick={closeSidebarMobile}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(4,10,8,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />
      )}

      {/* Floating glass dock */}
      <aside
        style={{
          position: 'fixed',
          top: 12, left: 12, bottom: 12,
          width: sidebarWidth,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card-glass, rgba(16,28,22,0.75))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-color, rgba(52,211,153,0.14))',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lift, 0 12px 32px rgba(0,0,0,0.45)), inset 0 1px 0 rgba(255,255,255,0.08)',
          transition: 'width 0.22s cubic-bezier(0.2, 0, 0, 1), transform 0.25s ease',
          transform: isMobile && !sidebarMobileOpen ? 'translateX(calc(-100% - 12px))' : 'translateX(0)',
          overflow: 'hidden',
        }}
      >
        {/* Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: showLabels ? 'flex-start' : 'center',
          gap: showLabels ? 10 : 0,
          padding: showLabels ? '0 12px' : 0,
          borderBottom: `1px solid ${C.borderSoft}`,
          flexShrink: 0,
          height: 54,
          boxSizing: 'border-box',
          width: '100%',
        }}>
          <button
            onClick={!showLabels ? toggleSidebar : undefined}
            title={!showLabels ? "Expand sidebar (⌘B)" : undefined}
            aria-label={!showLabels ? "Expand sidebar (⌘B)" : "StudyPulse"}
            style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: 'var(--grad-logo, linear-gradient(135deg, #10b981, #059669))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.3)',
              border: 'none', padding: 0,
              cursor: !showLabels ? 'pointer' : 'default',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={e => { if (!showLabels) e.currentTarget.style.transform = 'scale(1.06)' }}
            onMouseLeave={e => { if (!showLabels) e.currentTarget.style.transform = 'scale(1)' }}
          >
            <Plant size={19} color="#04120c" weight="duotone" />
          </button>
          {showLabels && (
            <>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontFamily: fonts.heading, fontWeight: 700, fontSize: 14,
                  color: C.text, letterSpacing: '-0.02em', lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}>StudyPulse</div>
                <div style={{
                  fontFamily: fonts.body, fontSize: 10.5, color: C.textMuted, fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>
                  Academic Workspace
                </div>
              </div>
              {!isMobile && (
                <button
                  onClick={toggleSidebar}
                  title="Collapse sidebar (⌘B)"
                  aria-label="Collapse sidebar (⌘B)"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 26, height: 26, borderRadius: 6,
                    background: 'transparent', border: 'none',
                    color: C.textMuted, cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background 0.12s ease, color 0.12s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  <SidebarSimple size={16} weight="duotone" />
                </button>
              )}
              {sidebarMobileOpen && (
                <button
                  onClick={closeSidebarMobile}
                  aria-label="Close menu"
                  style={{
                    marginLeft: 'auto', background: 'none', border: 'none',
                    color: C.textMuted, cursor: 'pointer', padding: 4, display: 'flex',
                  }}
                ><X size={18} /></button>
              )}
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="scrollbar-dense" style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          padding: showLabels ? '10px 8px' : '10px 0',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {navSections.map((section) => (
            <div key={section.label} style={{ marginBottom: showLabels ? 12 : 8, width: '100%' }}>
              {showLabels && (
                <div style={{
                  fontFamily: fonts.body, fontSize: 10.5, fontWeight: 600,
                  letterSpacing: '0.02em',
                  color: C.textFaint, padding: '4px 10px 3px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{section.label}</div>
              )}
              {section.items.map((item) => {
                const active = isActive(item.path)
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    title={!showLabels ? `${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}` : item.shortcut}
                    style={{
                      width: showLabels ? '100%' : 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: showLabels ? 'flex-start' : 'center',
                      gap: showLabels ? 10 : 0,
                      padding: showLabels ? '0 10px' : 0,
                      margin: showLabels ? '0 0 2px 0' : '0 auto 4px auto',
                      borderRadius: 8,
                      border: `1px solid ${active ? 'rgba(52,211,153,0.30)' : 'transparent'}`,
                      cursor: 'pointer',
                      position: 'relative',
                      background: active ? 'var(--accent-blue-soft, rgba(16,185,129,0.14))' : 'transparent',
                      color: active ? C.primary : C.textMuted,
                      transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                      fontFamily: fonts.body,
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                        e.currentTarget.style.color = C.text
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = C.textMuted
                      }
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 18, height: 18 }}>
                      <Icon size={18} weight={active ? "fill" : "duotone"} />
                    </span>
                    {showLabels && (
                      <span style={{
                        flex: 1,
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.label}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div style={{
          padding: showLabels ? '10px 8px' : '10px 0',
          borderTop: `1px solid ${C.borderSoft}`,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <button
            onClick={() => handleNav('/profile')}
            style={{
              width: showLabels ? '100%' : 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: showLabels ? 'flex-start' : 'center',
              gap: showLabels ? 9 : 0,
              padding: showLabels ? '0 8px' : 0,
              margin: '0 auto',
              borderRadius: 8,
              border: `1px solid ${C.borderSoft}`,
              background: 'rgba(16,185,129,0.04)',
              cursor: 'pointer',
              transition: 'background 0.13s ease, border-color 0.13s ease',
              boxSizing: 'border-box',
            }}
            title={!showLabels ? `${userName} (${user?.email || 'Profile'})` : undefined}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              background: 'var(--grad-logo, linear-gradient(135deg, #10b981, #059669))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#04120c', fontWeight: 700, fontSize: 12,
              fontFamily: fonts.heading,
            }}>
              {userInitial}
            </div>
            {showLabels && (
              <div style={{
                flex: 1, minWidth: 0, textAlign: 'left',
                overflow: 'hidden',
              }}>
                <div style={{
                  fontFamily: fonts.body,
                  fontSize: 12, fontWeight: 700, color: C.text,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{userName}</div>
                <div style={{
                  fontFamily: fonts.body,
                  fontSize: 10.5, color: C.textMuted,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{user?.email || 'View profile'}</div>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
