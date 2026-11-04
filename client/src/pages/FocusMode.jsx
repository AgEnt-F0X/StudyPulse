import { useState, useEffect, useRef } from 'react'
import { Target, Play, Pause, ArrowCounterClockwise, Coffee, Lightning, SpeakerHigh, SpeakerSimpleX, Waveform } from '@phosphor-icons/react'
import { C, fonts, tint } from '../utils/theme'

const PRESETS = [
  { label: '25 / 5', work: 25, brk: 5, mode: 'Work' },
  { label: '50 / 10', work: 50, brk: 10, mode: 'Work' },
  { label: '90 / 20', work: 90, brk: 20, mode: 'Deep work' },
]

const AMBIENT = [
  { key: 'lofi', label: 'Lo-Fi' },
  { key: 'rain', label: 'Rain' },
  { key: 'forest', label: 'Forest' },
  { key: 'white', label: 'White noise' },
]

export default function FocusMode() {
  const [preset, setPreset] = useState(0)
  const [seconds, setSeconds] = useState(PRESETS[0].work * 60)
  const [running, setRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [task, setTask] = useState('')
  const [ambient, setAmbient] = useState(null)
  const [muted, setMuted] = useState(false)
  const intervalRef = useRef(null)

  const total = isBreak ? PRESETS[preset].brk * 60 : PRESETS[preset].work * 60
  const pct = Math.round(((total - seconds) / total) * 100)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            setIsBreak(b => !b)
            return isBreak ? PRESETS[preset].work * 60 : PRESETS[preset].brk * 60
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, isBreak, preset])

  const handlePreset = (i) => {
    setPreset(i)
    setRunning(false)
    setIsBreak(false)
    setSeconds(PRESETS[i].work * 60)
  }

  const reset = () => {
    setRunning(false)
    setIsBreak(false)
    setSeconds(PRESETS[preset].work * 60)
  }

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  const circumference = 2 * Math.PI * 96
  const dash = circumference * (1 - pct / 100)
  const phaseColor = isBreak ? 'var(--md-primary)' : 'var(--primary)'
  const phaseBg = isBreak ? 'rgba(52, 211, 153, 0.10)' : 'var(--accent-blue-soft, rgba(16,185,129,0.12))'
  const phaseBorder = isBreak ? 'rgba(52, 211, 153, 0.35)' : 'rgba(52,211,153,0.30)'

  return (
    <div style={{
      fontFamily: fonts.body, color: C.text,
      minHeight: 'calc(100vh - 140px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>

      <h1 style={{
        display: 'flex', alignItems: 'center', gap: 9,
        fontFamily: fonts.heading, fontSize: 14, fontWeight: 700,
        color: C.textMuted, marginBottom: 20, letterSpacing: '-0.01em',
      }}>
        <Target size={18} weight="duotone" color={C.primary} /> Pomodoro focus
      </h1>

      {/* Segmented Work / Break pill */}
      <div style={{
        display: 'flex', padding: 3, borderRadius: 999, marginBottom: 22,
        background: 'var(--surface-low, #0d1712)',
        border: `1px solid ${C.borderSoft}`,
      }}>
        {['Work', 'Short break', 'Long break'].map((m) => {
          const selected = (m === 'Work' && !isBreak) || (m !== 'Work' && isBreak)
          return (
            <button key={m} onClick={() => setIsBreak(m !== 'Work')} style={{
              padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: selected ? 'var(--accent-blue-soft, rgba(16,185,129,0.12))' : 'transparent',
              color: selected ? C.primary : C.textFaint,
              fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
            }}>{m}</button>
          )
        })}
      </div>

      {/* Phase label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 16px', borderRadius: 999, marginBottom: 26,
        background: phaseBg,
        border: `1px solid ${phaseBorder}`,
        fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
        color: phaseColor, letterSpacing: '0.01em',
      }}>
        {isBreak ? <><Coffee size={13} /> Break time</> : <><Lightning size={13} /> Focus session</>}
      </div>

      {/* SVG Radial Arc — 2px glowing botanical ring */}
      <div style={{ position: 'relative', width: 230, height: 230, marginBottom: 26 }}>
        <svg width="230" height="230" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="115" cy="115" r="96"
            fill="transparent"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
          />
          <circle
            cx="115" cy="115" r="96"
            fill="transparent"
            stroke={phaseColor}
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={dash}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease',
              filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.45))',
            }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 52, fontWeight: 700, color: C.text, lineHeight: 1, letterSpacing: '-0.03em' }}>
            {mins}:{secs}
          </div>
          <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 8, fontFamily: fonts.heading, fontWeight: 600 }}>{pct}% complete</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setRunning(r => !r)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 32px', borderRadius: 8,
          background: running ? 'rgba(248, 113, 113, 0.15)' : 'var(--grad-primary)',
          border: running ? '1px solid rgba(248, 113, 113, 0.35)' : 'none',
          boxShadow: running ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(16,185,129,0.22)',
          color: running ? '#f87171' : '#04120c',
          cursor: 'pointer', fontFamily: fonts.heading, fontSize: 14, fontWeight: 700,
          minWidth: 130,
          transition: 'all 0.15s ease',
        }}>
          {running ? <><Pause size={16} weight="fill" /> Pause</> : <><Play size={16} weight="fill" /> Start session</>}
        </button>
        <button onClick={reset} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '12px 20px', borderRadius: 8,
          border: `1px solid ${C.border}`, background: 'transparent',
          color: C.textMuted, cursor: 'pointer',
          fontFamily: fonts.heading, fontSize: 13, fontWeight: 600,
        }}><ArrowCounterClockwise size={15} weight="bold" /> Reset</button>
      </div>

      {/* Preset selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => handlePreset(i)} style={{
            padding: '6px 16px', borderRadius: 999,
            border: `1px solid ${preset === i ? 'rgba(52,211,153,0.45)' : C.border}`,
            background: preset === i ? 'var(--accent-blue-soft, rgba(16,185,129,0.12))' : 'transparent',
            color: preset === i ? C.primary : C.textMuted,
            cursor: 'pointer', fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
            transition: 'all 0.12s ease',
          }}>{p.label} min</button>
        ))}
      </div>

      {/* Ambient audio dock */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
        padding: '8px 10px', borderRadius: 12,
        background: 'var(--bg-card)', border: `1px solid ${C.borderSoft}`,
      }}>
        <button
          onClick={() => setMuted(m => !m)}
          title={muted ? 'Unmute ambient' : 'Mute ambient'}
          style={{
            display: 'flex', padding: 7, borderRadius: 8, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${C.borderSoft}`, color: C.textMuted,
          }}
        >{muted ? <SpeakerSimpleX size={15} weight="duotone" /> : <SpeakerHigh size={15} weight="duotone" />}</button>
        {AMBIENT.map(a => {
          const selected = ambient === a.key && !muted
          return (
            <button key={a.key} onClick={() => setAmbient(a.key === ambient ? null : a.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${selected ? 'rgba(52,211,153,0.45)' : C.borderSoft}`,
              background: selected ? 'var(--accent-blue-soft, rgba(16,185,129,0.12))' : 'transparent',
              color: selected ? C.primary : C.textMuted,
              fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
            }}>
              {selected && <Waveform size={13} weight="bold" className="pulse" />}{a.label}
            </button>
          )
        })}
      </div>

      {/* Current task */}
      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <input
          value={task}
          onChange={e => setTask(e.target.value)}
          placeholder="What are you focusing on?"
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 8,
            background: 'var(--bg-card)', border: `1px solid ${C.border}`,
            color: C.text, fontSize: 13.5, fontFamily: fonts.body,
            textAlign: 'center', boxSizing: 'border-box', outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)' }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
        />
      </div>
    </div>
  )
}
