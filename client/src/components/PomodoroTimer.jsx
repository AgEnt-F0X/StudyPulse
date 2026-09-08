import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, X, Coffee, Brain, ChevronUp, ChevronDown, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePomodoroStore, useAssignmentsStore, useUIStore } from '../stores'
import { playDing } from '../utils/sounds'

const fmt = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const PomodoroTimer = () => {
  const location = useLocation()
  const {
    isRunning, isBreak, secondsLeft, workSeconds, breakSeconds,
    sessionCount, totalFocusMinutes, activeAssignment,
    start, pause, reset, tick, close, setActiveAssignment,
  } = usePomodoroStore()

  const { assignments } = useAssignmentsStore()
  const { pomodoroSound, setPomodoroSound } = useUIStore()
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef(null)
  const prevIsBreak = useRef(isBreak)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, tick])

  // Play ding when session flips
  useEffect(() => {
    if (prevIsBreak.current !== isBreak) {
      prevIsBreak.current = isBreak
      if (pomodoroSound !== false) playDing(isBreak ? 'break' : 'focus')
    }
  }, [isBreak, pomodoroSound])

  const total = isBreak ? breakSeconds : workSeconds
  const progress = 1 - secondsLeft / total
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  const pending = assignments.filter(a => a.status !== 'graded')
  const accentColor = isBreak ? '#4dff91' : '#c44dff'
  if (location.pathname === '/focus') return null

  if (!visible) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed', bottom: 24, right: 84, zIndex: 90,
          width: 46, height: 46, borderRadius: '50%',
          background: 'var(--bg-card, #101c17)',
          border: '1px solid var(--border-color, #232d42)',
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
        title="Open Pomodoro Timer"
      >
        {isRunning
          ? <span style={{ fontFamily: "'Space Grotesk', monospace", fontSize: 10, fontWeight: 700, color: 'var(--accent-blue, #10b981)' }}>{fmt(secondsLeft)}</span>
          : <Brain size={18} style={{ color: 'var(--accent-blue, #10b981)' }} />
        }
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      style={{
        position: 'fixed', bottom: 24, right: 84, zIndex: 90,
        width: expanded ? 290 : 210,
        borderRadius: 14,
        background: 'var(--bg-card, #101c17)',
        border: `1px solid ${isRunning ? 'rgba(59,130,246,0.45)' : 'var(--border-color, #232d42)'}`,
        boxShadow: '0 12px 36px -8px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        transition: 'width 0.25s ease, border-color 0.3s',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--border-color, #232d42)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isBreak
            ? <Coffee size={14} style={{ color: '#4ade80' }} />
            : <Brain size={14} style={{ color: 'var(--accent-blue, #10b981)' }} />
          }
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: isBreak ? '#4ade80' : 'var(--accent-blue, #10b981)', letterSpacing: '0.04em' }}>
            {isBreak ? 'BREAK' : 'FOCUS'}
          </span>
          {sessionCount > 0 && (
            <span style={{
              marginLeft: 4, padding: '1px 6px', borderRadius: 100,
              background: 'rgba(59,130,246,0.15)',
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color: 'var(--accent-blue, #10b981)',
            }}>
              ×{sessionCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setPomodoroSound(pomodoroSound === false ? true : false)}
            title={pomodoroSound === false ? 'Enable sounds' : 'Mute sounds'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: 4 }}
          >
            {pomodoroSound === false ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: 4 }}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button
            onClick={() => { close(); setVisible(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: 4 }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Timer ring + time */}
      <div style={{ padding: '16px 14px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flexShrink: 0, position: 'relative', width: 88, height: 88 }}>
          <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="44" cy="44" r={RADIUS} fill="none" stroke="var(--border-color, #232d42)" strokeWidth="5" />
            <motion.circle
              cx="44" cy="44" r={RADIUS}
              fill="none"
              stroke={accentColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ filter: isRunning ? `drop-shadow(0 0 6px ${accentColor})` : 'none', transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Space Grotesk', monospace", fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f0f4fc)', lineHeight: 1 }}>
              {fmt(secondsLeft)}
            </span>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: 'var(--text-muted, #64748b)', marginTop: 4 }}>
              {Math.round((1 - secondsLeft / total) * 100)}%
            </span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {activeAssignment && (
            <p style={{
              fontFamily: "'Manrope', sans-serif", fontSize: 12, color: 'var(--text-secondary, #94a3b8)',
              marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {activeAssignment.title}
            </p>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={isRunning ? pause : start}
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 8,
                background: isRunning ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                border: `1px solid ${isRunning ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
                color: isRunning ? '#f87171' : 'var(--accent-blue, #10b981)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} />}
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700 }}>
                {isRunning ? 'Pause' : 'Start'}
              </span>
            </button>
            <button
              onClick={reset}
              style={{
                padding: '7px 9px', borderRadius: 8,
                background: 'var(--bg-secondary, #0e131f)',
                border: '1px solid var(--border-color, #232d42)',
                color: 'var(--text-muted, #64748b)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RotateCcw size={12} />
            </button>
          </div>
          {totalFocusMinutes > 0 && (
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, color: 'var(--text-muted, #64748b)', marginTop: 6 }}>
              {totalFocusMinutes} min focused today
            </p>
          )}
        </div>
      </div>

      {/* Assignment picker (expanded) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              borderTop: '1px solid var(--border-color, #232d42)',
              padding: '10px 14px 14px',
            }}>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: 8, letterSpacing: '0.06em' }}>
                STUDYING:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                {pending.length > 0 ? pending.slice(0, 6).map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActiveAssignment(a)}
                    style={{
                      padding: '7px 10px', borderRadius: 6, textAlign: 'left',
                      background: activeAssignment?.id === a.id ? 'rgba(59,130,246,0.15)' : 'var(--bg-secondary, #0e131f)',
                      border: `1px solid ${activeAssignment?.id === a.id ? 'rgba(59,130,246,0.35)' : 'var(--border-color, #232d42)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: activeAssignment?.id === a.id ? 'var(--accent-blue, #10b981)' : 'var(--text-secondary, #94a3b8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.title}
                    </p>
                  </button>
                )) : (
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: 'var(--text-muted, #64748b)' }}>
                    No pending assignments
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default PomodoroTimer
