import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash, Check, CircleNotch, ArrowRight, Sparkle } from '@phosphor-icons/react'
import { useStudyPlansStore, useLearnerStore, useUIStore } from '../stores'
import { useExamStore, buildDailyQueue, examReadiness } from '../stores/examStore'
import { LEARNER_SYLLABUS } from '../utils/cbseSubjects'
import { STATUS_META } from '../utils/learnerEngine'
import { generateAI } from '../utils/ai'
import { C, fonts, inputStyle, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader, Card, SectionTitle, Empty } from '../components/ui'

const TYPE_OPTIONS = [
  { id: 'unit', label: 'Unit / school test', hint: 'All selected chapters equally' },
  { id: 'board', label: 'Board exam', hint: 'PYQ pattern is a bonus, not the only practice' },
]

export default function StudyPlans() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const learner = useLearnerStore()
  const { plans, addStudyPlan, deleteStudyPlan } = useStudyPlansStore()

  // ── Exam mode state ──
  const exams = useExamStore((s) => s.exams)
  const { addExam, deleteExam, setTaskState, getTaskState } = useExamStore()
  const [form, setForm] = useState({
    subject: LEARNER_SYLLABUS[0]?.subject || 'Science',
    title: '', type: 'unit', date: '', dailyMinutes: 45, chapterIds: [],
  })
  const [creating, setCreating] = useState(false)

  const syllabusSubjects = LEARNER_SYLLABUS.map((s) => ({ subject: s.subject, classLevel: s.classLevel }))
  const formChapters = useMemo(() => {
    const entry = LEARNER_SYLLABUS.find((s) => s.subject === form.subject)
    return entry?.chapters || []
  }, [form.subject])

  const toggleChapter = (id) => {
    setForm((f) => ({
      ...f,
      chapterIds: f.chapterIds.includes(id) ? f.chapterIds.filter((c) => c !== id) : [...f.chapterIds, id],
    }))
  }

  const createExam = () => {
    if (form.chapterIds.length === 0) {
      addToast({ type: 'error', message: 'Select at least one syllabus chapter' })
      return
    }
    if (!form.date) {
      addToast({ type: 'error', message: 'Pick an exam date' })
      return
    }
    setCreating(true)
    const subjectMeta = LEARNER_SYLLABUS.find((s) => s.subject === form.subject)
    addExam({
      title: form.title || `${subjectMeta?.classLevel || ''} ${form.subject} ${form.type === 'board' ? 'board exam' : 'unit test'}`.trim(),
      type: form.type, subject: form.subject, date: form.date,
      dailyMinutes: Number(form.dailyMinutes) || 45, chapterIds: form.chapterIds,
    })
    addToast({ type: 'success', message: 'Exam plan created' })
    setForm((f) => ({ ...f, title: '', chapterIds: [] }))
    setCreating(false)
  }

  // ── Daily queue per exam (live from learner states) ──
  const learnerChapters = useLearnerStore((s) => s.chapters)
  const queues = useMemo(() => {
    void learnerChapters
    return exams.map((exam) => ({ exam, ...buildDailyQueue(exam, learnerChapters) }))
  }, [exams, learnerChapters])

  const taskKey = (examId, task) => `${task.type}-${task.chapterId}`

  // ── Legacy AI weekly plan ──
  const [planSubject, setPlanSubject] = useState('')
  const [planLoading, setPlanLoading] = useState(false)
  const generateWeeklyPlan = async () => {
    if (!planSubject.trim()) return
    setPlanLoading(true)
    try {
      const raw = await generateAI(`Create a 4-week CBSE study plan for "${planSubject}". Return ONLY JSON: {"subject":"...","weeks":[{"week":1,"topic":"...","tasks":["..."]}, ...]}`)
      let parsed = null
      try { parsed = JSON.parse(raw) } catch {}
      if (!parsed?.weeks) {
        parsed = { subject: planSubject, weeks: [
          { week: 1, topic: 'NCERT theory & core concepts', tasks: ['Read chapters 1-2', 'Make a formula/definition sheet', 'Solve worked examples'] },
          { week: 2, topic: 'Exercises & derivations', tasks: ['Complete back exercises', 'Practise derivations', 'Clear doubts'] },
          { week: 3, topic: 'Exemplar & advanced questions', tasks: ['Exemplar problems', 'Chapter quiz', 'Weak-topic revision'] },
          { week: 4, topic: 'PYQs & mock test', tasks: ['5-year PYQs', 'Timed mock', 'Final formula review'] },
        ] }
      }
      addStudyPlan({ subject: parsed.subject || planSubject, weeks: parsed.weeks, createdAt: Date.now() })
      addToast({ type: 'success', message: 'Weekly plan added' })
      setPlanSubject('')
    } finally {
      setPlanLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, width: '100%' }}>
      <PageHeader
        title="Exam Mode"
        subtitle="Plan from verified learner states — honest readiness, micro-tasks every day"
        status={{ kind: 'success', label: `${exams.length} exam${exams.length === 1 ? '' : 's'}` }}
      />

      {/* ── Existing exams + Today queue ── */}
      {queues.map(({ exam, tasks, daysLeft }) => {
        const readiness = examReadiness(exam, learnerChapters)
        const doneCount = tasks.filter((t) => getTaskState(exam.id, taskKey(exam.id, t)) === 'done').length
        return (
          <Card key={exam.id} style={{ marginBottom: 18, padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: `1px solid ${C.borderSoft}`, gap: 10, flexWrap: 'wrap',
            }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>{exam.title}</h2>
                <span style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textFaint }}>
                  {exam.type === 'board' ? 'Board exam' : 'Unit / school test'} · {new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {daysLeft} day{daysLeft > 1 ? 's' : ''} left · {exam.dailyMinutes} min/day
                </span>
              </div>
              <button onClick={() => { deleteExam(exam.id); addToast({ type: 'success', message: 'Exam deleted' }) }} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 3,
                background: 'transparent', border: `1px solid ${C.borderSoft}`,
                color: C.error, cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5,
              }}>
                <Trash size={11} /> Delete
              </button>
            </div>

            {/* Honest readiness */}
            <div style={{
              margin: '14px 18px', padding: '14px 16px',
              background: C.bgSoft, border: `1px solid ${C.borderSoft}`, borderRadius: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span className="metric-label" style={{ padding: 0 }}>Readiness · {readiness.band.label}</span>
                <span style={{
                  fontFamily: fonts.mono, fontSize: 30, fontWeight: 700, lineHeight: 1,
                  color: readiness.band.label === 'At Risk' ? C.error : readiness.band.label === 'On track' ? C.success : C.warning,
                  fontVariantNumeric: 'tabular-nums',
                }}>{readiness.pct}%</span>
                <span style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textFaint }}>
                  {daysLeft} day{daysLeft > 1 ? 's' : ''} to go · {exam.chapterIds.length} chapters · {doneCount}/{tasks.length} tasks done today
                </span>
              </div>
              <div style={{ height: 4, background: C.cardSoft, borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(100, readiness.pct)}%`,
                  background: readiness.band.label === 'At Risk' ? C.error : readiness.band.label === 'On track' ? C.success : C.warning,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ fontSize: 11, color: C.textFaint, margin: '8px 0 0', lineHeight: 1.5 }}>
                Computed strictly from verified Quiz Me and SQL Pulse concept states across your syllabus chapters.
                It is not a prediction of your marks.
              </p>
              {(() => {
                const weak = []
                for (const id of exam.chapterIds) {
                  const ch = Object.values(learnerChapters || {}).find((c) => c.chapterId === id)
                  for (const [name, c] of Object.entries(ch?.concepts || {})) {
                    if (c.status === 'needs_attention' || c.luckyGuess) weak.push({ name })
                  }
                }
                if (weak.length === 0) return null
                return (
                  <p style={{ fontSize: 11.5, color: C.textMuted, margin: '8px 0 0', fontFamily: fonts.mono }}>
                    Need the most work: {weak.slice(0, 4).map((w) => w.name).join(' · ')}{weak.length > 4 ? ` +${weak.length - 4} more` : ''}
                  </p>
                )
              })()}
            </div>

            {/* Today queue */}
            <div style={{ padding: '0 18px 16px' }}>
              <SectionTitle action={
                <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint }}>
                  {tasks.reduce((s, t) => s + t.minutes, 0)} min planned
                </span>
              }>Today</SectionTitle>
              {tasks.length === 0 ? (
                <p style={{ fontSize: 12.5, color: C.textFaint }}>
                  Nothing due — you are within budget. Raise the daily target or add chapters.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tasks.map((t) => {
                    const tk = taskKey(exam.id, t)
                    const state = getTaskState(exam.id, tk)
                    const typeColor = t.type === 'READ' ? C.text : t.type === 'QUIZ' ? C.success : t.type === 'REFRESH' ? C.warning : '#7DD3FC'
                    return (
                      <div key={tk} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 4,
                        background: state === 'done' ? 'color-mix(in srgb, var(--md-primary) 6%, transparent)' : state === 'skipped' ? C.bgSoft : C.card,
                        border: `1px solid ${state ? C.borderSoft : C.border}`,
                        opacity: state ? 0.75 : 1,
                      }}>
                        <span style={{
                          fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em',
                          color: typeColor, flexShrink: 0,
                        }}>
                          {t.type} · {t.minutes} MIN
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: state === 'done' ? 400 : 500, color: state === 'done' ? C.textFaint : C.text,
                            textDecoration: state === 'done' ? 'line-through' : 'none',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: C.textFaint, fontFamily: fonts.mono }}>{t.why}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => navigate(t.path)} style={{
                            padding: '4px 11px', borderRadius: 3, background: C.fill, color: C.fillText,
                            border: 'none', cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5, fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            Start <ArrowRight size={10} weight="bold" />
                          </button>
                          <button
                            onClick={() => setTaskState(exam.id, tk, state === 'done' ? null : 'done')}
                            title="Mark done"
                            style={{
                              padding: '4px 8px', borderRadius: 3, display: 'flex',
                              background: state === 'done' ? 'color-mix(in srgb, var(--md-primary) 15%, transparent)' : 'transparent',
                              border: `1px solid ${C.borderSoft}`,
                              color: state === 'done' ? C.success : C.textMuted, cursor: 'pointer',
                            }}
                          ><Check size={11} weight="bold" /></button>
                          <button
                            onClick={() => setTaskState(exam.id, tk, state === 'skipped' ? null : 'skipped')}
                            title="Skip today"
                            style={{
                              padding: '4px 8px', borderRadius: 3,
                              background: 'transparent', border: `1px solid ${C.borderSoft}`,
                              color: state === 'skipped' ? C.warning : C.textFaint, cursor: 'pointer',
                              fontFamily: fonts.body, fontSize: 11,
                            }}
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        )
      })}

      {/* ── Create exam ── */}
      <Card style={{ marginBottom: 18 }}>
        <SectionTitle>Set up a new exam</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {syllabusSubjects.map((s) => (
            <button
              key={s.subject}
              onClick={() => setForm((f) => ({ ...f, subject: s.subject, chapterIds: [] }))}
              style={{
                padding: '5px 12px', borderRadius: 4,
                background: form.subject === s.subject ? C.cardHover : 'transparent',
                border: `1px solid ${form.subject === s.subject ? C.borderStrong : C.borderSoft}`,
                color: form.subject === s.subject ? C.text : C.textMuted,
                cursor: 'pointer', fontFamily: fonts.body, fontSize: 12.5, fontWeight: form.subject === s.subject ? 600 : 400,
              }}
            >
              {s.subject}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label className="metric-label" style={{ display: 'block', marginBottom: 5, padding: 0 }}>Exam title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={`${form.subject} ${form.type === 'board' ? 'board exam' : 'unit test'}`} style={inputStyle} />
          </div>
          <div>
            <label className="metric-label" style={{ display: 'block', marginBottom: 5, padding: 0 }}>Exam date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label className="metric-label" style={{ display: 'block', marginBottom: 5, padding: 0 }}>Exam type</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TYPE_OPTIONS.map((t) => (
                <button key={t.id} onClick={() => setForm({ ...form, type: t.id })} title={t.hint} style={{
                  flex: 1, padding: '7px 10px', borderRadius: 4, textAlign: 'left',
                  background: form.type === t.id ? C.cardHover : 'transparent',
                  border: `1px solid ${form.type === t.id ? C.borderStrong : C.borderSoft}`,
                  color: form.type === t.id ? C.text : C.textMuted,
                  cursor: 'pointer', fontFamily: fonts.body, fontSize: 12,
                }}>
                  <span style={{ display: 'block', fontWeight: 600 }}>{t.label}</span>
                  <span style={{ fontSize: 10, color: C.textFaint }}>{t.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="metric-label" style={{ display: 'block', marginBottom: 5, padding: 0 }}>Daily minutes target</label>
            <input
              type="number" min={10} max={240} value={form.dailyMinutes}
              onChange={(e) => setForm({ ...form, dailyMinutes: e.target.value })} style={inputStyle}
            />
          </div>
        </div>

        <label className="metric-label" style={{ display: 'block', marginBottom: 6, padding: 0 }}>
          Syllabus — every chapter in this test ({form.chapterIds.length} selected)
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 220, overflowY: 'auto', marginBottom: 14 }}>
          {formChapters.map((ch) => {
            const selected = form.chapterIds.includes(ch.id)
            const state = Object.values(learner.chapters || {}).find((c) => c.chapterId === ch.id)
            const readiness = state
              ? Math.round(Object.values(state.concepts).reduce((s, c) => s + (STATUS_META[c.status]?.score || 0), 0) / (state.concepts ? Object.keys(state.concepts).length : 1))
              : null
            return (
              <button
                key={ch.id}
                onClick={() => toggleChapter(ch.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  padding: '8px 12px', borderRadius: 4,
                  background: selected ? C.cardHover : 'transparent',
                  border: `1px solid ${selected ? C.borderStrong : C.borderSoft}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                  background: selected ? C.fill : 'transparent',
                  border: `1px solid ${selected ? 'transparent' : C.borderStrong}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.fillText,
                }}>
                  {selected && <Check size={10} weight="bold" />}
                </span>
                <span style={{ flex: 1, fontSize: 12.5, color: C.text }}>
                  Ch {ch.number} · {ch.title}
                </span>
                <span style={{ fontFamily: fonts.mono, fontSize: 10, color: readiness === null ? C.textFaint : readiness >= 75 ? C.success : readiness >= 40 ? C.warning : C.error }}>
                  {readiness === null ? 'not started' : `${readiness}% ready`}
                </span>
              </button>
            )
          })}
        </div>

        <button onClick={createExam} disabled={creating} style={{ ...btnPrimary, width: '100%' }}>
          <Plus size={14} weight="bold" /> Create exam plan
        </button>
      </Card>

      {/* ── Legacy AI weekly plans ── */}
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle>AI weekly plan (4 weeks)</SectionTitle>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            value={planSubject}
            onChange={(e) => setPlanSubject(e.target.value)}
            placeholder="Subject, e.g. Biology Final"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={generateWeeklyPlan} disabled={planLoading || !planSubject.trim()} style={{ ...btnPrimary, opacity: planSubject.trim() ? 1 : 0.5 }}>
            {planLoading ? <CircleNotch size={14} className="spin" /> : <Sparkle size={14} weight="duotone" />}
            Generate
          </button>
        </div>
        {(plans || []).map((p) => (
          <div key={p.id} style={{
            padding: '10px 12px', borderRadius: 4, background: C.bgSoft,
            border: `1px solid ${C.borderSoft}`, marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.subject}</span>
              <button onClick={() => deleteStudyPlan(p.id)} style={{
                background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', display: 'flex',
              }}><Trash size={12} /></button>
            </div>
            {(p.weeks || []).map((w) => (
              <div key={w.week} style={{ fontSize: 12, color: C.textMuted, margin: '3px 0', lineHeight: 1.5 }}>
                <strong style={{ color: C.text, fontFamily: fonts.mono, fontSize: 10.5 }}>W{w.week}</strong> {w.topic} — {(w.tasks || []).join(' · ')}
              </div>
            ))}
          </div>
        ))}
        {(plans || []).length === 0 && (
          <Empty title="No weekly plans yet" description="Generate a 4-week plan for any subject above, or use Exam Mode for day-by-day micro-tasks." />
        )}
      </Card>
    </div>
  )
}
