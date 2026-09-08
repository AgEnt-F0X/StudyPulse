import { useState, useEffect } from 'react'
import { CheckCircle2, Plus, Flame, Check, Trash2 } from 'lucide-react'
import { C, fonts, tint, inputStyle, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader, Card, Empty } from '../components/ui'

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const COLORS = [C.primary, C.amber, C.green, C.purple, C.orange]
const STORAGE_KEY = 'studypulse-habits'

const defaultHabits = [
  { id: '1', name: 'Read for 20 mins', streak: 5, color: C.primary, completedDays: [true, true, false, true, true, false, false] },
  { id: '2', name: 'Exercise', streak: 3, color: C.green, completedDays: [false, true, true, true, false, false, false] },
  { id: '3', name: 'Review notes', streak: 7, color: C.amber, completedDays: [true, true, true, true, true, true, false] },
]

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
      if (Array.isArray(parsed?.state?.habits)) return parsed.state.habits
      if (Array.isArray(parsed?.habits)) return parsed.habits
    }
  } catch { /* corrupted storage — fall back to defaults */ }
  return defaultHabits
}

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(4,6,10,0.85)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} className="page-enter" style={{
        background: 'var(--bg-card, #101c17)',
        border: `1px solid ${C.border}`, borderRadius: 14, padding: 26, width: 'min(440px,92vw)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {children}
      </div>
    </div>
  )
}

export default function Habits() {
  const [habits, setHabits] = useState(loadHabits)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', color: C.blue })
  const todayIdx = (new Date().getDay() + 6) % 7 // 0=Mon

  const safeHabits = Array.isArray(habits) ? habits : defaultHabits

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(safeHabits)) } catch { /* storage full */ }
  }, [safeHabits])

  const toggleToday = (id) => {
    setHabits(hs => {
      const list = Array.isArray(hs) ? hs : defaultHabits
      return list.map(h => {
        if (h.id !== id) return h
        const days = Array.isArray(h.completedDays) ? [...h.completedDays] : [false, false, false, false, false, false, false]
        days[todayIdx] = !days[todayIdx]
        const streak = days[todayIdx] ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 0) - 1)
        return { ...h, completedDays: days, streak }
      })
    })
  }

  const deleteHabit = (id) => setHabits(hs => (Array.isArray(hs) ? hs : defaultHabits).filter(h => h.id !== id))

  const addHabit = () => {
    if (!form.name.trim()) return
    setHabits(hs => [...(Array.isArray(hs) ? hs : defaultHabits), {
      id: Date.now().toString(), name: form.name, streak: 0,
      color: form.color, completedDays: [false, false, false, false, false, false, false],
    }])
    setForm({ name: '', color: C.blue })
    setShowModal(false)
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 740, margin: '0 auto' }}>
      <PageHeader
        icon={CheckCircle2}
        accent={C.green}
        title="Habit Builder"
        subtitle="Consistent daily academic routines and study rituals"
        actions={
          <button onClick={() => setShowModal(true)} style={btnPrimary}>
            <Plus size={14} /> Add Habit
          </button>
        }
      />

      {/* Week header */}
      <Card style={{ padding: '12px 20px', marginBottom: 12, background: 'var(--bg-card, #101c17)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.textMuted, fontFamily: fonts.heading }}>HABIT</div>
          {WEEK_DAYS.map((d, i) => (
            <div key={i} style={{
              width: 30, textAlign: 'center',
              fontSize: 11, fontWeight: 700, fontFamily: fonts.heading,
              color: i === todayIdx ? 'var(--accent-blue, #10b981)' : C.textFaint,
            }}>{d}</div>
          ))}
          <div style={{ width: 44 }} />
        </div>
      </Card>

      {safeHabits.length === 0 ? (
        <Card style={{ padding: 0, background: 'var(--bg-card, #101c17)' }}>
          <Empty
            icon={CheckCircle2}
            accent={C.green}
            title="No habits created yet"
            description="Build your first daily routine — reading, homework review, problem solving — and grow your streak."
            action={() => setShowModal(true)}
            actionLabel="Add First Habit"
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {safeHabits.map(h => (
            <div key={h.id} className="hover-lift" style={{
              background: 'var(--bg-card, #101c17)',
              border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{h.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#fb923c', marginTop: 2, fontWeight: 700 }}>
                  <Flame size={12} /> {h.streak} day streak
                </div>
              </div>
              {h.completedDays.map((done, i) => (
                <button key={i} onClick={i === todayIdx ? () => toggleToday(h.id) : undefined}
                  aria-label={i === todayIdx ? 'Toggle today' : undefined}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: `1px solid ${done ? 'rgba(34, 197, 94, 0.5)' : C.border}`,
                    background: done ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                    cursor: i === todayIdx ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#4ade80',
                    opacity: i > todayIdx ? 0.35 : 1,
                    transition: 'all 0.12s ease',
                    boxShadow: i === todayIdx ? '0 0 0 1px rgba(59, 130, 246, 0.4)' : 'none',
                  }}
                >{done ? <Check size={13} strokeWidth={3} /> : ''}</button>
              ))}
              <button onClick={() => deleteHabit(h.id)} aria-label="Delete habit" style={{
                marginLeft: 8, background: 'none', border: 'none', color: C.textFaint,
                cursor: 'pointer', padding: 4, display: 'flex', transition: 'color 0.15s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                onMouseLeave={e => e.currentTarget.style.color = C.textFaint}
              ><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>New Habit</h2>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 700 }}>Habit Name</label>
          <input
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Solve 5 Chemistry numericals"
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--accent-blue, #10b981)' }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>Accent</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(col => (
              <button key={col} onClick={() => setForm(f => ({ ...f, color: col }))} aria-label={`Color ${col}`} style={{
                width: 24, height: 24, borderRadius: '50%', background: col,
                border: form.color === col ? '2px solid white' : '2px solid transparent', cursor: 'pointer',
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowModal(false)} style={{ ...btnGhost, color: C.textMuted }}>Cancel</button>
          <button onClick={addHabit} style={btnPrimary}>Add Habit</button>
        </div>
      </Modal>
    </div>
  )
}
