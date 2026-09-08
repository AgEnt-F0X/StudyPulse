import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardText, ChartBar, Notebook, CheckCircle,
  Target, Brain, Cards, ArrowRight, Lightning,
  Sparkle, ArrowClockwise, SpinnerGap, Play
} from '@phosphor-icons/react'
import { useAuthStore, useAssignmentsStore, useGradesStore, useNotesStore, useXPStore, useUIStore, usePomodoroStore, pctToGPA, calcStreak } from '../stores'
import { hasClientKey, callGeminiClient, getKeyProvider } from '../utils/gemini'
import { C, fonts, tint, btnPrimary, iconBox } from '../utils/theme'
import { StatCard, SectionTitle, Card } from '../components/ui'
import { GoogleLogo } from '../components/GoogleButton'
const stripMarkdown = (str) => {
  if (!str) return ''
  return str
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .trim()
}

export default function Home() {
  const navigate = useNavigate()
  const { user, isGoogleConnected, loginWithGoogle } = useAuthStore()
  const { assignments, courses, syncClassroom, syncing } = useAssignmentsStore()
  const { addToast } = useUIStore()
  const connected = isGoogleConnected()

  const handleSync = async () => {
    if (!connected) { navigate('/settings'); return }
    try {
      const r = await syncClassroom()
      addToast({ type: 'success', message: `Synced ${r.courses} courses · ${r.assignments} assignments` })
    } catch (e) {
      if (e?.name === 'ClassroomAuthError') { addToast({ type: 'error', message: 'Google session expired — reconnecting…' }); loginWithGoogle().catch(() => {}) }
      else addToast({ type: 'error', message: e?.message || 'Classroom sync failed' })
    }
  }
  const { calculateCourseGrade, courseGrades } = useGradesStore()
  const { notes } = useNotesStore()
  const xpStore = useXPStore()
  const { pct: xpPct, cur: xpLevel, next: xpNext, xpToNext } = xpStore.getProgress()
  const xp = xpStore.xp

  const name = user?.firstName || user?.name?.split(' ')[0] || 'Student'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const todayAssignments = useMemo(() => {
    const todayStr = new Date().toDateString()
    return (assignments || []).filter(a => !a.completed && new Date(a.dueDate).toDateString() === todayStr)
  }, [assignments])

  const upcoming = useMemo(() => {
    return (assignments || [])
      .filter(a => !a.completed && new Date(a.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
  }, [assignments])

  const recentNotes = useMemo(() => (notes || []).slice(0, 3), [notes])

  const currentGPA = useMemo(() => {
    if (!courses?.length) return '—'
    let totalPoints = 0, totalCredits = 0
    courses.forEach(c => {
      const result = calculateCourseGrade(c.id)
      if (!result) return
      const cred = c.credits || 3
      totalPoints += pctToGPA(parseFloat(result.percentage)) * cred
      totalCredits += cred
    })
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '—'
  }, [courses, courseGrades, calculateCourseGrade])

  const { dailyFocusLog } = usePomodoroStore()
  const streak = calcStreak(dailyFocusLog || {})

  const todayKey = new Date().toISOString().split('T')[0]
  const briefCacheKey = `studypulse-daily-brief-${todayKey}`

  const [dailyBrief, setDailyBrief] = useState(() => {
    try { return localStorage.getItem(briefCacheKey) || '' } catch { return '' }
  })
  const [briefLoading, setBriefLoading] = useState(false)

  const generateBrief = async () => {
    if (!hasClientKey()) return
    setBriefLoading(true)
    try {
      const dueToday = todayAssignments.length
      const dueThisWeek = (assignments || []).filter(a => {
        if (a.completed) return false
        const d = new Date(a.dueDate)
        const now = new Date()
        const weekEnd = new Date(now.getTime() + 7 * 86400000)
        return d >= now && d <= weekEnd
      }).length
      const noteCount = notes?.length || 0
      const focusStreak = streak

      const context = `Student: ${name}, Level ${xpLevel?.level || 1}, ${xp} XP.
Assignments due today: ${dueToday}. Due this week: ${dueThisWeek}.
Total notes: ${noteCount}. Focus streak: ${focusStreak} days.
Subjects: Physics, Chemistry, Mathematics, Biology, English (CBSE Class 11).
Upcoming assignments: ${upcoming.slice(0, 3).map(a => `${a.title} (${a.course || a.courseName}, ${Math.ceil((new Date(a.dueDate) - new Date()) / 86400000)}d left)`).join('; ') || 'None'}`

      const prompt = `You are a friendly AI study coach for a CBSE Class 11 student. Based on this data, write a SHORT personalized daily study brief (4-5 lines max).

Rules:
- Start with an encouraging opening line
- Mention specific priorities for today (assignments due, subjects to focus on)
- Give ONE specific actionable tip
- End with a motivational closing
- Keep it warm, concise, and actionable
- Use emojis sparingly (1-2 max)
- DO NOT use markdown headers or bullet points - just flowing text

Student data:
${context}`

      const result = await callGeminiClient(prompt, { timeoutMs: 10000 })
      if (result) {
        setDailyBrief(result)
        localStorage.setItem(briefCacheKey, result)
      }
    } catch (e) {
      console.warn('Daily brief generation failed', e)
    } finally {
      setBriefLoading(false)
    }
  }

  // Auto-generate on first load if no cached brief and key exists
  useEffect(() => {
    if (!dailyBrief && hasClientKey() && !briefLoading) {
      generateBrief()
    }
  }, []) // eslint-disable-line

  const quickActions = [
    { icon: Target, label: 'Start Focus Mode', path: '/focus', color: C.primary },
    { icon: Brain, label: 'Take a Quiz', path: '/quiz', color: C.amber },
    { icon: Cards, label: 'Review Flashcards', path: '/flashcards', color: C.green },
    { icon: ChartBar, label: 'Check Grades', path: '/grades', color: C.orange },
  ]

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 'min(1280px, 100%)', margin: '0 auto' }}>
      {/* Top Greeting & Status Bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16, marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontFamily: fonts.heading, fontSize: 26, fontWeight: 700,
            color: C.text, marginBottom: 4, letterSpacing: '-0.02em',
          }}>
            {greeting}, {name}
          </h1>
          <p style={{ fontSize: 13.5, color: C.textMuted }}>
            {today} · <span style={{ color: C.primary, fontWeight: 600 }}>{todayAssignments.length} due today</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/assistant')}
            style={{
              ...btnPrimary,
              padding: '8px 14px',
              fontSize: 12.5,
            }}
          >
            <Sparkle size={15} weight="duotone" /> Ask AI Coach
          </button>
        </div>
      </div>

      {/* XP Level Progress Tracker */}
      <Card style={{ padding: '16px 20px', marginBottom: 22, background: 'var(--bg-card-glass, rgba(16,28,22,0.75))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7,
              background: 'var(--grad-reward, linear-gradient(135deg, #fbbf24, #d97706))',
              boxShadow: '0 8px 32px rgba(245,158,11,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lightning size={14} weight="duotone" color="#1a1005" />
            </div>
            <span style={{ fontFamily: fonts.heading, fontSize: 13, fontWeight: 700, color: C.text }}>
              {xpLevel?.title || 'Freshman'} <span style={{ color: C.amber }}>· Level {xpLevel?.level || 1}</span>
            </span>
          </div>
          <span style={{ fontSize: 12, color: C.textMuted, fontFamily: fonts.heading, fontWeight: 600 }}>
            {xp} XP {xpNext ? `· ${xpToNext - (xp - xpLevel.min)} XP to Level ${(xpLevel?.level || 1) + 1}` : '· Max level reached'}
          </span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(100, Math.max(0, xpPct))}%`,
            background: 'var(--grad-primary, linear-gradient(135deg, #34d399, #10b981))',
            borderRadius: 3, transition: 'width 0.4s ease',
          }} />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard icon={ClipboardText} label="Due today" value={todayAssignments.length} color={todayAssignments.length > 0 ? C.pink : C.primary} />
        <StatCard icon={ChartBar} label="Current GPA" value={currentGPA} color={C.primary} />
        <StatCard icon={Notebook} label="Study Notes" value={notes?.length || 0} color={C.amber} />
        <StatCard icon={CheckCircle} label="Completed Tasks" value={(assignments || []).filter(a => a.completed).length} color={C.green} />
      </div>

      {/* AI Daily Study Brief — Botanical hero */}
      {hasClientKey() && (
        <Card style={{
          marginBottom: 24,
          padding: '20px 22px',
          background: 'var(--bg-card, #101c17)',
          border: `1px solid ${C.border}`,
          boxShadow: 'var(--shadow-lift, 0 8px 24px rgba(0,0,0,0.45))',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Brain size={18} weight="duotone" color={C.primary} />
              <div>
                <span style={{ fontFamily: fonts.heading, fontSize: 13.5, fontWeight: 700, color: C.text }}>
                  Today's Study Brief
                </span>
                <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8, fontFamily: fonts.heading, fontWeight: 600 }}>
                  ({getKeyProvider()})
                </span>
              </div>
            </div>
            <button
              onClick={generateBrief}
              disabled={briefLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                color: C.textMuted, fontSize: 11.5, cursor: briefLoading ? 'wait' : 'pointer',
                fontFamily: fonts.heading, fontWeight: 600,
                transition: 'color 0.12s ease, border-color 0.12s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted }}
            >
              {briefLoading ? <SpinnerGap size={12} className="spin" weight="bold" /> : <ArrowClockwise size={12} weight="bold" />}
              {briefLoading ? 'Generating...' : 'Refresh'}
            </button>
          </div>
          {dailyBrief ? (
            <div style={{
              fontSize: 13.5, lineHeight: 1.65, color: C.text,
              background: 'var(--surface-low, #0d1712)',
              padding: '14px 16px', borderRadius: 8,
              border: `1px solid ${C.borderSoft}`,
            }}>
              {dailyBrief}
            </div>
          ) : briefLoading ? (
            <p style={{ fontSize: 13, color: C.textMuted, margin: '8px 0 0' }}>
              Analyzing curriculum, upcoming deadlines, and generating personalized study priorities...
            </p>
          ) : (
            <p style={{ fontSize: 13, color: C.textMuted, margin: '8px 0 0' }}>
              Add an API key in Settings to activate real-time AI study briefs.
            </p>
          )}
        </Card>
      )}

      {/* Main Dual Columns */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Upcoming Assignments */}
        <Card style={{ padding: '18px 20px' }}>
          <SectionTitle
            icon={ClipboardText}
            color={C.primary}
            action={
              <button onClick={() => navigate('/assignments')} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: C.primary, background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: fonts.heading, fontWeight: 700,
              }}>View all <ArrowRight size={12} weight="bold" /></button>
            }
          >Upcoming deadlines</SectionTitle>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
              <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>
                {connected ? 'No pending assignments — all caught up!' : 'Sync Google Classroom or create assignments.'}
              </p>
              <button onClick={handleSync} disabled={syncing} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#ffffff', color: '#090d16', cursor: syncing ? 'not-allowed' : 'pointer',
                fontFamily: fonts.heading, fontSize: 12.5, fontWeight: 700,
              }}>
                <GoogleLogo size={14} /> {syncing ? 'Syncing…' : connected ? 'Sync Classroom' : 'Connect Classroom'}
              </button>
            </div>
          ) : (
            upcoming.map(a => {
              const due = new Date(a.dueDate)
              const daysLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <div key={a.id} className="hover-row" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 10px', margin: '0 -6px',
                  borderBottom: `1px solid ${C.borderSoft}`,
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: daysLeft <= 1 ? C.pink : daysLeft <= 3 ? C.orange : C.green,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.textMuted }}>{a.course || a.courseName}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{
                      fontSize: 11.5, fontWeight: 700,
                      color: daysLeft <= 1 ? C.pink : C.textMuted,
                      fontFamily: fonts.heading,
                    }}>
                      {daysLeft === 0 ? 'Due Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
                    </div>
                    <button
                      onClick={() => {
                        usePomodoroStore.getState().setActiveAssignment(a.id)
                        navigate('/focus')
                      }}
                      title="Focus on this assignment with Pomodoro"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 6,
                        background: 'var(--surface-low, #0d1712)',
                        border: `1px solid ${C.borderSoft}`,
                        color: C.primary, fontSize: 11, cursor: 'pointer',
                        fontFamily: fonts.heading, fontWeight: 700,
                        transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = 'var(--accent-blue-soft, rgba(16,185,129,0.12))' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.background = 'var(--surface-low, #0d1712)' }}
                    >
                      <Play size={10} weight="fill" /> Focus
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </Card>

        {/* Recent Notes */}
        <Card style={{ padding: '18px 20px' }}>
          <SectionTitle
            icon={Notebook}
            color={C.primary}
            action={
              <button onClick={() => navigate('/notes')} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: C.primary, background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: fonts.heading, fontWeight: 700,
              }}>View all <ArrowRight size={12} weight="bold" /></button>
            }
          >Recent notes</SectionTitle>
          {recentNotes.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', padding: '24px 0' }}>
              No notes saved yet. Capture your lecture points anytime.
            </p>
          ) : (
            recentNotes.map(n => {
              const cleanText = stripMarkdown(n.content || '')
              return (
                <div key={n.id} className="hover-row" style={{
                  padding: '10px 10px', margin: '0 -6px',
                  borderBottom: `1px solid ${C.borderSoft}`, cursor: 'pointer',
                }} onClick={() => navigate('/notes')}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{n.title || 'Untitled note'}</div>
                  <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 3 }}>
                    {cleanText.slice(0, 65)}{cleanText.length > 65 ? '…' : ''}
                  </div>
                </div>
              )
            })
          )}
        </Card>
      </div>

      {/* Quick Action Tiles */}
      <div>
        <SectionTitle icon={Lightning} color={C.amber}>Quick study actions</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {quickActions.map(a => {
            const Icon = a.icon
            return (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="hover-lift"
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '14px 16px', borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  background: 'var(--bg-card, #101c17)',
                  color: C.text,
                  cursor: 'pointer',
                  fontFamily: fonts.heading,
                  fontSize: 13, fontWeight: 600,
                  textAlign: 'left',
                  transition: 'border-color 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = tint(typeof a.color === 'string' && a.color.startsWith('var(') ? '#10b981' : a.color, 0.45) }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border }}
              >
                <div style={iconBox(typeof a.color === 'string' && a.color.startsWith('var(') ? '#10b981' : a.color, 32)}>
                  <Icon size={18} weight="duotone" />
                </div>
                <span>{a.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
