import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpinnerGap, ArrowClockwise, Play, ArrowRight, Sparkle } from '@phosphor-icons/react'
import { useAuthStore, useAssignmentsStore, useGradesStore, useNotesStore, useXPStore, useUIStore, usePomodoroStore, useLearnerStore, pctToGPA, calcStreak } from '../stores'
import { hasClientKey, callGeminiClient, getKeyProvider } from '../utils/gemini'
import { selectDueItems, statusDot, statusLabel } from '../utils/learnerEngine'
import { C, fonts, btnPrimary, btnAmber, btnGhost } from '../utils/theme'
import { StatCard, SectionTitle } from '../components/ui'
import Book3D, { SUBJECT_ART } from '../components/Book3D'
import { getLastRead } from './Library'
import { getLearnerChapters } from '../utils/cbseSubjects'
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

// ── LED focus telemetry matrix ────────────────────────────────

function LedMatrix({ dailyFocusLog, days = 14 }) {
  const cells = useMemo(() => {
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      out.push({ key, mins: dailyFocusLog?.[key] || 0, label: d.toLocaleDateString('en-US', { weekday: 'short' }) })
    }
    return out
  }, [dailyFocusLog, days])

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
      {cells.map((c, i) => (
        <div key={c.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }} title={`${c.label}: ${c.mins} min focused`}>
          <span
            className={`led ${c.mins === 0 ? 'off' : c.mins >= 30 ? 'green' : ''} ${i === cells.length - 1 ? 'live' : ''}`}
            style={{ opacity: c.mins === 0 ? 1 : Math.min(1, 0.45 + c.mins / 45), height: c.mins >= 30 ? 22 : c.mins > 0 ? 18 : 12 }}
          />
          <span style={{ fontFamily: fonts.mono, fontSize: 7.5, color: C.textFaint, letterSpacing: '0.04em' }}>
            {c.label[0]}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user, isGoogleConnected, loginWithGoogle } = useAuthStore()
  const { assignments, courses, syncClassroom, syncing } = useAssignmentsStore()
  const { addToast, aiChatOpen, toggleAIChat } = useUIStore()
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
  const daypart = hour < 12 ? 'early' : hour < 17 ? 'deep in the day' : 'late'
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
  const sessionCount = usePomodoroStore((s) => s.sessionCount)

  // Learner memory
  const learnerChapters = useLearnerStore((s) => s.chapters)
  const noticedRaw = useLearnerStore((s) => s.noticedMisconceptions)
  const { markMisconceptionResolved, dismissMisconception } = useLearnerStore()
  const dueRefresh = useMemo(() => selectDueItems(learnerChapters).slice(0, 3), [learnerChapters])
  const noticedOpen = useMemo(
    () => noticedRaw.filter((m) => !m.resolved && !m.dismissed).slice(0, 3),
    [noticedRaw]
  )

  // ── Hero: next best action ──
  const lastRead = useMemo(() => {
    const lr = getLastRead()
    if (!lr) return null
    const ch = getLearnerChapters().find((c) => c.id === lr.chapterId)
    return ch ? { ...ch, page: lr.page } : null
  }, [])

  const nextDue = upcoming[0]
  const heroChapter = lastRead
  const heroSubjectKey =
    heroChapter?.subject === 'Physics' ? 'physics'
    : heroChapter?.subject === 'Chemistry' ? 'chemistry'
    : heroChapter?.subject === 'Mathematics' ? 'maths'
    : heroChapter?.subject === 'Computer Science' ? 'cs'
    : heroChapter?.subject === 'English' ? 'english'
    : 'science'

  const [askText, setAskText] = useState('')
  const askAI = () => {
    const q = askText.trim()
    if (!q) { toggleAIChat(); return }
    window.dispatchEvent(new CustomEvent('studypulse-ai-prefill', { detail: { text: q } }))
    if (!aiChatOpen) toggleAIChat()
    setAskText('')
  }

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
      const prompt = `You are StudyPulse's session planner. Based on the telemetry below, write a SHORT daily brief (4-5 lines max). Line 1: the single highest-priority item for today. Lines 2-3: what to focus on using the student's actual data. Line 4: one concrete action. No emojis, no headers, flowing text.

Telemetry: ${name}, Level ${xpLevel?.level || 1}, ${xp} XP. Due today: ${todayAssignments.length}. This week: ${upcoming.length} upcoming. Notes: ${notes?.length || 0}. Focus streak: ${streak} days.`
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

  useEffect(() => {
    if (!dailyBrief && hasClientKey() && !briefLoading) generateBrief()
  }, []) // eslint-disable-line

  return (
    <div style={{ fontFamily: fonts.body, color: C.text }}>
      {/* ═══ Hero: next-best-action stage ═══ */}
      <div style={{
        position: 'relative',
        borderRadius: 22,
        background: 'linear-gradient(150deg, rgba(30,53,43,0.75), rgba(14,24,19,0.9))',
        border: `1px solid ${C.border}`,
        boxShadow: '0 24px 60px rgba(30,25,15,0.4), inset 0 1px 0 rgba(244,240,234,0.07)',
        padding: '30px 34px',
        marginBottom: 20,
        overflow: 'hidden',
      }}>
        {/* Horizon backlight */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: -60, height: 140,
          background: 'radial-gradient(600px 130px at 30% 100%, rgba(245,158,11,0.22), transparent 70%), radial-gradient(600px 130px at 75% 100%, rgba(16,185,129,0.22), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', gap: 30, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
          {heroChapter && (
            <Book3D
              title={heroChapter.title}
              subject={heroChapter.subject}
              subjectKey={heroSubjectKey}
              classLevel={heroChapter.classLevel}
              size="md"
              onOpen={() => navigate(`/read/${heroChapter.id}`)}
            />
          )}
          <div style={{ flex: 1, minWidth: 280 }}>
            <span className="metric-label" style={{ padding: 0 }}>
              {today} · studying {daypart}, {name}?
            </span>
            <h1 className="editorial" style={{
              fontSize: 40, lineHeight: 1.05, margin: '8px 0 6px',
              color: C.text, textShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}>
              What should you do next?
            </h1>
            <p style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 16, maxWidth: 460 }}>
              {heroChapter
                ? <>Pick up <strong style={{ color: C.text }}>{heroChapter.title}</strong> where you left off — page {heroChapter.page} is waiting{streak > 0 ? `, and your ${streak}-day streak is alive` : ''}.</>
                : nextDue
                  ? <>Nearest deadline: <strong style={{ color: C.text }}>{nextDue.title}</strong>. Open the Library to start reading, or run a Quiz Me.</>
                  : <>Open the Library and open your first chapter — StudyPulse remembers where you get stuck.</>}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              {heroChapter && (
                <button onClick={() => navigate(`/read/${heroChapter.id}`)} style={btnPrimary}>
                  <Play size={13} weight="fill" /> Continue reading
                </button>
              )}
              <button onClick={() => navigate('/quiz')} style={btnAmber}>
                <Sparkle size={13} weight="duotone" /> Start quiz
              </button>
              {!connected && (
                <button onClick={handleSync} style={btnGhost}>
                  <GoogleLogo size={13} /> Connect Classroom
                </button>
              )}
            </div>
            {/* Ask bar */}
            <div
              onClick={() => document.getElementById('home-ask')?.focus()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                maxWidth: 520, padding: '5px 5px 5px 16px', borderRadius: 999,
                background: 'rgba(12,20,16,0.7)', border: `1px solid ${C.border}`,
              }}
            >
              <input
                id="home-ask"
                value={askText}
                onChange={(e) => setAskText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') askAI() }}
                placeholder="Ask StudyPulse anything, or type a homework question…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: C.text, fontFamily: fonts.body, fontSize: 13,
                }}
              />
              <button onClick={askAI} style={{
                padding: '8px 18px', borderRadius: 999,
                background: C.fill, color: C.fillText, border: 'none',
                fontFamily: fonts.body, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                Ask
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LED focus telemetry matrix ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 18, flexWrap: 'wrap',
        borderRadius: 16, padding: '14px 20px', marginBottom: 20,
        background: 'rgba(12,20,16,0.75)', border: `1px solid ${C.borderSoft}`,
      }}>
        <div>
          <div className="metric-label" style={{ padding: 0, marginBottom: 8 }}>Focus telemetry · last 14 days</div>
          <LedMatrix dailyFocusLog={dailyFocusLog} />
        </div>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          {[
            { v: `${streak}d`, l: 'STREAK' },
            { v: sessionCount, l: 'SESSIONS' },
            { v: `${xp}`, l: 'XP' },
            { v: `L${xpLevel?.level || 1}`, l: 'LEVEL' },
          ].map((s) => (
            <div key={s.l}>
              <div style={{ fontFamily: fonts.mono, fontSize: 19, fontWeight: 700, color: C.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {s.v}
              </div>
              <div className="metric-label" style={{ padding: 0, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* XP bar */}
        <div style={{ minWidth: 160 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="metric-label" style={{ padding: 0 }}>{xpLevel?.title || 'Freshman'}</span>
            <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>
              {xpNext ? `${xpToNext - (xp - xpLevel.min)} to L${(xpLevel?.level || 1) + 1}` : 'max'}
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, xpPct)}%`, background: 'linear-gradient(90deg, #10B981, #6EE7B7)', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* ═══ Learner memory — tactile refresh + noticed cards ═══ */}
      {(dueRefresh.length > 0 || noticedOpen.length > 0) && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* Refresh queue */}
          <div style={{
            borderRadius: 16, padding: '16px 18px',
            background: C.card, backdropFilter: 'blur(24px)', border: `1px solid ${C.border}`,
            boxShadow: '0 14px 36px rgba(30,25,15,0.28)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="dot dot-warning" />
                <span className="metric-label" style={{ padding: 0 }}>Refresh · brought back before you forget</span>
              </span>
              <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint }}>{dueRefresh.length} due</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dueRefresh.map((d) => (
                <div key={`due-${d.key}-${d.conceptName}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10,
                  background: 'rgba(20,32,27,0.55)', border: `1px solid ${C.borderSoft}`,
                }}>
                  <span className={`badge3d ${d.status}`} style={{ fontSize: 9, padding: '3px 8px' }}>
                    {statusLabel(d.status)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text }}>
                      Can you still recall {d.conceptName}?
                    </div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>
                      {d.chapterTitle} · due now
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/quiz')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 12px', borderRadius: 999, flexShrink: 0,
                      background: C.fill, color: C.fillText, border: 'none',
                      fontFamily: fonts.body, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Refresh now <ArrowRight size={10} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* What StudyPulse Noticed */}
          <div style={{
            borderRadius: 16, padding: '16px 18px',
            background: C.card, backdropFilter: 'blur(24px)', border: `1px solid ${C.border}`,
            boxShadow: '0 14px 36px rgba(30,25,15,0.28)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="dot dot-error" />
                <span className="metric-label" style={{ padding: 0 }}>What StudyPulse has noticed</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {noticedOpen.map((m) => (
                <div key={m.id} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(20,32,27,0.55)', border: `1px solid ${C.borderSoft}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <span className="badge3d needs_attention" style={{ fontSize: 9, padding: '3px 8px' }}>
                      {m.conceptName}
                    </span>
                    <span style={{ fontFamily: fonts.mono, fontSize: 9, color: C.textFaint }}>{m.chapterTitle}</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.55 }}>{m.correctiveRule}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={() => navigate('/quiz')} style={{
                      padding: '3px 11px', borderRadius: 999,
                      background: C.cardHover, border: `1px solid ${C.border}`,
                      color: C.text, cursor: 'pointer', fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
                    }}>Practise this</button>
                    <button onClick={() => dismissMisconception(m.id)} style={{
                      padding: '3px 9px', borderRadius: 999,
                      background: 'transparent', border: `1px solid ${C.borderSoft}`,
                      color: C.textFaint, cursor: 'pointer', fontFamily: fonts.body, fontSize: 11,
                    }}>This isn't right</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Stats ═══ */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Due today" value={todayAssignments.length} status={todayAssignments.length > 0 ? 'warning' : 'success'} />
        <StatCard label="GPA" value={currentGPA} />
        <StatCard label="Notes" value={notes?.length || 0} />
        <StatCard label="Completed" value={(assignments || []).filter(a => a.completed).length} status="success" />
      </div>

      {/* ═══ Columns: deadlines + notes ═══ */}
      <div className="grid-2" style={{ marginBottom: 22 }}>
        <div style={{
          borderRadius: 16, padding: '14px 18px',
          background: C.card, backdropFilter: 'blur(24px)', border: `1px solid ${C.border}`,
        }}>
          <SectionTitle action={
            <button onClick={() => navigate('/assignments')} style={{
              fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer',
            }}>All →</button>
          }>Upcoming deadlines</SectionTitle>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
              <p style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 12 }}>
                {connected ? 'No pending assignments.' : 'Sync Google Classroom or add assignments.'}
              </p>
              <button onClick={handleSync} disabled={syncing} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 999, border: 'none',
                background: '#F4F0EA', color: '#232019', cursor: syncing ? 'not-allowed' : 'pointer',
                fontFamily: fonts.body, fontSize: 12.5, fontWeight: 700,
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
                    color: daysLeft <= 1 ? C.error : C.textMuted, whiteSpace: 'nowrap',
                  }}>
                    {daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? '+1D' : `${daysLeft}D`}
                  </span>
                  <button
                    onClick={() => {
                      usePomodoroStore.getState().setActiveAssignment(a)
                      navigate('/focus')
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 9px', borderRadius: 999,
                      background: 'transparent', border: `1px solid ${C.borderSoft}`,
                      color: C.textMuted, cursor: 'pointer',
                      fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: '0.06em',
                    }}
                  >
                    <Play size={9} weight="fill" /> FOCUS
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div style={{
          borderRadius: 16, padding: '14px 18px',
          background: C.card, backdropFilter: 'blur(24px)', border: `1px solid ${C.border}`,
        }}>
          <SectionTitle action={
            <button onClick={() => navigate('/notes')} style={{
              fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer',
            }}>All →</button>
          }>Recent notes</SectionTitle>
          {recentNotes.length === 0 ? (
            <p style={{ fontSize: 12.5, color: C.textMuted, textAlign: 'center', padding: '20px 0' }}>
              No notes yet — the reader can save highlights straight into Notes.
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

      {/* ═══ Daily brief ═══ */}
      {hasClientKey() && (
        <div style={{
          borderRadius: 16, padding: '14px 18px',
          background: C.card, backdropFilter: 'blur(24px)', border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="dot dot-success" />
              <span className="metric-label" style={{ padding: 0 }}>Daily brief</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>{getKeyProvider()}</span>
            </span>
            <button
              onClick={generateBrief}
              disabled={briefLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 999,
                background: 'transparent', border: `1px solid ${C.borderSoft}`,
                color: C.textMuted, cursor: briefLoading ? 'wait' : 'pointer',
                fontFamily: fonts.mono, fontSize: 10,
              }}
            >
              {briefLoading ? <SpinnerGap size={11} className="spin" /> : <ArrowClockwise size={11} />}
              {briefLoading ? 'RUNNING' : 'REFRESH'}
            </button>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: C.text, margin: 0 }}>
            {dailyBrief || (briefLoading ? 'Generating from session telemetry…' : 'Add an API key in Settings to enable the daily brief.')}
          </p>
        </div>
      )}
    </div>
  )
}
