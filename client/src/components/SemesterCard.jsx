const mdPrimary = () => (typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--md-primary').trim() || '#818CF8' : '#818CF8')
const mdSecondary = () => (typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--md-secondary').trim() || '#C084FC' : '#C084FC')
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, DownloadSimple, ShareNetwork, Star } from '@phosphor-icons/react'
import { useAssignmentsStore, useGradesStore, useXPStore, useAuthStore, usePomodoroStore } from '../stores'
import { getLevel } from '../stores'

function generateCard({ user, gpa, courses, streak, xp, level, completed, total, focusHours }) {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 1000
  const ctx = canvas.getContext('2d')

  // Background gradient - Deep Pine Obsidian
  const bg = ctx.createLinearGradient(0, 0, 800, 1000)
  bg.addColorStop(0, '#0a120e')
  bg.addColorStop(0.5, '#101c17')
  bg.addColorStop(1, '#070c09')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 800, 1000)

  // Decorative botanical orbs
  const orb = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  orb(150, 200, 250, 'rgba(16,185,129,0.12)')
  orb(650, 700, 200, 'rgba(245,158,11,0.09)')
  orb(400, 500, 180, 'rgba(52,211,153,0.06)')

  // Top border accent
  const topGrad = ctx.createLinearGradient(0, 0, 800, 0)
  topGrad.addColorStop(0, mdPrimary())
  topGrad.addColorStop(0.5, mdPrimary())
  topGrad.addColorStop(1, '#f59e0b')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, 800, 4)

  // Header
  ctx.fillStyle = mdPrimary()
  ctx.font = 'bold 15px "Space Grotesk", sans-serif'
  ctx.fillText('🌿 STUDYPULSE', 48, 52)

  ctx.fillStyle = '#769989'
  ctx.font = '12px "Manrope", sans-serif'
  const sem = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  ctx.fillText(`SEMESTER REPORT · ${sem.toUpperCase()}`, 48, 72)

  // Student name
  ctx.fillStyle = '#f0fdf4'
  ctx.font = 'bold 36px "Space Grotesk", sans-serif'
  ctx.fillText(user?.name || 'Student', 48, 140)

  ctx.fillStyle = '#769989'
  ctx.font = '14px "Manrope", sans-serif'
  ctx.fillText(user?.email || '', 48, 165)

  // Level badge
  const lvlColor = level?.color || mdPrimary()
  ctx.fillStyle = `${lvlColor}22`
  roundRect(ctx, 48, 185, 160, 36, 18)
  ctx.fill()
  ctx.strokeStyle = `${lvlColor}66`
  ctx.lineWidth = 1.5
  roundRect(ctx, 48, 185, 160, 36, 18)
  ctx.stroke()
  ctx.fillStyle = lvlColor
  ctx.font = 'bold 12px "Manrope", sans-serif'
  ctx.fillText(`Lv.${level?.level || 1}  ${(level?.title || 'Freshman').toUpperCase()}`, 62, 209)

  // XP pill (warm amber)
  ctx.fillStyle = 'rgba(245,158,11,0.14)'
  roundRect(ctx, 222, 185, 120, 36, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(245,158,11,0.40)'
  ctx.lineWidth = 1.5
  roundRect(ctx, 222, 185, 120, 36, 18)
  ctx.stroke()
  ctx.fillStyle = '#f59e0b'
  ctx.font = 'bold 12px "Manrope", sans-serif'
  ctx.fillText(`${xp || 0} XP`, 250, 209)

  // Divider
  ctx.fillStyle = 'rgba(52,211,153,0.12)'
  ctx.fillRect(48, 240, 704, 1)

  // Big GPA
  ctx.font = 'bold 80px "Space Grotesk", sans-serif'
  const gpaGrad = ctx.createLinearGradient(48, 280, 48, 380)
  gpaGrad.addColorStop(0, mdPrimary())
  gpaGrad.addColorStop(1, mdPrimary())
  ctx.fillStyle = gpaGrad
  ctx.fillText(gpa ? `${gpa}%` : '—', 48, 360)

  ctx.fillStyle = '#769989'
  ctx.font = '13px "Manrope", sans-serif'
  ctx.fillText('CUMULATIVE GPA', 48, 385)

  // Stats row
  const stats = [
    { label: 'COMPLETED', value: `${completed}/${total}`, color: mdPrimary() },
    { label: 'STREAK', value: `${streak}d`, color: '#f59e0b' },
    { label: 'FOCUS', value: `${focusHours}h`, color: mdPrimary() },
  ]

  stats.forEach((s, i) => {
    const x = 48 + i * 240
    const y = 400
    ctx.fillStyle = `${s.color}18`
    roundRect(ctx, x, y, 210, 90, 12)
    ctx.fill()
    ctx.strokeStyle = `${s.color}33`
    ctx.lineWidth = 1
    roundRect(ctx, x, y, 210, 90, 12)
    ctx.stroke()
    ctx.fillStyle = s.color
    ctx.font = 'bold 30px "Space Grotesk", sans-serif'
    ctx.fillText(s.value, x + 16, y + 50)
    ctx.fillStyle = '#769989'
    ctx.font = '11px "Manrope", sans-serif'
    ctx.fillText(s.label, x + 16, y + 72)
  })

  // Course breakdown
  ctx.fillStyle = '#769989'
  ctx.font = '11px "Manrope", sans-serif'
  ctx.fillText('COURSE BREAKDOWN', 48, 530)

  if (courses?.length) {
    const colors = [mdPrimary(), mdPrimary(), '#f59e0b', mdSecondary(), '#fbbf24']
    courses.slice(0, 5).forEach((c, i) => {
      const y = 546 + i * 56
      const color = colors[i % colors.length]
      // Bar background
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      roundRect(ctx, 48, y, 704, 44, 8)
      ctx.fill()
      // Color accent
      ctx.fillStyle = color
      ctx.fillRect(48, y, 4, 44)
      // Course name
      ctx.fillStyle = '#dfe2eb'
      ctx.font = '15px Arial'
      ctx.fillText(c.name, 66, y + 18)
      ctx.fillStyle = '#606080'
      ctx.font = '12px Arial'
      ctx.fillText(c.code || '', 66, y + 34)
      // Grade
      if (c.pct) {
        ctx.fillStyle = color
        ctx.font = 'bold 15px monospace'
        const gText = `${c.pct}% ${c.letter || ''}`
        ctx.fillText(gText, 752 - ctx.measureText(gText).width, y + 26)
        // Mini progress bar
        const barW = 120
        const barX = 616 - barW
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        roundRect(ctx, barX, y + 32, barW, 4, 2)
        ctx.fill()
        ctx.fillStyle = color
        roundRect(ctx, barX, y + 32, barW * Math.min(parseFloat(c.pct) / 100, 1), 4, 2)
        ctx.fill()
      }
    })
  }

  // Bottom
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.fillRect(0, 940, 800, 60)
  ctx.fillStyle = '#c44dff'
  ctx.font = 'bold 13px monospace'
  ctx.fillText('studypulse.app', 48, 976)
  ctx.fillStyle = '#424754'
  ctx.font = '12px monospace'
  ctx.fillText('Free AI study companion · Open source · MIT license', 280, 976)

  return canvas
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function SemesterCard({ onClose }) {
  const { user } = useAuthStore()
  const { courses, assignments } = useAssignmentsStore()
  const { courseGrades } = useGradesStore()
  const { xp } = useXPStore()
  const { totalFocusMinutes } = usePomodoroStore()
  const [preview, setPreview] = useState(null)
  const level = getLevel(xp)

  const completed = assignments.filter(a => a.status === 'graded' || a.status === 'completed').length
  const streak = user?.streak || 0
  const focusHours = Math.round((totalFocusMinutes || 0) / 60)

  // Build course list with grades
  const courseList = courses.map(c => {
    const grades = courseGrades[c.id]
    if (!grades) return { ...c, pct: null }
    const vals = Object.values(grades)
    const earned = vals.reduce((s, g) => s + (g.pointsEarned || 0), 0)
    const possible = vals.reduce((s, g) => s + (g.pointsPossible || 0), 0)
    const pct = possible > 0 ? ((earned / possible) * 100).toFixed(1) : null
    return { ...c, pct }
  }).filter(c => c.pct !== null)

  let totalEarned = 0, totalPossible = 0
  courseList.forEach(c => {
    const vals = Object.values(courseGrades[c.id] || {})
    totalEarned += vals.reduce((s, g) => s + (g.pointsEarned || 0), 0)
    totalPossible += vals.reduce((s, g) => s + (g.pointsPossible || 0), 0)
  })
  const gpa = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : null

  const generate = () => {
    const canvas = generateCard({
      user, gpa, courses: courseList, streak, xp, level,
      completed, total: assignments.length,
      focusHours,
    })
    setPreview(canvas.toDataURL('image/png'))
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = preview
    a.download = `studypulse-semester-${new Date().toISOString().split('T')[0]}.png`
    a.click()
  }

  const tweet = () => {
    const text = `My semester stats with StudyPulse 📚\n\nGPA: ${gpa || '—'}% | ${completed}/${assignments.length} done | ${streak} day streak\n\nFree AI study companion 👇\nhttps://github.com/kaorii-ako/StudyPulse\n\n#StudyPulse #StudyWithMe`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 14, padding: 28,
          width: 'min(500px, 100%)',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={18} weight="duotone" style={{ color: 'var(--accent-amber, #f59e0b)' }} />
            <span style={{ fontFamily: "var(--md-font-body)", fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              SEMESTER REPORT CARD
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} weight="bold" />
          </button>
        </div>

        {!preview ? (
          <>
            <p style={{ fontFamily: "var(--md-font-body)", fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Generate a beautiful shareable image of your semester stats — GPA, courses, streak, focus hours.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'GPA', value: gpa ? `${gpa}%` : '—', color: mdPrimary() },
                { label: 'Assignments', value: `${completed}/${assignments.length}`, color: '#f59e0b' },
                { label: 'Streak', value: `${streak}d`, color: mdPrimary() },
                { label: 'Focus', value: `${focusHours}h`, color: '#d97706' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: `${s.color}0f`, border: `1px solid ${s.color}33`,
                }}>
                  <p style={{ fontFamily: "var(--md-font-body)", fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>{s.label}</p>
                  <p style={{ fontFamily: "var(--md-font-body)", fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: '-0.02em', margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={generate}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--accent-blue)',
                border: 'none', color: '#04120c',
                fontFamily: "var(--md-font-body)", fontSize: 13, fontWeight: 700,
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              }}
            >
              Generate Report Card
            </button>
          </>
        ) : (
          <>
            <img src={preview} alt="Semester report card" style={{ width: '100%', borderRadius: 10, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={download}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '11px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--accent-blue-soft, rgba(16,185,129,0.12))', border: '1px solid rgba(52,211,153,0.30)',
                  color: 'var(--accent-blue)', fontFamily: "var(--md-font-body)", fontSize: 12, fontWeight: 700,
                }}
              >
                <DownloadSimple size={15} weight="bold" /> Download
              </button>
              <button
                onClick={tweet}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '11px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontFamily: "var(--md-font-body)", fontSize: 12, fontWeight: 700,
                }}
              >
                <ShareNetwork size={14} weight="duotone" />
                Post
              </button>
              <a
                href="https://github.com/kaorii-ako/StudyPulse"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '11px', borderRadius: 8, textDecoration: 'none',
                  background: 'rgba(245,158,11,0.14)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  color: '#f59e0b', fontFamily: "var(--md-font-body)", fontSize: 12, fontWeight: 700,
                }}
              >
                <Star size={14} weight="duotone" /> Star
              </a>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
