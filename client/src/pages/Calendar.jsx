import { useState, useMemo } from 'react'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useEventStore } from '../stores'
import { C, fonts, tint, inputStyle, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader, Card, SectionTitle } from '../components/ui'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

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

export default function Calendar() {
  const { events, addEvent, deleteEvent } = useEventStore()
  const [date, setDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', color: C.blue })

  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = useMemo(() => {
    const arr = []
    for (let i = 0; i < firstDay; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    return arr
  }, [firstDay, daysInMonth])

  const eventsByDay = useMemo(() => {
    const map = {}
    ;(events || []).forEach(e => {
      const d = new Date(e.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(e)
      }
    })
    return map
  }, [events, year, month])

  const upcoming = useMemo(() => {
    const now = new Date()
    return (events || [])
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 8)
  }, [events])

  const handleAdd = () => {
    if (!form.title.trim() || !form.date) return
    addEvent({ ...form, id: Date.now().toString() })
    setForm({ title: '', date: '', time: '', color: C.blue })
    setShowModal(false)
  }

  const prevMonth = () => setDate(new Date(year, month - 1, 1))
  const nextMonth = () => setDate(new Date(year, month + 1, 1))
  const today = new Date()

  const navBtn = {
    background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6,
    color: C.textMuted, cursor: 'pointer', padding: 6, display: 'flex',
    transition: 'color 0.12s ease, border-color 0.12s ease',
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 'min(1240px, 100%)', margin: '0 auto' }}>
      <PageHeader
        icon={CalendarDays}
        accent={C.orange}
        title="Calendar & Deadlines"
        subtitle="CBSE exam schedule, project submissions & assignment deadlines"
        actions={
          <button onClick={() => setShowModal(true)} style={btnPrimary}>
            <Plus size={14} /> Add Event
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Calendar grid */}
        <Card style={{ flex: 1, minWidth: 320, background: 'var(--bg-card, #101c17)' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={prevMonth} aria-label="Previous month" style={navBtn}
              onMouseEnter={e => { e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textMuted }}
            ><ChevronLeft size={16} /></button>
            <span style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.text }}>{MONTHS[month]} {year}</span>
            <button onClick={nextMonth} aria-label="Next month" style={navBtn}
              onMouseEnter={e => { e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textMuted }}
            ><ChevronRight size={16} /></button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.textFaint, padding: '4px 0', fontFamily: fonts.heading, letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {cells.map((d, i) => {
              const isToday = d && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year
              const dayEvents = d ? (eventsByDay[d] || []) : []
              return (
                <div key={i} style={{
                  minHeight: 62, padding: '6px 4px', borderRadius: 8,
                  background: isToday ? 'var(--accent-blue-soft, rgba(59, 130, 246, 0.12))' : 'rgba(255,255,255,0.015)',
                  border: isToday ? '1px solid var(--accent-blue, #10b981)' : `1px solid ${C.borderSoft}`,
                  transition: 'background 0.12s ease',
                }}>
                  {d && (
                    <>
                      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: isToday ? 700 : 600, color: isToday ? C.blue : C.text, marginBottom: 3 }}>{d}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dayEvents.slice(0, 2).map(e => (
                          <div key={e.id} style={{
                            fontSize: 9.5, padding: '2px 4px', borderRadius: 4,
                            background: 'rgba(59, 130, 246, 0.15)', color: C.blue,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600,
                          }}>
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && <div style={{ fontSize: 9, color: C.textFaint, paddingLeft: 4 }}>+{dayEvents.length - 2}</div>}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Upcoming sidebar */}
        <Card style={{ width: 260, flexShrink: 0, alignSelf: 'flex-start', padding: 18, background: 'var(--bg-card, #101c17)' }}>
          <SectionTitle icon={CalendarDays} color={C.orange}>Upcoming Events</SectionTitle>
          {upcoming.length === 0 ? (
            <p style={{ fontSize: 12.5, color: C.textMuted }}>No upcoming events scheduled. Add tests, lab submissions or study sessions.</p>
          ) : upcoming.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.borderSoft}` }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: e.color || C.blue, marginTop: 4, flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{e.title}</div>
                <div style={{ fontSize: 10.5, color: C.textMuted }}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{e.time ? ` · ${e.time}` : ''}</div>
              </div>
              <button onClick={() => deleteEvent(e.id)} aria-label="Delete event" style={{ background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', flexShrink: 0, padding: 2, display: 'flex' }}
                onMouseEnter={ev => ev.currentTarget.style.color = '#f87171'}
                onMouseLeave={ev => ev.currentTarget.style.color = C.textFaint}
              ><Trash2 size={12} /></button>
            </div>
          ))}
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>New Event</h2>
        {[
          { label: 'Title', key: 'title', type: 'text', placeholder: 'e.g. Physics Midterm Exam' },
          { label: 'Date', key: 'date', type: 'date', placeholder: '' },
          { label: 'Time', key: 'time', type: 'time', placeholder: '' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 700 }}>{f.label}</label>
            <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-blue, #10b981)' }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={() => setShowModal(false)} style={{ ...btnGhost, color: C.textMuted }}>Cancel</button>
          <button onClick={handleAdd} style={btnPrimary}>Add Event</button>
        </div>
      </Modal>
    </div>
  )
}
