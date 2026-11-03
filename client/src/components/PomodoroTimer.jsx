import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, X, ChevronUp, ChevronDown, Volume2, VolumeX } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePomodoroStore, useAssignmentsStore, useUIStore } from '../stores'
import { playDing } from '../utils/sounds'
import { C, fonts } from '../utils/theme'

const fmt = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const PomodoroTimer = () => {
  const location = useLocation()
  const navigate = useNavigate()
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

  // Semantic status: green = active focus, amber = break, neutral = idle
  const statusKind = !isRunning ? 'neutral' : isBreak ? 'warning' : 'success'
  const statusColor = !isRunning ? C.textFaint : isBreak ? C.warning : C.success
  const stateLabel = !isRunning ? 'IDLE' : isBreak ? 'BREAK' : 'FOCUS'

  const pending = assignments.filter(a => a.status !== 'graded')
  if (location.pathname === '/focus') return null

  if (!visible) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed', bottom: 42, right: 16, zIndex: 90,
          height: 32, padding: '0 10px',
          borderRadius: 4,
          background: C.card,
          border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer',
          fontFamily: fonts.mono, fontSize: 11, fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
          color: C.text,
        }}
        title="Open focus timer"
      >
        {isRunning ? (
          <>
            <span className={`dot dot-${statusKind}`} />
            {fmt(secondsLeft)}
          </>
        ) : (
          <>
            <span className="dot dot-neutral" />
            FOCUS
          </>
        )}
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', bottom: 42, right: 16, zIndex: 90,
        width: expanded ? 280 : 224,
        borderRadius: 6,
        background: C.card,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        transition: 'width 0.18s ease',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: `1px solid ${C.borderSoft}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className={`dot dot-${statusKind}`} />
          <span style={{
            fontFamily: fonts.mono, fontSize: 10, fontWeight: 500,
            letterSpacing: '0.08em', color: statusColor,
          }}>
            {stateLabel}
          </span>
          {sessionCount > 0 && (
            <span className="metric-label" style={{ padding: 0 }}>
              ×{sessionCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => setPomodoroSound(pomodoroSound === false ? true : false)}
            title={pomodoroSound === false ? 'Enable sounds' : 'Mute sounds'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textFaint, padding: 3, display: 'flex' }}
          >
            {pomodoroSound === false ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textFaint, padding: 3, display: 'flex' }}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button
            onClick={() => { close(); setVisible(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textFaint, padding: 3, display: 'flex' }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Timer ring + time */}
      <div style={{ padding: '14px 12px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flexShrink: 0, position: 'relative', width: 80, height: 80 }}>
          <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r={RADIUS} fill="none" stroke={C.border} strokeWidth="3" />
            <circle
              cx="40" cy="40" r={RADIUS}
              fill="none"
              stroke={statusColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: fonts.mono, fontSize: 15, fontWeight: 600,
              color: C.text, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
            }}>
              {fmt(secondsLeft)}
            </span>
            <span className="metric-label" style={{ marginTop: 4, padding: 0 }}>
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {activeAssignment && (
            <p style={{
              fontFamily: fonts.body, fontSize: 12, color: C.textMuted,
              marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {typeof activeAssignment === 'string' ? '' : activeAssignment.title}
            </p>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={isRunning ? pause : start}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 4,
                background: isRunning ? C.cardSoft : C.fill,
                border: `1px solid ${isRunning ? C.border : 'transparent'}`,
                color: isRunning ? C.error : C.fillText,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                fontFamily: fonts.body, fontSize: 12, fontWeight: 500,
              }}
            >
              {isRunning ? <Pause size={12} /> : <Play size={12} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={reset}
              title="Reset timer"
              style={{
                padding: '6px 8px', borderRadius: 4,
                background: 'transparent',
                border: `1px solid ${C.border}`,
                color: C.textMuted, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RotateCcw size={12} />
            </button>
          </div>
          {totalFocusMinutes > 0 && (
            <p style={{
              fontFamily: fonts.mono, fontSize: 10.5, color: C.textFaint,
              marginTop: 8, fontVariantNumeric: 'tabular-nums',
            }}>
              {totalFocusMinutes}m focused
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
              borderTop: `1px solid ${C.borderSoft}`,
              padding: '10px 12px 12px',
            }}>
              <p className="metric-label" style={{ marginBottom: 8 }}>
                Studying
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 140, overflowY: 'auto' }}>
                {pending.length > 0 ? pending.slice(0, 6).map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActiveAssignment(a)}
                    style={{
                      padding: '6px 8px', borderRadius: 4, textAlign: 'left',
                      background: activeAssignment?.id === a.id ? C.cardHover : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{
                      fontFamily: fonts.body, fontSize: 12,
                      color: activeAssignment?.id === a.id ? C.text : C.textMuted,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {a.title}
                    </p>
                  </button>
                )) : (
                  <p style={{ fontFamily: fonts.body, fontSize: 12, color: C.textFaint }}>
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
