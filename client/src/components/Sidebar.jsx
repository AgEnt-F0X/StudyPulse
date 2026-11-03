import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  House, ClipboardText, CalendarDots, ChartBar, Notebook, Cards,
  Brain, CheckCircle, TrendUp, BookOpenText, Trophy, Target,
  UploadSimple, User, Gear, X, Sparkle, Database, Books, GraduationCap,
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
      { icon: Sparkle, label: 'AI Tutor', path: '/assistant' },
      { icon: Books, label: 'Library', path: '/library' },
      { icon: GraduationCap, label: 'PYQ Vault', path: '/pyq' },
      { icon: Notebook, label: 'Notes', path: '/notes', shortcut: 'gn' },
      { icon: Cards, label: 'Flashcards', path: '/flashcards', shortcut: 'gf' },
      { icon: Brain, label: 'Quiz', path: '/quiz', shortcut: 'gq' },
      { icon: Database, label: 'SQL Pulse', path: '/sql' },
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
  const sidebarWidth = showLabels ? 232 : 56

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          onClick={closeSidebarMobile}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 40,
          }}
        />
      )}

      {/* Full-height rail */}
      <aside
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: sidebarWidth,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--sidebar-bg, #09090B)',
          borderRight: '1px solid var(--border-color, #232329)',
          transition: 'width 0.18s cubic-bezier(0.2, 0, 0, 1), transform 0.22s ease',
          transform: isMobile && !sidebarMobileOpen ? 'translateX(-100%)' : 'translateX(0)',
          overflow: 'hidden',
        }}
      >
        {/* Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: showLabels ? 'flex-start' : 'center',
          gap: showLabels ? 9 : 0,
          padding: showLabels ? '0 12px' : 0,
          borderBottom: `1px solid ${C.borderSoft}`,
          flexShrink: 0,
          height: 44,
          boxSizing: 'border-box',
          width: '100%',
        }}>
          <button
            onClick={!showLabels ? toggleSidebar : undefined}
            title={!showLabels ? 'Expand sidebar (⌘B)' : undefined}
            aria-label={!showLabels ? 'Expand sidebar (⌘B)' : 'StudyPulse'}
            style={{
              width: 22, height: 22, borderRadius: 4, flexShrink: 0,
              background: C.fill,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', padding: 0,
              cursor: !showLabels ? 'pointer' : 'default',
            }}
          >
            <span style={{
              fontFamily: fonts.mono, fontSize: 10, fontWeight: 700,
              color: C.fillText, letterSpacing: '-0.05em',
            }}>SP</span>
          </button>
          {showLabels && (
            <>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontFamily: fonts.body, fontWeight: 600, fontSize: 13,
                  color: C.text, letterSpacing: '-0.02em', lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}>StudyPulse</div>
              </div>
              {!isMobile && (
                <button
                  onClick={toggleSidebar}
                  title="Collapse sidebar (⌘B)"
                  aria-label="Collapse sidebar (⌘B)"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 24, height: 24, borderRadius: 4,
                    background: 'transparent', border: 'none',
                    color: C.textFaint, cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background 0.12s ease, color 0.12s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textFaint }}
                >
                  <SidebarSimple size={14} weight="regular" />
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
                ><X size={16} /></button>
              )}
            </>
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: showLabels ? '8px 8px' : '8px 0',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {navSections.map((section) => (
            <div key={section.label} style={{ marginBottom: showLabels ? 14 : 8, width: '100%' }}>
              {showLabels && (
                <div className="metric-label" style={{ padding: '6px 10px 4px' }}>
                  {section.label}
                </div>
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
                      height: 30,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: showLabels ? 'flex-start' : 'center',
                      gap: showLabels ? 9 : 0,
                      padding: showLabels ? '0 10px' : 0,
                      margin: showLabels ? '0 0 1px 0' : '0 auto 2px auto',
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      background: active ? C.cardHover : 'transparent',
                      color: active ? C.text : C.textMuted,
                      transition: 'background 0.1s ease, color 0.1s ease',
                      fontFamily: fonts.body,
                      fontSize: 12.5,
                      fontWeight: active ? 500 : 400,
                      letterSpacing: '-0.01em',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
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
                    {/* Active indicator — 2px rule on the left edge */}
                    {active && showLabels && (
                      <span style={{
                        position: 'absolute', left: 0, top: 7, bottom: 7,
                        width: 2, borderRadius: 1, background: C.text,
                      }} />
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 16, height: 16 }}>
                      <Icon size={15} weight={active ? 'fill' : 'regular'} />
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

        {/* User */}
        <div style={{
          padding: showLabels ? '8px 8px' : '8px 0',
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
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: showLabels ? 'flex-start' : 'center',
              gap: showLabels ? 9 : 0,
              padding: showLabels ? '0 8px' : 0,
              margin: '0 auto',
              borderRadius: 4,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background 0.1s ease',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            title={!showLabels ? `${userName} (${user?.email || 'Profile'})` : undefined}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0,
              background: C.cardSoft,
              border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.text, fontWeight: 600, fontSize: 10,
              fontFamily: fonts.mono,
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
                  fontSize: 12, fontWeight: 500, color: C.text,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{userName}</div>
                <div style={{
                  fontFamily: fonts.body,
                  fontSize: 10.5, color: C.textFaint,
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
