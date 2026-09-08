import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Sparkles, Trash2, PlusCircle, Check, ArrowRight } from 'lucide-react'
import { useStudyPlansStore, useAssignmentsStore, useUIStore } from '../stores'
import { C, fonts, tint, inputStyle, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader, Card, SectionTitle, Empty } from '../components/ui'
import { generateAI, aiAvailable } from '../utils/ai'

const DEMO_PLAN = {
  subject: 'Biology Final',
  weeks: [
    { week: 1, topic: 'Cell Biology & Organelles', tasks: ['Read Ch 1-2', 'Make flashcards', 'Practice diagrams'] },
    { week: 2, topic: 'Genetics & DNA', tasks: ['Read Ch 3-4', 'Punnett square practice', 'Review lecture notes'] },
    { week: 3, topic: 'Evolution & Ecology', tasks: ['Read Ch 5-6', 'Watch videos', 'Past exam questions'] },
    { week: 4, topic: 'Review & Practice Exams', tasks: ['Full practice test', 'Review weak areas', 'Final revision'] },
  ]
}

export default function StudyPlans() {
  const navigate = useNavigate()
  const { plans, addStudyPlan, deleteStudyPlan } = useStudyPlansStore()
  const { addAssignment } = useAssignmentsStore()
  const { addToast } = useUIStore()
  const [form, setForm] = useState({ subject: '', examDate: '' })
  const [loading, setLoading] = useState(false)
  const [activePlan, setActivePlan] = useState(null)
  const [addedWeeks, setAddedWeeks] = useState({})

  const uniquePlans = useMemo(() => {
    const seen = new Set()
    return (plans || []).filter(p => {
      const id = p?.id || p?.subject
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
  }, [plans])

  useEffect(() => {
    if (!plans || plans.length === 0) {
      const initialPlan = {
        id: 'plan-cbse-bio',
        subject: 'CBSE Class 11 Biology Final',
        examDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        weeks: DEMO_PLAN.weeks,
      }
      addStudyPlan(initialPlan)
      setActivePlan(initialPlan.id)
    }
  }, [])

  const generate = async () => {
    if (!form.subject.trim()) return
    setLoading(true)
    if (!aiAvailable()) {
      setTimeout(() => {
        const plan = { ...DEMO_PLAN, subject: form.subject, examDate: form.examDate, id: Date.now().toString() }
        const id = addStudyPlan(plan)
        setActivePlan(id)
        setLoading(false)
        setForm({ subject: '', examDate: '' })
      }, 800)
      return
    }
    try {
      const text = await generateAI(
        `Create a 4-week study plan for "${form.subject}" with exam on ${form.examDate || 'TBD'}. Return ONLY JSON, no markdown: {"subject":"...","weeks":[{"week":1,"topic":"...","tasks":["a","b","c"]}]}`
      ) || ''
      const match = text.match(/\{[\s\S]*\}/)
      const parsed = match ? JSON.parse(match[0]) : DEMO_PLAN
      const plan = { ...parsed, id: Date.now().toString(), examDate: form.examDate }
      const id = addStudyPlan(plan)
      setActivePlan(id)
      setForm({ subject: '', examDate: '' })
    } catch {
      const plan = { ...DEMO_PLAN, subject: form.subject, id: Date.now().toString() }
      const id = addStudyPlan(plan)
      setActivePlan(id)
    }
    setLoading(false)
  }

  const shown = activePlan ? uniquePlans.find(p => p.id === activePlan) : (uniquePlans.length > 0 ? uniquePlans[0] : null)
  const canGenerate = !loading && form.subject.trim()

  const handleAddWeekToAssignments = (weekObj, weekIndex) => {
    const tasks = weekObj.tasks || []
    if (tasks.length === 0) return

    const now = new Date()
    const targetDate = new Date(now.getTime() + (weekIndex + 1) * 7 * 24 * 60 * 60 * 1000)
    const dueDateStr = targetDate.toISOString().split('T')[0]

    tasks.forEach(task => {
      addAssignment({
        title: task,
        course: shown?.subject || 'Study Plan',
        dueDate: dueDateStr,
        priority: 'medium',
        notes: `Generated from Study Plan: ${shown?.subject || ''} (Week ${weekObj.week || weekIndex + 1} - ${weekObj.topic})`
      })
    })

    setAddedWeeks(prev => ({ ...prev, [weekIndex]: true }))
    addToast({
      type: 'success',
      message: `Added ${tasks.length} tasks from Week ${weekObj.week || weekIndex + 1} to Assignments!`
    })
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 'min(1180px, 100%)', margin: '0 auto' }}>
      <PageHeader
        icon={BookOpen}
        accent={C.blue}
        title="Study Plans"
        subtitle="AI-built week-by-week plans for any exam"
      />

      {/* Generator */}
      <Card style={{ padding: 24, marginBottom: 20, background: 'var(--bg-card, #101c17)' }}>
        <SectionTitle icon={Sparkles} color={C.blue}>Generate AI Study Plan</SectionTitle>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Subject or exam topic (e.g. CBSE Physics Term 1)"
            style={{ ...inputStyle, flex: 2, minWidth: 200, width: 'auto' }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent-blue, #10b981)' }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
          <input
            type="date" value={form.examDate} onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
            style={{ ...inputStyle, flex: 1, minWidth: 140, width: 'auto' }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent-blue, #10b981)' }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
          <button onClick={generate} disabled={!canGenerate} style={{
            ...btnPrimary,
            opacity: canGenerate ? 1 : 0.5,
            cursor: canGenerate ? 'pointer' : 'not-allowed',
          }}>
            <Sparkles size={14} /> {loading ? 'Generating…' : 'Generate 4-Week Plan'}
          </button>
        </div>
      </Card>

      {/* Saved plans list */}
      {uniquePlans.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {uniquePlans.map(p => {
            const isActive = activePlan === p.id || (!activePlan && uniquePlans[0]?.id === p.id)
            return (
              <button key={p.id} onClick={() => setActivePlan(p.id)} style={{
                padding: '6px 14px', borderRadius: 6,
                border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.5)' : C.border}`,
                background: isActive ? 'var(--accent-blue-soft, rgba(59, 130, 246, 0.12))' : 'transparent',
                color: isActive ? C.blue : C.textMuted,
                cursor: 'pointer', fontFamily: fonts.heading, fontSize: 12, fontWeight: 700,
                transition: 'all 0.12s ease',
              }}>{p.subject || p.title}</button>
            )
          })}
        </div>
      )}

      {/* Active plan */}
      {shown ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.text }}>{shown.subject || shown.title}</h2>
            <button onClick={() => { deleteStudyPlan(shown.id); setActivePlan(null) }}
              style={{ ...btnGhost, padding: '5px 10px', fontSize: 11.5, color: C.textMuted }}>
              <Trash2 size={12} /> Delete Plan
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {(shown.weeks || []).map((w, i) => {
              const isAdded = !!addedWeeks[i]
              return (
                <Card key={i} style={{ padding: 20, background: 'var(--bg-card, #101c17)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 4, background: 'var(--accent-blue-soft, rgba(59, 130, 246, 0.15))',
                        color: C.blue, fontSize: 11, fontWeight: 700, fontFamily: fonts.heading,
                      }}>Week {w.week || i + 1}</span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: fonts.heading }}>{w.topic}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(w.tasks || []).map((task, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textMuted }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.blue, flexShrink: 0 }} />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <button
                      onClick={() => handleAddWeekToAssignments(w, i)}
                      disabled={isAdded}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 6,
                        border: `1px solid ${isAdded ? 'rgba(52,211,153,0.35)' : 'rgba(59,130,246,0.35)'}`,
                        background: isAdded ? 'var(--accent-blue-soft, rgba(16,185,129,0.12))' : 'var(--surface-low, #0d1712)',
                        color: isAdded ? C.primary : C.blue,
                        cursor: isAdded ? 'default' : 'pointer',
                        fontSize: 11.5, fontFamily: fonts.heading, fontWeight: 700,
                        transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isAdded) {
                          e.currentTarget.style.borderColor = C.blue
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isAdded) {
                          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)'
                          e.currentTarget.style.background = 'var(--surface-low, #0d1712)'
                        }
                      }}
                    >
                      {isAdded ? (
                        <><Check size={13} /> Tasks Added</>
                      ) : (
                        <><PlusCircle size={13} /> Add to Assignments</>
                      )}
                    </button>

                    {isAdded && (
                      <button
                        onClick={() => navigate('/assignments')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: C.textMuted, fontSize: 11, fontFamily: fonts.heading, fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = C.text}
                        onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                      >
                        View <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <Card style={{ padding: 0, background: 'var(--bg-card, #101c17)' }}>
          <Empty
            icon={BookOpen}
            accent={C.blue}
            title="No study plans created"
            description="Generate a week-by-week study roadmap for your upcoming exams."
          />
        </Card>
      )}
    </div>
  )
}
