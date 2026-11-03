import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpinnerGap, ArrowClockwise, Play } from '@phosphor-icons/react'
import { useAuthStore, useAssignmentsStore, useGradesStore, useNotesStore, useXPStore, useUIStore, usePomodoroStore, pctToGPA, calcStreak } from '../stores'
import { hasClientKey, callGeminiClient, getKeyProvider } from '../utils/gemini'
import { C, fonts } from '../utils/theme'
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
      const focusToday = dailyFocusLog?.[todayKey] || 0

      const context = `Student: ${name}, Level ${xpLevel?.level || 1}, ${xp} XP.
Assignments due today: ${dueToday}. Due this week: ${dueThisWeek}.
Total notes: ${noteCount}. Focus streak: ${focusStreak} days. ${focusToday} min focused today.
Subjects: Physics, Chemistry, Mathematics, Biology, English (CBSE Class 11).
Upcoming assignments: ${upcoming.slice(0, 3).map(a => `${a.title} (${a.course || a.courseName}, ${Math.ceil((new Date(a.dueDate) - new Date()) / 86400000)}d left)`).join('; ') || 'None'}`

      const prompt = `You are StudyPulse's session planner. Based on the telemetry below, write a SHORT daily brief (4-5 lines max).

Rules:
- Line 1: the single highest-priority item for today and why (deadline or weight).
- Line 2-3: what to focus on, referencing the student's actual data.
- Line 4: one concrete, specific study action (not generic advice).
- No emojis. No markdown headers. No pleasantries. Flowing text only.

Student telemetry:
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
    { label: 'Start Focus Mode', path: '/focus' },
    { label: 'Take a Quiz', path: '/quiz' },
    { label: 'Review Flashcards', path: '/flashcards' },
    { label: 'Check Grades', path: '/grades' },
  ]

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 'min(1280px, 100%)', margin: '0 auto' }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16, marginBottom: 20,
      }}>
        <div>
          <h1 style={{
            fontFamily: fonts.body, fontSize: 18, fontWeight: 600,
            color: C.text, marginBottom: 3, letterSpacing: '-0.02em',
          }}>
            {name}
          </h1>
          <p style={{ fontFamily: fonts.mono, fontSize: 11, color: C.textFaint, fontVariantNumeric: 'tabular-nums' }}>
            {today} · <span style={{ color: todayAssignments.length > 0 ? C.warning : C.success }}>
              {todayAssignments.length} due today
            </span> · {streak}d streak
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/assistant')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 4,
              background: C.fill, color: C.fillText,
              border: 'none', cursor: 'pointer',
              fontFamily: fonts.body, fontSize: 12.5, fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Ask Tutor
          </button>
          <button
            onClick={() => navigate('/focus')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 4,
              background: 'transparent', color: C.text,
              border: `1px solid ${C.border}`, cursor: 'pointer',
              fontFamily: fonts.body, fontSize: 12.5, fontWeight: 500,
            }}
          >
            Focus
          </button>
        </div>
      </div>

      {/* XP progress — hairline meter */}
      <div style={{
        border: `1px solid ${C.border}`, borderRadius: 4,
        background: C.card, padding: '12px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{
          fontFamily: fonts.mono, fontSize: 11, fontWeight: 500,
          color: C.text, letterSpacing: '0.02em', whiteSpace: 'nowrap',
        }}>
          L{xpLevel?.level || 1} · {xpLevel?.title || 'Freshman'}
        </span>
        <div style={{ flex: 1, height: 4, background: C.cardSoft, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(100, Math.max(0, xpPct))}%`,
            background: C.text, borderRadius: 2, transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{
          fontFamily: fonts.mono, fontSize: 10.5, color: C.textFaint,
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
        }}>
          {xp} XP{xpNext ? ` · ${xpToNext - (xp - xpLevel.min)} to L${(xpLevel?.level || 1) + 1}` : ' · max'}
        </span>
      </div>

      {/* Stats — hairline grid cells */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard
          label="Due today"
          value={todayAssignments.length}
          status={todayAssignments.length > 0 ? 'warning' : 'success'}
        />
        <StatCard label="GPA" value={currentGPA} />
        <StatCard label="Notes" value={notes?.length || 0} />
        <StatCard
          label="Completed"
          value={(assignments || []).filter(a => a.completed).length}
          status="success"
        />
      </div>

      {/* Daily brief */}
      {hasClientKey() && (
        <div style={{
          marginBottom: 20, borderRadius: 4,
          background: C.card, border: `1px solid ${C.border}`,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', borderBottom: `1px solid ${C.borderSoft}`,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="dot dot-success" />
              <span className="metric-label" style={{ padding: 0 }}>Daily brief</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint }}>
                {getKeyProvider()}
              </span>
            </span>
            <button
              onClick={generateBrief}
              disabled={briefLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 9px', borderRadius: 3,
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.textMuted, fontSize: 11, cursor: briefLoading ? 'wait' : 'pointer',
                fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.04em',
                transition: 'color 0.12s ease, background 0.12s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.cardHover }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = 'transparent' }}
            >
              {briefLoading ? <SpinnerGap size={11} className="spin" weight="bold" /> : <ArrowClockwise size={11} weight="bold" />}
              {briefLoading ? 'RUNNING' : 'REFRESH'}
            </button>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {dailyBrief ? (
              <p style={{ fontSize: 13, lineHeight: 1.65, color: C.text }}>
                {dailyBrief}
              </p>
            ) : briefLoading ? (
              <p style={{ fontFamily: fonts.mono, fontSize: 11, color: C.textFaint }}>
                Generating from session telemetry…
              </p>
            ) : (
              <p style={{ fontFamily: fonts.body, fontSize: 12.5, color: C.textFaint }}>
                Add an API key in Settings to enable the daily brief.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dual columns */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Upcoming deadlines — tabular rows */}
        <div style={{
          borderRadius: 4, background: C.card, border: `1px solid ${C.border}`, padding: '14px 16px',
        }}>
          <SectionTitle
            action={
              <button onClick={() => navigate('/assignments')} style={{
                fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer',
              }}>All →</button>
            }
          >Upcoming deadlines</SectionTitle>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
              <p style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 12 }}>
                {connected ? 'No pending assignments.' : 'Sync Google Classroom or add assignments.'}
              </p>
              <button onClick={handleSync} disabled={syncing} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 4, border: 'none',
                background: '#ffffff', color: '#09090B', cursor: syncing ? 'not-allowed' : 'pointer',
                fontFamily: fonts.body, fontSize: 12.5, fontWeight: 600,
              }}>
                <GoogleLogo size={14} /> {syncing ? 'Syncing…' : connected ? 'Sync Classroom' : 'Connect Classroom'}
              </button>
            </div>
          ) : (
            upcoming.map(a => {
              const due = new Date(a.dueDate)
              const daysLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24))
              const urgency = daysLeft <= 1 ? 'error' : daysLeft <= 3 ? 'warning' : 'neutral'
              return (
                <div key={a.id} className="hover-row" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 8px', margin: '0 -8px',
                  borderBottom: `1px solid ${C.borderSoft}`,
                }}>
                  <span className={`dot dot-${urgency}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.title}
                    </div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textFaint }}>
                      {a.course || a.courseName}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                    color: daysLeft <= 1 ? C.error : C.textMuted,
                    whiteSpace: 'nowrap',
                  }}>
                    {daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? '+1D' : `${daysLeft}D`}
                  </span>
                  <button
                    onClick={() => {
                      // Store expects the assignment object, not an id.
                      usePomodoroStore.getState().setActiveAssignment(a)
                      navigate('/focus')
                    }}
                    title="Focus on this assignment"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 3,
                      background: 'transparent',
                      border: `1px solid ${C.borderSoft}`,
                      color: C.textMuted, cursor: 'pointer',
                      fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.04em',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                  >
                    <Play size={9} weight="fill" /> FOCUS
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Recent notes */}
        <div style={{
          borderRadius: 4, background: C.card, border: `1px solid ${C.border}`, padding: '14px 16px',
        }}>
          <SectionTitle
            action={
              <button onClick={() => navigate('/notes')} style={{
                fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer',
              }}>All →</button>
            }
          >Recent notes</SectionTitle>
          {recentNotes.length === 0 ? (
            <p style={{ fontSize: 12.5, color: C.textMuted, textAlign: 'center', padding: '20px 0' }}>
              No notes yet.
            </p>
          ) : (
            recentNotes.map(n => {
              const cleanText = stripMarkdown(n.content || '')
              return (
                <div key={n.id} className="hover-row" style={{
                  padding: '8px 8px', margin: '0 -8px',
                  borderBottom: `1px solid ${C.borderSoft}`, cursor: 'pointer',
                }} onClick={() => navigate('/notes')}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text }}>{n.title || 'Untitled'}</div>
                  <div style={{ fontFamily: fonts.body, fontSize: 11.5, color: C.textFaint, marginTop: 2 }}>
                    {cleanText.slice(0, 65)}{cleanText.length > 65 ? '…' : ''}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Quick actions — flat command row */}
      <div>
        <SectionTitle>Quick actions</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {quickActions.map(a => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="hover-lift"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px', borderRadius: 4,
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.text,
                cursor: 'pointer',
                fontFamily: fonts.body,
                fontSize: 12.5, fontWeight: 500,
                textAlign: 'left',
                transition: 'background 0.13s ease, border-color 0.13s ease',
              }}
            >
              <span>{a.label}</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 11, color: C.textFaint }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
