import { useMemo } from 'react'
import { TrendUp, Lightning, Medal, Fire, ChartBar, Timer } from '@phosphor-icons/react'
import { useAssignmentsStore, useGradesStore, useXPStore, usePomodoroStore, pctToGPA, calcStreak } from '../stores'
import { C, fonts, tint } from '../utils/theme'
import { PageHeader, Card, StatCard, SectionTitle } from '../components/ui'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Analytics() {
  const { assignments, courses } = useAssignmentsStore()
  const gradesStore = useGradesStore()
  const xpStore = useXPStore()
  const { dailyFocusLog } = usePomodoroStore()

  const xp = xpStore?.xp || 0
  const progress = xpStore?.getProgress?.()
  const level = progress?.cur?.level || 1
  const streak = calcStreak(dailyFocusLog || {})

  const completed = useMemo(() => (assignments || []).filter(a => a.completed).length, [assignments])
  const total = (assignments || []).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const courseGradeData = useMemo(() => {
    return (courses || []).map(course => {
      const result = gradesStore.calculateCourseGrade?.(course.id)
      const raw = result?.percentage != null ? parseFloat(result.percentage) : null
      const pct = (raw != null && !isNaN(raw)) ? Math.round(raw) : null
      return { ...course, pct }
    }).filter(c => c.pct != null)
  }, [courses, gradesStore])

  const overallGPA = useMemo(() => {
    let totalPoints = 0, totalCredits = 0
    ;(courses || []).forEach(c => {
      const result = gradesStore.calculateCourseGrade?.(c.id)
      if (!result?.percentage) return
      const cred = c.credits || 3
      totalPoints += pctToGPA(parseFloat(result.percentage)) * cred
      totalCredits += cred
    })
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null
  }, [courses, gradesStore])

  const weeklyHours = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().split('T')[0]
      const mins = (dailyFocusLog || {})[key] || 0
      return Math.round((mins / 60) * 10) / 10
    })
  }, [dailyFocusLog])

  const dayLabels = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      return DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]
    })
  }, [])

  const maxH = Math.max(...weeklyHours, 0)
  const hasAnyHours = weeklyHours.some(h => h > 0)
  const completionColor = completionRate >= 80 ? C.green : completionRate >= 60 ? C.orange : C.pink

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 'min(1140px, 100%)', margin: '0 auto' }}>
      <PageHeader
        icon={TrendUp}
        accent={C.primary}
        title="Study analytics"
        subtitle="Study velocity, focus trends, and academic progress"
      />

      {/* Stats row */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard icon={Lightning} label="Total XP" value={xp} color={C.amber} />
        <StatCard icon={Medal} label="Current Level" value={`Lvl ${level}`} color={C.primary} />
        <StatCard icon={Fire} label="Study Streak" value={`${streak}d`} color={C.amber} />
        <StatCard icon={ChartBar} label="Projected GPA" value={overallGPA || '—'} color={C.green} />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Weekly study time bar chart */}
        <Card style={{ background: 'var(--bg-card, #101c17)' }}>
          <SectionTitle icon={Timer} color={C.primary}>Weekly study time</SectionTitle>
          {hasAnyHours ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130, paddingTop: 10 }}>
              {weeklyHours.map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 10.5, color: C.textMuted, fontWeight: 700, fontFamily: fonts.body }}>{h > 0 ? `${h}h` : ''}</div>
                  <div style={{
                    width: '100%',
                    height: maxH > 0 ? `${Math.max((h / maxH) * 85, h > 0 ? 6 : 0)}px` : '4px',
                    background: 'var(--grad-primary, linear-gradient(180deg, #34d399, #059669))',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    opacity: h > 0 ? 1 : 0.15,
                  }} />
                  <div style={{ fontSize: 10.5, color: C.textMuted, fontFamily: fonts.body, fontWeight: 700 }}>{dayLabels[i]}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 130, flexDirection: 'column', gap: 10 }}>
              <Timer size={24} color={C.textFaint} />
              <div style={{ fontSize: 12.5, color: C.textMuted, textAlign: 'center' }}>Complete Focus Mode sessions to track study hours</div>
            </div>
          )}
        </Card>

        {/* Assignment completion */}
        <Card style={{ background: 'var(--bg-card, #101c17)' }}>
          <SectionTitle icon={ChartBar} color="#4ade80">Assignment Completion</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, height: 130 }}>
            <div style={{
              fontFamily: fonts.heading, fontSize: 44, fontWeight: 700,
              color: completionRate >= 75 ? '#4ade80' : completionRate >= 50 ? '#fb923c' : C.blue,
            }}>
              {completionRate}%
            </div>
            <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${completionRate}%`,
                background: completionRate >= 75 ? '#4ade80' : completionRate >= 50 ? '#fb923c' : 'var(--accent-blue, #10b981)',
                borderRadius: 3, transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{completed} of {total} assignments completed</div>
          </div>
        </Card>
      </div>

      {/* Course grades */}
      {courseGradeData.length > 0 && (
        <Card style={{ background: 'var(--bg-card, #101c17)' }}>
          <SectionTitle icon={TrendUp} color={C.purple}>Grade Trends by Course</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {courseGradeData.map((c, i) => {
              const pct = c.pct
              const barColor = pct >= 80 ? '#4ade80' : pct >= 70 ? '#fb923c' : '#f87171'
              return (
                <div key={c.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 160, flexShrink: 0 }}>
                    {c.color && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  </div>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ width: 44, fontSize: 12.5, color: barColor, fontWeight: 700, fontFamily: fonts.heading, textAlign: 'right' }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
