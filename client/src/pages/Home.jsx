import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkle, Play, CaretUp, ArrowClockwise, SpinnerGap } from '@phosphor-icons/react'
import { useAuthStore, useAssignmentsStore, useGradesStore, useNotesStore, useXPStore, useUIStore, usePomodoroStore, useLearnerStore, pctToGPA, calcStreak } from '../stores'
import { hasClientKey, callGeminiClient, getKeyProvider } from '../utils/gemini'
import { selectDueItems, statusLabel } from '../utils/learnerEngine'
import { C, fonts, btnPrimary, btnAmber } from '../utils/theme'
import Book3D, { SUBJECT_ART } from '../components/Book3D'
import { getLastRead } from './Library'
import { getLearnerChapters } from '../utils/cbseSubjects'
import { useExamStore, examReadiness, buildDailyQueue } from '../stores/examStore'

// ── LED focus telemetry (lives in the collapsible drawer) ─────

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
          <span style={{ fontFamily: fonts.mono, fontSize: 7.5, color: C.textFaint }}>{c.label[0]}</span>
        </div>
      ))}
    </div>
  )
}

function ReadinessCard() {
  const exams = useExamStore((s) => s.exams)
  const learnerChapters = useLearnerStore((s) => s.chapters)
  const navigate = useNavigate()
  const exam = exams[0]
  if (!exam) return null
  const readiness = examReadiness(exam, learnerChapters)
  const { tasks } = buildDailyQueue(exam, learnerChapters)
  const bandColor = readiness.band.label === 'At Risk' ? 'var(--md-error)' : readiness.band.label === 'On track' ? 'var(--md-primary)' : '#F59E0B'
  return (
    <div style={{
      borderRadius: 'var(--md-radius-sm)', padding: '15px 17px',
      background: 'var(--md-surface)', border: '1px solid var(--md-outline)',
      boxShadow: 'var(--md-shadow-card)',
      contain: 'layout style paint',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="metric-label" style={{ padding: 0 }}>Exam readiness · {readiness.band.label}</span>
        <button onClick={() => navigate('/study-plans')} style={{ fontFamily: fonts.mono, fontSize: 9.5, color: 'var(--md-text-faint)', background: 'none', border: 'none', cursor: 'pointer' }}>Plan →</button>
      </div>
      <div style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 700, lineHeight: 1, color: bandColor, fontVariantNumeric: 'tabular-nums' }}>
        {readiness.pct}%
      </div>
      <div style={{ height: 4, background: 'var(--md-surface-high)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: Math.min(100, readiness.pct) + '%', background: bandColor, borderRadius: 2 }} />
      </div>
      <div className="metric-label" style={{ padding: 0, margin: '10px 0 6px' }}>Today · {tasks.slice(0, 3).length} micro-tasks</div>
      {tasks.slice(0, 3).map((t) => (
        <div key={t.type + t.chapterId} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 8.5, color: '#F59E0B', width: 74, flexShrink: 0 }}>{t.type} · {t.minutes}M</span>
          <span style={{ flex: 1, fontSize: 11.5, color: 'var(--md-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label.replace(/^(Read|Quiz Me|Refresh|PYQ drill): /, '')}</span>
          <button onClick={() => navigate(t.path)} className="motion-spring" style={{
            padding: '2px 9px', borderRadius: 999, flexShrink: 0,
            background: 'var(--md-primary)', color: 'var(--md-on-primary)', border: 'none',
            fontFamily: fonts.body, fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
          }}>Start</button>
        </div>
      ))}
      <p style={{ fontFamily: fonts.mono, fontSize: 9, color: 'var(--md-text-faint)', margin: '8px 0 0', lineHeight: 1.5 }}>
        From verified concept states — not a mark prediction.
      </p>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToast, aiChatOpen, toggleAIChat } = useUIStore()
  const xpStore = useXPStore()
  const { pct: xpPct, cur: xpLevel, next: xpNext, xpToNext } = xpStore.getProgress()
  const xp = xpStore.xp
  const name = user?.firstName || user?.name?.split(' ')[0] || 'Student'
  const hour = new Date().getHours()
  const daypart = hour < 12 ? 'early' : hour < 17 ? 'deep in the day' : 'late'

  const { dailyFocusLog } = usePomodoroStore()
  const streak = calcStreak(dailyFocusLog || {})
  const sessionCount = usePomodoroStore((s) => s.sessionCount)

  // Learner memory — the only always-visible data on Home
  const learnerChapters = useLearnerStore((s) => s.chapters)
  const noticedRaw = useLearnerStore((s) => s.noticedMisconceptions)
  const { markMisconceptionResolved, dismissMisconception } = useLearnerStore()
  const dueRefresh = useMemo(() => selectDueItems(learnerChapters).slice(0, 3), [learnerChapters])
  const noticedOpen = useMemo(
    () => noticedRaw.filter((m) => !m.resolved && !m.dismissed).slice(0, 3),
    [noticedRaw]
  )
  const noticedCards = useMemo(() => {
    const cards = []
    for (const d of dueRefresh) {
      cards.push({
        kind: 'refresh',
        id: `due-${d.key}-${d.conceptName}`,
        title: `Can you still recall ${d.conceptName}?`,
        meta: `${d.chapterTitle} · ${statusLabel(d.status)} · due now`,
        status: d.status,
        action: () => navigate('/quiz'),
        actionLabel: 'Refresh now',
      })
    }
    for (const m of noticedOpen.slice(0, Math.max(0, 3 - cards.length))) {
      cards.push({
        kind: 'noticed',
        id: m.id,
        title: m.correctiveRule,
        meta: `${m.chapterTitle} · ${m.conceptName}`,
        status: 'needs_attention',
        action: () => navigate('/quiz'),
        actionLabel: 'Practise this',
        misconceptions: m,
      })
    }
    return cards.slice(0, 3)
  }, [dueRefresh, noticedOpen]) // eslint-disable-line

  // Hero: last-read chapter
  const lastRead = useMemo(() => {
    const lr = getLastRead()
    if (!lr) return null
    const ch = getLearnerChapters().find((c) => c.id === lr.chapterId)
    return ch ? { ...ch, page: lr.page } : null
  }, [])
  const heroSubjectKey =
    lastRead?.subject === 'Physics' ? 'physics'
    : lastRead?.subject === 'Chemistry' ? 'chemistry'
    : lastRead?.subject === 'Mathematics' ? 'maths'
    : lastRead?.subject === 'Computer Science' ? 'cs'
    : lastRead?.subject === 'English' ? 'english'
    : 'science'

  // Subjects shelf
  const shelfSubjects = useMemo(() => {
    const chapters = getLearnerChapters()
    const bySubject = new Map()
    for (const ch of chapters) {
      if (!bySubject.has(ch.subject)) bySubject.set(ch.subject, ch)
    }
    const ART = { Physics: 'physics', Chemistry: 'chemistry', Mathematics: 'maths', 'Computer Science': 'cs', Science: 'science', English: 'english' }
    return [...bySubject.entries()].map(([subject, ch]) => ({
      subject, chapter: ch, artKey: ART[subject] || 'science',
    }))
  }, [])

  const [askText, setAskText] = useState('')
  const askAI = () => {
    const q = askText.trim()
    if (!q) { toggleAIChat(); return }
    window.dispatchEvent(new CustomEvent('studypulse-ai-prefill', { detail: { text: q } }))
    if (!aiChatOpen) toggleAIChat()
    setAskText('')
  }

  // Collapsible secondary drawer — stats live here, never on the main view
  const [showStats, setShowStats] = useState(false)
  const { assignments, courses } = useAssignmentsStore()
  const { calculateCourseGrade, courseGrades } = useGradesStore()
  const { notes } = useNotesStore()
  const { isGoogleConnected, loginWithGoogle, syncClassroom } = useAuthStore()
  const { syncing } = useAssignmentsStore()

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

  const dueSoon = useMemo(() => {
    return (assignments || [])
      .filter(a => !a.completed && new Date(a.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3)
  }, [assignments])

  const handleSync = async () => {
    if (!isGoogleConnected()) { navigate('/settings'); return }
    try {
      const r = await syncClassroom()
      addToast({ type: 'success', message: `Synced ${r.courses} courses · ${r.assignments} assignments` })
    } catch (e) {
      if (e?.name === 'ClassroomAuthError') { addToast({ type: 'error', message: 'Google session expired — reconnecting…' }); loginWithGoogle().catch(() => {}) }
      else addToast({ type: 'error', message: e?.message || 'Classroom sync failed' })
    }
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, alignItems: 'start' }}>
      <div style={{ gridColumn: 'span 8', minWidth: 0 }}>
      {/* ═══ 1. Primary Hero — What should you do next? ═══ */}
      <div style={{
        position: 'relative',
        borderRadius: 22,
        background: 'linear-gradient(150deg, rgba(30,53,43,0.6), rgba(14,24,19,0.9))',
        border: `1px solid ${C.border}`,
        boxShadow: '0 18px 44px rgba(0,0,0,0.4)',
        padding: '34px 38px',
        marginBottom: 18,
        overflow: 'hidden',
        contain: 'layout style paint',
        transform: 'translateZ(0)',
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: -60, height: 140,
          background: 'radial-gradient(600px 130px at 30% 100%, rgba(245,158,11,0.18), transparent 70%), radial-gradient(600px 130px at 75% 100%, color-mix(in srgb, var(--md-primary) 18%, transparent), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', gap: 34, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
          {lastRead && (
            <Book3D
              title={lastRead.title}
              subject={lastRead.subject}
              subjectKey={heroSubjectKey}
              classLevel={lastRead.classLevel}
              size="md"
              onOpen={() => navigate(`/read/${lastRead.id}`)}
            />
          )}
          <div style={{ flex: 1, minWidth: 280 }}>
            <span className="metric-label" style={{ padding: 0 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · studying {daypart}, {name}?
            </span>
            <h1 className="editorial" style={{
              fontSize: 42, lineHeight: 1.05, margin: '8px 0 6px',
              color: C.text, textShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}>
              What should you do next?
            </h1>
            <p style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 16, maxWidth: 480 }}>
              {lastRead
                ? <>Pick up <strong style={{ color: C.text }}>{lastRead.title}</strong> at page {lastRead.page}{streak > 0 ? <> — your <strong style={{ color: C.primaryBright }}>{streak}-day streak</strong> is alive</> : ''}. StudyPulse has lined up exactly what to do.</>
                : <>Open a chapter from your shelf below — StudyPulse remembers where you get stuck and brings it back before you forget.</>}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              {lastRead && (
                <button onClick={() => navigate(`/read/${lastRead.id}`)} className="motion-spring" style={btnPrimary}>
                  <Play size={13} weight="fill" /> Continue reading
                </button>
              )}
              <button onClick={() => navigate('/quiz')} className="motion-spring" style={btnAmber}>
                <Sparkle size={13} weight="duotone" /> Start quiz
              </button>
            </div>
            {/* Ask bar */}
            <div
              onClick={() => document.getElementById('home-ask')?.focus()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                maxWidth: 520, padding: '5px 5px 5px 16px', borderRadius: 999,
                background: 'rgba(12,20,16,0.75)', border: `1px solid ${C.border}`,
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
              <button onClick={askAI} className="motion-spring" style={{
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

      {/* ═══ 2. Noticed & Refresh row — max 3 calm cards ═══ */}
      {noticedCards.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginBottom: 18 }}>
          {noticedCards.map((card) => (
            <div key={card.id} style={{
              borderRadius: 16, padding: '15px 17px',
              background: 'var(--md-surface)', border: `1px solid ${C.border}`,
              boxShadow: '0 10px 26px rgba(0,0,0,0.32)',
              contain: 'layout style paint',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                <span className={`badge3d ${card.status}`} style={{ fontSize: 9.5, padding: '3px 10px' }}>
                  {card.kind === 'refresh' ? 'Due for refresh' : 'StudyPulse noticed'}
                </span>
                {card.kind === 'noticed' && (
                  <button
                    onClick={() => dismissMisconception(card.misconceptions.id)}
                    title="This isn't right"
                    style={{
                      background: 'transparent', border: `1px solid ${C.borderSoft}`,
                      borderRadius: 999, color: C.textFaint, cursor: 'pointer',
                      fontFamily: fonts.body, fontSize: 10.5, padding: '2px 9px',
                    }}
                  >
                    Not right
                  </button>
                )}
              </div>
              <p style={{ fontSize: 13, color: C.text, lineHeight: 1.55, margin: '0 0 4px', minHeight: 36 }}>
                {card.title}
              </p>
              <p style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, margin: '0 0 12px' }}>
                {card.meta}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={card.action}
                  className="motion-spring"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 13px', borderRadius: 999,
                    background: card.kind === 'refresh' ? C.fill : C.cardHover,
                    color: card.kind === 'refresh' ? C.fillText : C.text,
                    border: card.kind === 'refresh' ? 'none' : `1px solid ${C.border}`,
                    fontFamily: fonts.body, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {card.actionLabel} <ArrowRight size={10} weight="bold" />
                </button>
                {card.kind === 'noticed' && (
                  <button
                    onClick={() => markMisconceptionResolved(card.misconceptions.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 999,
                      background: 'transparent', border: `1px solid ${C.borderSoft}`,
                      color: C.textFaint, cursor: 'pointer', fontFamily: fonts.body, fontSize: 11,
                    }}
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          borderRadius: 16, padding: '16px 20px', marginBottom: 18,
          background: 'var(--md-surface)', border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span className="dot dot-success" />
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
            Nothing due, nothing noticed. Run a <button onClick={() => navigate('/quiz')} style={{ background: 'none', border: 'none', color: C.primaryBright, cursor: 'pointer', font: 'inherit', fontWeight: 600 }}>Quiz Me</button> to map what you know.
          </p>
        </div>
      )}

      </div>

      {/* Right rail — subjects shelf + exam readiness */}
      <div style={{ gridColumn: 'span 4', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ═══ 3. Your Subjects Shelf — jump straight in ═══ */}
      <div style={{
        borderRadius: 20, padding: '20px 24px 8px',
        background: 'linear-gradient(180deg, rgba(16,26,21,0.9), rgba(12,20,16,0.95))',
        border: `1px solid ${C.border}`,
        contain: 'layout style paint',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="editorial" style={{ fontSize: 22, margin: 0, color: C.text }}>Your subjects</h2>
          <button onClick={() => navigate('/library')} style={{
            fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer',
          }}>Full library →</button>
        </div>
        <p style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint, marginBottom: 10 }}>
          Click a book to open it — hover to feel the spine
        </p>
        <div style={{
          display: 'flex', gap: 18, alignItems: 'flex-end',
          overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'thin',
        }}>
          {shelfSubjects.map((s) => (
            <Book3D
              key={s.subject}
              title={s.subject}
              subject={s.subject}
              subjectKey={s.artKey}
              classLevel={s.chapter.classLevel}
              size="sm"
              onOpen={() => navigate(`/read/${s.chapter.id}`)}
            />
          ))}
        </div>
      </div>

      <ReadinessCard />
      </div>
      </div>

      {/* ═══ Collapsible secondary drawer — stats & telemetry ═══ */}
      <div style={{ marginTop: 18, borderRadius: 16, border: `1px solid ${C.borderSoft}`, background: 'rgba(19,28,24,0.7)' }}>
        <button
          onClick={() => setShowStats((v) => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 18px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: C.textMuted,
          }}
        >
          <span className="metric-label" style={{ padding: 0 }}>
            Stats & telemetry — streaks, GPA, deadlines, daily brief
          </span>
          <CaretUp size={13} style={{ transform: showStats ? 'none' : 'rotate(180deg)', transition: 'transform 180ms cubic-bezier(0.22,1,0.36,1)' }} />
        </button>
        {showStats && (
          <div style={{ padding: '0 18px 16px', animation: 'studypulseFadeUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
            {/* Telemetry strip */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 18, flexWrap: 'wrap', padding: '12px 14px', marginBottom: 12,
              borderRadius: 12, background: 'rgba(12,20,16,0.75)', border: `1px solid ${C.borderSoft}`,
            }}>
              <div>
                <div className="metric-label" style={{ padding: 0, marginBottom: 8 }}>Focus telemetry · last 14 days</div>
                <LedMatrix dailyFocusLog={dailyFocusLog} />
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                {[
                  { v: `${streak}d`, l: 'STREAK' },
                  { v: sessionCount, l: 'SESSIONS' },
                  { v: `${xp}`, l: 'XP' },
                  { v: `L${xpLevel?.level || 1}`, l: 'LEVEL' },
                ].map((s) => (
                  <div key={s.l}>
                    <div style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: C.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{s.v}</div>
                    <div className="metric-label" style={{ padding: 0, marginTop: 3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ minWidth: 150 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="metric-label" style={{ padding: 0 }}>{xpLevel?.title || 'Freshman'}</span>
                  <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>
                    {xpNext ? `${xpToNext - (xp - xpLevel.min)} to L${(xpLevel?.level || 1) + 1}` : 'max'}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, xpPct)}%`, background: 'linear-gradient(90deg, var(--md-primary), var(--md-primary))', borderRadius: 2 }} />
                </div>
              </div>
            </div>

            {/* Deadlines + GPA + notes row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(12,20,16,0.75)', border: `1px solid ${C.borderSoft}` }}>
                <div className="metric-label" style={{ padding: 0, marginBottom: 8 }}>Due soon</div>
                {dueSoon.length === 0 ? (
                  <p style={{ fontSize: 12, color: C.textFaint, margin: 0 }}>Nothing due — clean slate.</p>
                ) : dueSoon.map((a) => {
                  const daysLeft = Math.ceil((new Date(a.dueDate) - new Date()) / 86400000)
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                      <span className={`dot dot-${daysLeft <= 1 ? 'error' : daysLeft <= 3 ? 'warning' : 'neutral'}`} />
                      <span style={{ flex: 1, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                      <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint }}>{daysLeft <= 0 ? 'TODAY' : `${daysLeft}D`}</span>
                    </div>
                  )
                })}
                {isGoogleConnected() ? (
                  <button onClick={handleSync} disabled={syncing} style={{
                    marginTop: 8, fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.06em',
                    color: C.textMuted, background: 'transparent', border: `1px solid ${C.borderSoft}`,
                    borderRadius: 999, padding: '3px 10px', cursor: 'pointer',
                  }}>
                    {syncing ? 'SYNCING…' : 'RE-SYNC CLASSROOM'}
                  </button>
                ) : null}
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(12,20,16,0.75)', border: `1px solid ${C.borderSoft}` }}>
                <div className="metric-label" style={{ padding: 0, marginBottom: 8 }}>Academic snapshot</div>
                <div style={{ display: 'flex', gap: 18 }}>
                  <div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1 }}>{currentGPA}</div>
                    <div className="metric-label" style={{ padding: 0, marginTop: 3 }}>GPA</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1 }}>{notes?.length || 0}</div>
                    <div className="metric-label" style={{ padding: 0, marginTop: 3 }}>NOTES</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1 }}>{(assignments || []).filter(a => a.completed).length}</div>
                    <div className="metric-label" style={{ padding: 0, marginTop: 3 }}>DONE</div>
                  </div>
                </div>
                <button onClick={() => navigate('/grades')} style={{
                  marginTop: 10, fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.06em',
                  color: C.primaryBright, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                }}>Open grades →</button>
              </div>
              {hasClientKey() && (
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(12,20,16,0.75)', border: `1px solid ${C.borderSoft}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="metric-label" style={{ padding: 0 }}>Daily brief · {getKeyProvider()}</span>
                    <BriefRefresh onDone={setDailyBriefExternal} />
                  </div>
                  <BriefText />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Daily brief helpers (isolated so the drawer stays cheap)
let _briefCacheKey = `studypulse-daily-brief-${new Date().toISOString().split('T')[0]}`
let _briefListeners = new Set()
let _briefValue = (() => { try { return localStorage.getItem(_briefCacheKey) || '' } catch { return '' } })()
let _briefLoadingGlobal = false

function BriefText() {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force((n) => n + 1)
    _briefListeners.add(fn)
    return () => _briefListeners.delete(fn)
  }, [])
  if (_briefLoadingGlobal) return <p style={{ fontFamily: fonts.mono, fontSize: 11, color: C.textFaint, margin: 0 }}>Generating from session telemetry…</p>
  return <p style={{ fontSize: 12.5, lineHeight: 1.6, color: C.textMuted, margin: 0 }}>{_briefValue || 'No brief yet — hit refresh.'}</p>
}

function BriefRefresh({ onDone }) {
  const [loading, setLoading] = useState(false)
  const run = async () => {
    setLoading(true)
    _briefLoadingGlobal = true
    _briefListeners.forEach((fn) => fn())
    try {
      const prompt = `You are StudyPulse's session planner. Write a SHORT daily brief (4-5 lines max). Line 1: the single highest-priority item for today. Lines 2-3: what to focus on. Line 4: one concrete action. No emojis, no headers.`
      const result = await callGeminiClient(prompt, { timeoutMs: 10000 })
      if (result) {
        _briefValue = result
        try { localStorage.setItem(_briefCacheKey, result) } catch {}
        _briefListeners.forEach((fn) => fn())
      }
    } finally {
      _briefLoadingGlobal = false
      setLoading(false)
      _briefListeners.forEach((fn) => fn())
    }
  }
  return (
    <button
      onClick={run}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 999,
        background: 'transparent', border: `1px solid ${C.borderSoft}`,
        color: C.textMuted, cursor: loading ? 'wait' : 'pointer',
        fontFamily: fonts.mono, fontSize: 10,
      }}
    >
      {loading ? <SpinnerGap size={11} className="spin" /> : <ArrowClockwise size={11} />}
      {loading ? 'RUNNING' : 'REFRESH'}
    </button>
  )
}
