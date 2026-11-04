import { useState, useMemo } from 'react'
import { ChartBar, Calculator, Plus } from '@phosphor-icons/react'
import { useGradesStore, useAssignmentsStore, pctToGPA } from '../stores'
import { C, fonts, tint, inputStyle, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader, Card, SectionTitle, Empty } from '../components/ui'
import { CBSE_CLASS_GROUPS } from '../utils/cbseSubjects'

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(4,6,10,0.85)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} className="page-enter" style={{
        background: 'var(--bg-card)',
        border: `1px solid ${C.border}`, borderRadius: 14, padding: 26, width: 'min(460px,92vw)',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {children}
      </div>
    </div>
  )
}

function letterGrade(pct) {
  if (pct >= 93) return 'A'
  if (pct >= 90) return 'A-'
  if (pct >= 87) return 'B+'
  if (pct >= 83) return 'B'
  if (pct >= 80) return 'B-'
  if (pct >= 77) return 'C+'
  if (pct >= 73) return 'C'
  if (pct >= 70) return 'C-'
  if (pct >= 60) return 'D'
  return 'F'
}

function gradeColor(pct) {
  if (pct >= 80) return '#4ade80'
  if (pct >= 70) return '#fb923c'
  return '#f87171'
}

const EMPTY_COURSE = { name: '', credits: 3 }
const EMPTY_GRADE = { courseId: '', title: '', pointsEarned: '', pointsPossible: '' }

export default function Grades() {
  const { calculateCourseGrade, courseGrades, addGrade } = useGradesStore()
  const { courses, addCourse } = useAssignmentsStore()
  const [finalWeight, setFinalWeight] = useState(30)
  const [desiredGrade, setDesiredGrade] = useState(90)
  const [currentPct, setCurrentPct] = useState(85)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE)
  const [showAddGrade, setShowAddGrade] = useState(false)
  const [gradeForm, setGradeForm] = useState(EMPTY_GRADE)

  const courseGradeData = useMemo(() => {
    return (courses || [])
      .map(c => ({ course: c, result: calculateCourseGrade(c.id) }))
  }, [courses, courseGrades, calculateCourseGrade])

  const gradedCount = courseGradeData.filter(c => c.result).length

  const handleAddCourse = () => {
    if (!courseForm.name.trim()) return
    addCourse({ name: courseForm.name.trim(), credits: Number(courseForm.credits) || 3, source: 'manual' })
    setCourseForm(EMPTY_COURSE)
    setShowAddCourse(false)
  }

  const openAddGrade = (courseId) => {
    setGradeForm({ ...EMPTY_GRADE, courseId: courseId || (courses || [])[0]?.id || '' })
    setShowAddGrade(true)
  }

  const handleAddGrade = () => {
    const earned = Number(gradeForm.pointsEarned)
    const possible = Number(gradeForm.pointsPossible)
    if (!gradeForm.courseId || !possible || Number.isNaN(earned) || Number.isNaN(possible)) return
    const assignmentId = `manual-${Date.now()}`
    addGrade(gradeForm.courseId, assignmentId, { pointsEarned: earned, pointsPossible: possible, title: gradeForm.title.trim() || 'Assignment' })
    setGradeForm(EMPTY_GRADE)
    setShowAddGrade(false)
  }

  const overallGPA = useMemo(() => {
    const graded = courseGradeData.filter(c => c.result)
    if (!graded.length) return null
    let weightedSum = 0
    let totalCredits = 0
    graded.forEach(({ course, result }) => {
      const credits = course.credits || 3
      const pct = parseFloat(result.percentage)
      weightedSum += pctToGPA(pct) * credits
      totalCredits += credits
    })
    if (totalCredits === 0) return null
    return (weightedSum / totalCredits).toFixed(2)
  }, [courseGradeData])

  const neededOnFinal = useMemo(() => {
    const w = finalWeight / 100
    const needed = (desiredGrade - currentPct * (1 - w)) / w
    return needed.toFixed(1)
  }, [finalWeight, desiredGrade, currentPct])

  const gpaColor = overallGPA
    ? (parseFloat(overallGPA) >= 3.5 ? '#4ade80' : parseFloat(overallGPA) >= 3.0 ? '#fb923c' : '#f87171')
    : C.textMuted

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 'min(1140px, 100%)', margin: '0 auto' }}>
      <PageHeader
        icon={ChartBar}
        accent={C.green}
        title="Grades & GPA"
        subtitle="Track course averages and predict final exam targets"
        actions={
          <>
            <button onClick={() => openAddGrade()} disabled={!(courses || []).length} style={{ ...btnGhost, opacity: (courses || []).length ? 1 : 0.5 }}>
              <Plus size={14} weight="bold" /> Add Grade
            </button>
            <button onClick={() => setShowAddCourse(true)} style={btnPrimary}>
              <Plus size={14} weight="bold" /> Add Course
            </button>
          </>
        }
      />

      {/* GPA Overview — clean data card */}
      <Card style={{
        padding: '24px 28px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        background: 'var(--bg-card)',
        border: `1px solid ${C.border}`,
        boxShadow: 'var(--shadow-lift, 0 8px 24px rgba(0,0,0,0.45))',
      }}>
        <div>
          <div style={{
            fontSize: 11, color: C.textMuted, marginBottom: 6, fontFamily: fonts.body,
            fontWeight: 600, letterSpacing: '0.01em',
          }}>
            Cumulative GPA
          </div>
          <div style={{
            fontFamily: fonts.heading, fontSize: 50, fontWeight: 700,
            color: gpaColor, lineHeight: 1,
          }}>
            {overallGPA || '—'}
          </div>
        </div>
        <div style={{ height: 50, width: 1, background: C.borderSoft }} />
        <div>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            Tracking <strong style={{ color: C.text }}>{gradedCount}</strong> subjects with graded work
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
            Out of <strong style={{ color: C.text }}>{(courses || []).length}</strong> enrolled subjects
          </div>
        </div>
      </Card>

      {/* Grade trajectory */}
      {courseGradeData.some((c) => c.result) && (
        <Card style={{ padding: '20px 22px', marginBottom: 20 }}>
          <SectionTitle icon={ChartBar} color={C.primary}>Grade trajectory</SectionTitle>
          <svg viewBox="0 0 300 64" style={{ width: '100%', height: 64, display: 'block' }}>
            <defs>
              <linearGradient id="gradeTraj" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor='var(--md-primary)' />
                <stop offset="100%" stopColor='var(--md-secondary)' />
              </linearGradient>
            </defs>
            <polyline
              fill="none" stroke="url(#gradeTraj)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              points={courseGradeData.filter((c) => c.result).map((c, i, arr) => {
                const x = arr.length === 1 ? 150 : (i / (arr.length - 1)) * 280 + 10
                const y = 58 - (Math.min(100, Math.max(0, parseFloat(c.result.percentage))) / 100) * 52
                return `${x},${y}`
              }).join(' ')}
            />
          </svg>
        </Card>
      )}

      {/* Course cards */}
      {(courses || []).length === 0 ? (
        <Card style={{ marginBottom: 20, padding: 0, background: 'var(--bg-card)' }}>
          <Empty
            icon={ChartBar}
            accent={C.green}
            title="No courses enrolled yet"
            description="Sync Google Classroom or add your CBSE subjects to start tracking GPA."
            action={() => setShowAddCourse(true)}
            actionLabel="Add Subject"
          />
        </Card>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          {courseGradeData.map(({ course, result }) => {
            if (!result) {
              return (
                <div key={course.id} className="hover-lift" style={{
                  background: 'var(--bg-card)',
                  border: `1px dashed ${C.border}`, borderRadius: 10, padding: 18,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10,
                }}>
                  <div style={{ fontFamily: fonts.heading, fontSize: 14.5, fontWeight: 700, color: C.text }}>{course.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>No grades yet{course.credits ? ` · ${course.credits} credits` : ''}</div>
                  <button onClick={() => openAddGrade(course.id)} style={{ ...btnGhost, alignSelf: 'flex-start', padding: '5px 12px', fontSize: 11.5 }}>
                    <Plus size={12} /> Add Grade
                  </button>
                </div>
              )
            }
            const pct = parseFloat(result.percentage)
            const letter = letterGrade(pct)
            const color = gradeColor(pct)
            return (
              <div key={course.id} className="hover-lift" style={{
                background: 'var(--bg-card)',
                border: `1px solid ${C.border}`, borderRadius: 10, padding: 18,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10 }}>
                  <div style={{ fontFamily: fonts.heading, fontSize: 14.5, fontWeight: 700, color: C.text }}>
                    {course.name}
                  </div>
                  <span style={{
                    fontFamily: fonts.heading, fontSize: 20, fontWeight: 700,
                    color,
                  }}>{letter}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 9 }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
                  {result.percentage}%{course.credits ? ` · ${course.credits} credits` : ''}
                  {result.isWeighted ? ' · weighted' : ''}
                </div>
                <button onClick={() => openAddGrade(course.id)} style={{ ...btnGhost, padding: '5px 10px', fontSize: 11.5, color: C.textMuted }}>
                  <Plus size={11} /> Add Grade
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Grade predictor — What-If slider */}
      <Card style={{ padding: 24, borderTop: `2px solid ${C.amber}` }}>
        <SectionTitle icon={Calculator} color={C.amber}>What-if predictor</SectionTitle>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 18 }}>
          Slide to simulate target scores — what do you need on the final?
        </p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>
            <span>Desired final grade</span><span style={{ color: C.amber }}>{desiredGrade}%</span>
          </label>
          <input
            type="range" min={50} max={100} value={desiredGrade}
            onChange={(e) => setDesiredGrade(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-amber, #f59e0b)', cursor: 'pointer' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Current Grade (%)', val: currentPct, set: setCurrentPct },
            { label: 'Final Exam Weight (%)', val: finalWeight, set: setFinalWeight },
            { label: 'Desired Final Grade (%)', val: desiredGrade, set: setDesiredGrade },
          ].map(({ label, val, set }) => (
            <div key={label} style={{ flex: 1, minWidth: 160 }}>
              <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 700 }}>{label}</label>
              <input
                type="number" min={0} max={100}
                value={val}
                onChange={e => set(Number(e.target.value))}
                style={{ ...inputStyle, fontFamily: fonts.heading, fontWeight: 600 }}
                onFocus={e => { e.target.style.borderColor = C.blueDark }}
                onBlur={e => { e.target.style.borderColor = C.border }}
              />
            </div>
          ))}
        </div>
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, color: C.textMuted }}>You need at least</span>
          <span style={{
            fontFamily: fonts.heading, fontSize: 28, fontWeight: 700,
            color: parseFloat(neededOnFinal) > 100 ? C.pink : parseFloat(neededOnFinal) < 60 ? C.green : C.blue,
          }}>{neededOnFinal}%</span>
          <span style={{ fontSize: 13, color: C.textMuted }}>on your final exam.</span>
          {parseFloat(neededOnFinal) > 100 && (
            <span style={{ fontSize: 12, color: C.pink, fontWeight: 700 }}>Not achievable — aim higher now!</span>
          )}
        </div>
      </Card>

      {/* Add course modal */}
      <Modal open={showAddCourse} onClose={() => setShowAddCourse(false)}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Add Subject</h2>
        <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Pick a CBSE subject or type your own below.</p>

        {/* CBSE quick-pick groups */}
        {CBSE_CLASS_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, letterSpacing: '0.01em', textTransform: 'none', marginBottom: 7 }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {group.subjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setCourseForm(f => ({ ...f, name: sub }))}
                  style={{
                    padding: '5px 12px', borderRadius: 99,
                    border: `1px solid ${courseForm.name === sub ? tint(C.blue, 0.5) : C.border}`,
                    background: courseForm.name === sub ? tint(C.blue, 0.14) : 'transparent',
                    color: courseForm.name === sub ? C.blue : C.textMuted,
                    cursor: 'pointer', fontSize: 12, fontFamily: fonts.body,
                    transition: 'all 0.12s ease',
                  }}
                >{sub}</button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ height: 1, background: C.border, margin: '16px 0' }} />

        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 700 }}>Subject Name (editable)</label>
        <input
          value={courseForm.name}
          onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Type any subject name…"
          onKeyDown={e => e.key === 'Enter' && handleAddCourse()}
          style={{ ...inputStyle, marginBottom: 14 }}
        />
        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 700 }}>Credits / Weight</label>
        <input
          type="number" min={0} step={0.5}
          value={courseForm.credits}
          onChange={e => setCourseForm(f => ({ ...f, credits: e.target.value }))}
          style={{ ...inputStyle, marginBottom: 20 }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowAddCourse(false)} style={{ ...btnGhost, color: C.textMuted }}>Cancel</button>
          <button onClick={handleAddCourse} disabled={!courseForm.name.trim()} style={{ ...btnPrimary, opacity: courseForm.name.trim() ? 1 : 0.5 }}>Add Subject</button>
        </div>
      </Modal>

      {/* Add grade modal */}
      <Modal open={showAddGrade} onClose={() => setShowAddGrade(false)}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 18 }}>Add Grade</h2>
        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 700 }}>Course</label>
        <select
          value={gradeForm.courseId}
          onChange={e => setGradeForm(f => ({ ...f, courseId: e.target.value }))}
          style={{ ...inputStyle, marginBottom: 14 }}
        >
          {(courses || []).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 700 }}>Assignment Name</label>
        <input
          value={gradeForm.title}
          onChange={e => setGradeForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Midterm Exam"
          style={{ ...inputStyle, marginBottom: 14 }}
        />
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 700 }}>Points Earned</label>
            <input
              type="number" min={0}
              value={gradeForm.pointsEarned}
              onChange={e => setGradeForm(f => ({ ...f, pointsEarned: e.target.value }))}
              style={{ ...inputStyle, fontFamily: fonts.heading, fontWeight: 600 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 700 }}>Points Possible</label>
            <input
              type="number" min={0}
              value={gradeForm.pointsPossible}
              onChange={e => setGradeForm(f => ({ ...f, pointsPossible: e.target.value }))}
              style={{ ...inputStyle, fontFamily: fonts.heading, fontWeight: 600 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowAddGrade(false)} style={{ ...btnGhost, color: C.textMuted }}>Cancel</button>
          <button onClick={handleAddGrade} style={btnPrimary}>Add Grade</button>
        </div>
      </Modal>
    </div>
  )
}
