import { useRef, useEffect, useState, useMemo } from 'react'
import { Play, Pause, ArrowCounterClockwise } from '@phosphor-icons/react'
import { C, fonts } from '../utils/theme'

// Interactive 3D Concept Lab — canvas-projected 3D visualisers for
// Physics (inclined plane + SHM pendulum), Chemistry (ball-and-stick
// molecules with drag rotation) and Maths (vectors + extruded Venn).
// All rendering is canvas 2D with a hand-rolled 3D projection — no WebGL
// dependency, rAF-driven, paused when idle.

// ── 3D math helpers ───────────────────────────────────────────

function rotatePoint(p, rx, ry) {
  // rotate around Y then X
  const cy = Math.cos(ry), sy = Math.sin(ry)
  let x = p[0] * cy + p[2] * sy
  let z = -p[0] * sy + p[2] * cy
  const cx = Math.cos(rx), sx = Math.sin(rx)
  let y = p[1] * cx - z * sx
  z = p[1] * sx + z * cx
  return [x, y, z]
}

function projectPoint(p, rx, ry, cx, cy, scale, camZ = 4.2) {
  const [x, y, z] = rotatePoint(p, rx, ry)
  const persp = camZ / (camZ - z * 0.9)
  return [cx + x * scale * persp, cy - y * scale * persp, z * persp]
}

function drawArrow3D(ctx, from, to, rx, ry, cx, cy, scale, color, width = 2.2, label = '') {
  const [x1, y1, z1] = projectPoint(from, rx, ry, cx, cy, scale)
  const [x2, y2, z2] = projectPoint(to, rx, ry, cx, cy, scale)
  const depth = Math.min(1, Math.max(0.35, (z1 + z2) / 2 + 0.5))
  ctx.strokeStyle = color
  ctx.globalAlpha = depth
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  // arrowhead
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const hl = 9
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - hl * Math.cos(ang - 0.42), y2 - hl * Math.sin(ang - 0.42))
  ctx.lineTo(x2 - hl * Math.cos(ang + 0.42), y2 - hl * Math.sin(ang + 0.42))
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  if (label) {
    ctx.font = '600 10px "JetBrains Mono", monospace'
    ctx.fillStyle = color
    ctx.fillText(label, x2 + 8, y2 - 6)
  }
  ctx.globalAlpha = 1
}

function drawGridFloor(ctx, rx, ry, cx, cy, scale, half = 2.4) {
  ctx.strokeStyle = 'rgba(52,211,153,0.12)'
  ctx.lineWidth = 1
  for (let i = -Math.round(half); i <= Math.round(half); i++) {
    const a = projectPoint([i, -1.2, -half], rx, ry, cx, cy, scale)
    const b = projectPoint([i, -1.2, half], rx, ry, cx, cy, scale)
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
    const c = projectPoint([-half, -1.2, i], rx, ry, cx, cy, scale)
    const d = projectPoint([half, -1.2, i], rx, ry, cx, cy, scale)
    ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke()
  }
}

function useDPRCanvas(canvasRef, width, height) {
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = width * dpr
    cv.height = height * dpr
    cv.style.width = `${width}px`
    cv.style.height = `${height}px`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [canvasRef, width, height])
}

const CANVAS_W = 520
const CANVAS_H = 360

function Slider({ label, value, min, max, step = 0.1, unit = '', onChange, accent = '#10B981' }) {
  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      <span className="metric-label" style={{ padding: 0, display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color: accent, fontVariantNumeric: 'tabular-nums' }}>{Number(value).toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}{unit}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', marginTop: 4, accentColor: accent, cursor: 'pointer' }}
      />
    </label>
  )
}

function Readout({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
      {items.map((r) => (
        <span key={r.l} style={{
          fontFamily: fonts.mono, fontSize: 10.5, color: C.textMuted,
          background: 'rgba(12,20,16,0.75)', border: `1px solid ${C.borderSoft}`,
          borderRadius: 6, padding: '4px 9px', fontVariantNumeric: 'tabular-nums',
        }}>
          {r.l} <strong style={{ color: r.color || C.text }}>{r.v}</strong>
        </span>
      ))}
    </div>
  )
}

// ═══ PHYSICS 1 — Inclined plane & Newton's laws ═══════════════

function InclineLab() {
  const canvasRef = useRef(null)
  const [theta, setTheta] = useState(25)
  const [mass, setMass] = useState(6)
  const [mu, setMu] = useState(0.25)
  const [playing, setPlaying] = useState(false)
  const stateRef = useRef({ s: 0, t: 0 })
  const rafRef = useRef(null)
  const rot = useRef({ rx: 0.42, ry: 0.5 })
  const drag = useRef(null)
  const params = useRef({ theta, mass, mu })
  params.current = { theta, mass, mu }

  useDPRCanvas(canvasRef, CANVAS_W, CANVAS_H)
  const g = 9.8
  const th = (theta * Math.PI) / 180
  const N = mass * g * Math.cos(th)
  const drive = mass * g * Math.sin(th)
  const f = mu * N
  const a = Math.max(0, g * (Math.sin(th) - mu * Math.cos(th)))

  const render = () => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const { rx, ry } = rot.current
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2 + 26
    const scale = 96
    const { s } = stateRef.current
    const { theta: thDeg, mass: m, mu: muV } = params.current
    const thR = (thDeg * Math.PI) / 180

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    // floor grid
    drawGridFloor(ctx, rx, ry, cx, cy, scale)
    // ground line + ramp
    const rampLen = 2.6
    const pA = projectPoint([-1.3, -1.2, 1.3], rx, ry, cx, cy, scale)
    const pB = projectPoint([1.3, -1.2, 1.3], rx, ry, cx, cy, scale)
    const pTop = projectPoint([-1.3 + rampLen * Math.cos(thR), -1.2 + rampLen * Math.sin(thR), 1.3], rx, ry, cx, cy, scale)
    ctx.fillStyle = 'rgba(30,53,43,0.85)'
    ctx.strokeStyle = 'rgba(52,211,153,0.35)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(pA[0], pA[1]); ctx.lineTo(pB[0], pB[1]); ctx.lineTo(pTop[0], pTop[1]); ctx.closePath()
    ctx.fill(); ctx.stroke()
    // angle arc + label
    ctx.font = '600 10px "JetBrains Mono", monospace'
    ctx.fillStyle = '#F59E0B'
    ctx.fillText(`θ = ${thDeg}°`, pA[0] + 26, pA[1] - 8)

    // block: slides along the incline from the top
    const travel = Math.max(0, rampLen - 0.62)
    const dist = Math.min(travel, s)
    const bx = -1.3 + rampLen * Math.cos(thR) - dist * Math.cos(thR)
    const by = -1.2 + rampLen * Math.sin(thR) - dist * Math.sin(thR)
    const half = 0.26
    // block corners in incline-local coords (along-slope u, normal n)
    const nX = -Math.sin(thR), nY = Math.cos(thR)
    const uX = -Math.cos(thR), uY = Math.sin(thR)
    const corner = (du, dn) => [bx + uX * du + nX * dn, by + uY * du + nY * dn]
    const c1 = projectPoint(corner(-half, 0).concat([1.3]), rx, ry, cx, cy, scale)
    const c2 = projectPoint(corner(half, 0).concat([1.3]), rx, ry, cx, cy, scale)
    const c3 = projectPoint(corner(half, half * 2).concat([1.3]), rx, ry, cx, cy, scale)
    const c4 = projectPoint(corner(-half, half * 2).concat([1.3]), rx, ry, cx, cy, scale)
    ctx.fillStyle = '#D4C3A3'
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.beginPath()
    ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]); ctx.lineTo(c4[0], c4[1])
    ctx.closePath(); ctx.fill(); ctx.stroke()

    // Force arrows from block centre
    const center = [(bx + 0), (by + half * nY + 0.18), 1.3]
    const mag = (m * g) / 40 // px-ish scale per force
    const gEnd = [center[0], center[1] - (m * g) / 24, center[2]]
    drawArrow3D(ctx, center, gEnd, rx, ry, cx, cy, scale, '#EF4444', 2.4, `mg`)
    const nEnd = [center[0] + nX * (N / 24) * 0.35 + Math.cos(thR) * 0.001, center[1] + nY * (N / 24) * 0.35, center[2]]
    drawArrow3D(ctx, center, [center[0] + nX * (N / 26), center[1] + nY * (N / 26), center[2]], rx, ry, cx, cy, scale, '#10B981', 2.4, `N`)
    // driving force along slope (down-slope direction)
    const uDown = [Math.cos(thR), -Math.sin(thR)]
    drawArrow3D(ctx, center, [center[0] + uDown[0] * (drive / 30), center[1] + uDown[1] * (drive / 30), center[2]], rx, ry, cx, cy, scale, '#F59E0B', 2.2, `mg·sinθ`)
    // friction — up-slope, only meaningful when f > 0
    drawArrow3D(ctx, center, [center[0] - uDown[0] * (f / 30), center[1] - uDown[1] * (f / 30), center[2]], rx, ry, cx, cy, scale, '#38BDF8', 2.2, `f=μN`)
  }

  // animation loop — only while playing
  useEffect(() => {
    if (!playing) { render(); return }
    const loop = () => {
      const st = stateRef.current
      const { theta: thDeg, mu: muV } = params.current
      const thR = (thDeg * Math.PI) / 180
      const acc = Math.max(0, 9.8 * (Math.sin(thR) - muV * Math.cos(thR)))
      st.t += 1 / 60
      st.s = Math.max(0, st.s + acc * (1 / 60) * st.t * 0.16)
      const travel = Math.max(0, 2.6 - 0.62)
      if (st.s >= travel) { st.s = travel; setPlaying(false); return }
      render()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing]) // eslint-disable-line

  // re-render on slider changes (static frame)
  useEffect(() => { if (!playing) render() }) // eslint-disable-line

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => {
          if (!drag.current) return
          rot.current.ry += (e.clientX - drag.current.x) * 0.008
          rot.current.rx = Math.max(-0.2, Math.min(1.1, rot.current.rx + (e.clientY - drag.current.y) * 0.006))
          drag.current = { x: e.clientX, y: e.clientY }
          if (!playing) render()
        }}
        onPointerUp={() => { drag.current = null }}
        style={{ borderRadius: 12, background: '#0A1410', border: `1px solid ${C.border}`, cursor: 'grab', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 220 }}>
        <Slider label="Ramp angle θ" value={theta} min={0} max={60} step={1} unit="°" onChange={(v) => { setTheta(v); stateRef.current = { s: 0, t: 0 } }} accent="#F59E0B" />
        <Slider label="Mass m" value={mass} min={1} max={20} step={1} unit=" kg" onChange={(v) => { setMass(v); stateRef.current = { s: 0, t: 0 } }} accent="#EF4444" />
        <Slider label="Friction μ" value={mu} min={0} max={1} step={0.05} onChange={(v) => { setMu(v); stateRef.current = { s: 0, t: 0 } }} accent="#38BDF8" />
        <div style={{ display: 'flex', gap: 8, margin: '10px 0 4px' }}>
          <button onClick={() => { stateRef.current = { s: 0, t: 0 }; setPlaying((p) => !p) }} className="motion-spring" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 15px', borderRadius: 999,
            background: playing ? 'rgba(239,68,68,0.15)' : C.fill,
            color: playing ? C.error : C.fillText,
            border: playing ? `1px solid rgba(239,68,68,0.4)` : 'none',
            fontFamily: fonts.body, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            {playing ? <Pause size={12} /> : <Play size={12} weight="fill" />}
            {playing ? 'Pause' : 'Play simulation'}
          </button>
          <button onClick={() => { stateRef.current = { s: 0, t: 0 }; setPlaying(false); render() }} className="motion-spring" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '7px 12px', borderRadius: 999,
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textMuted, fontFamily: fonts.body, fontSize: 12, cursor: 'pointer',
          }}>
            <ArrowCounterClockwise size={12} /> Reset
          </button>
        </div>
        <Readout items={[
          { l: 'N = mg·cosθ', v: `${N.toFixed(1)} N`, color: '#10B981' },
          { l: 'mg·sinθ', v: `${drive.toFixed(1)} N`, color: '#F59E0B' },
          { l: 'f = μN', v: `${f.toFixed(1)} N`, color: '#38BDF8' },
          { l: 'a = g(sinθ−μcosθ)', v: `${a.toFixed(2)} m/s²`, color: a > 0 ? '#34D399' : '#83907F' },
        ]} />
        <p style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, marginTop: 8, lineHeight: 1.6 }}>
          {a > 0 ? 'Net force down the ramp — the block accelerates.' : 'Friction holds the block — static equilibrium.'}
          {' '}Drag the canvas to orbit the 3D view.
        </p>
      </div>
    </div>
  )
}

// ═══ PHYSICS 2 — SHM pendulum & wave ══════════════════════════

function PendulumLab() {
  const canvasRef = useRef(null)
  const [L, setL] = useState(1.2)
  const [g, setG] = useState(9.8)
  const rot = useRef({ rx: 0.32, ry: 0.3 })
  const drag = useRef(null)
  const tRef = useRef(0)
  const rafRef = useRef(null)
  const params = useRef({ L, g })
  params.current = { L, g }

  useDPRCanvas(canvasRef, CANVAS_W, CANVAS_H)
  const T = 2 * Math.PI * Math.sqrt(L / g)

  const render = () => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const { rx, ry } = rot.current
    const cx = 250, cy = 150
    const scale = 130
    const t = tRef.current
    const { L: Lv, g: gv } = params.current
    const omega = Math.sqrt(gv / Lv)
    const ang = 0.5 * Math.cos(omega * t)

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    drawGridFloor(ctx, rx, ry, 250, 268, 90)
    // ceiling mount
    const mount = projectPoint([0, 1.15, 0], rx, ry, cx, cy, scale)
    ctx.fillStyle = '#263830'
    ctx.fillRect(mount[0] - 34, mount[1] - 6, 68, 8)
    // rod + bob
    const bob = [Math.sin(ang) * Lv, 1.15 - Math.cos(ang) * Lv, 0]
    const pBob = projectPoint(bob, rx, ry, cx, cy, scale)
    ctx.strokeStyle = '#D4C3A3'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(mount[0], mount[1])
    ctx.lineTo(pBob[0], pBob[1])
    ctx.stroke()
    const grd = ctx.createRadialGradient(pBob[0] - 4, pBob[1] - 4, 2, pBob[0], pBob[1], 16)
    grd.addColorStop(0, '#6EE7B7')
    grd.addColorStop(1, '#059669')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(pBob[0], pBob[1], 15, 0, Math.PI * 2)
    ctx.fill()
    // arc guide
    ctx.strokeStyle = 'rgba(52,211,153,0.3)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.arc(mount[0], mount[1], Lv * scale, Math.PI / 2 - 0.5, Math.PI / 2 + 0.5)
    ctx.stroke()
    ctx.setLineDash([])

    // live sine trace of angle
    const traceX0 = 320, traceY = 190
    ctx.strokeStyle = 'rgba(52,211,153,0.25)'
    ctx.beginPath(); ctx.moveTo(traceX0, traceY); ctx.lineTo(traceX0 + 180, traceY); ctx.stroke()
    ctx.strokeStyle = '#34D399'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    for (let i = 0; i <= 180; i++) {
      const tt = t - (180 - i) / 60
      const a2 = 0.5 * Math.cos(omega * tt)
      const y = traceY - a2 * 60
      if (i === 0) ctx.moveTo(traceX0 + i, y)
      else ctx.lineTo(traceX0 + i, y)
    }
    ctx.stroke()
    ctx.font = '600 9px "JetBrains Mono", monospace'
    ctx.fillStyle = '#83907F'
    ctx.fillText('θ(t) — live', traceX0, traceY - 66)
  }

  useEffect(() => {
    const loop = () => {
      tRef.current += 1 / 60
      render()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }) // eslint-disable-line

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => {
          if (!drag.current) return
          rot.current.ry += (e.clientX - drag.current.x) * 0.008
          rot.current.rx = Math.max(-0.2, Math.min(1.0, rot.current.rx + (e.clientY - drag.current.y) * 0.006))
          drag.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerUp={() => { drag.current = null }}
        style={{ borderRadius: 12, background: '#0A1410', border: `1px solid ${C.border}`, cursor: 'grab', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 220 }}>
        <Slider label="Length L" value={L} min={0.2} max={3} step={0.05} unit=" m" onChange={setL} accent="#34D399" />
        <Slider label="Gravity g" value={g} min={1.6} max={24.8} step={0.2} unit=" m/s²" onChange={setG} accent="#F59E0B" />
        <Readout items={[
          { l: 'T = 2π√(L/g)', v: `${T.toFixed(2)} s`, color: '#34D399' },
          { l: 'ω = √(g/L)', v: `${Math.sqrt(g / L).toFixed(2)} rad/s`, color: '#F59E0B' },
          { l: 'f', v: `${(1 / T).toFixed(2)} Hz`, color: '#6EE7B7' },
        ]} />
        <p style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, marginTop: 8, lineHeight: 1.6 }}>
          Small-angle SHM: quadruple L → T doubles. Moon gravity (1.6) makes it swing in slow motion. Drag to orbit.
        </p>
      </div>
    </div>
  )
}

// ═══ CHEMISTRY — ball-and-stick molecular viewer ══════════════

const ELEMENT_COLORS = { C: '#3A3F44', H: '#E8E4DC', O: '#E05252', N: '#4E7FE0', Cl: '#5BC23D', P: '#E0913D' }
const ELEMENT_RADIUS = { C: 26, H: 13, O: 24, N: 24, Cl: 21, P: 24 }

const MOLECULES = {
  CH4: {
    name: 'Methane — CH₄', shape: 'Tetrahedral', angle: '109.5°', hybrid: 'sp³', dipole: 'Non-polar (symmetric)',
    atoms: [
      { el: 'C', p: [0, 0, 0] },
      { el: 'H', p: [0.816, 0.816, 0.816] }, { el: 'H', p: [0.816, -0.816, -0.816] },
      { el: 'H', p: [-0.816, 0.816, -0.816] }, { el: 'H', p: [-0.816, -0.816, 0.816] },
    ],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
  },
  H2O: {
    name: 'Water — H₂O', shape: 'Bent / V-shaped', angle: '104.5°', hybrid: 'sp³', dipole: 'Polar — net dipole toward O',
    atoms: [
      { el: 'O', p: [0, 0, 0] },
      { el: 'H', p: [0.93, -0.31, 0] }, { el: 'H', p: [-0.93, -0.31, 0] },
      { el: 'LP', p: [0.42, 0.82, -0.35] }, { el: 'LP', p: [-0.42, 0.82, -0.35] },
    ],
    bonds: [[0, 1], [0, 2]], dipoleArrow: [[0, 0.35, 0], [0, 1.15, 0]],
  },
  NH3: {
    name: 'Ammonia — NH₃', shape: 'Trigonal pyramidal', angle: '107°', hybrid: 'sp³', dipole: 'Polar',
    atoms: [
      { el: 'N', p: [0, 0.32, 0] },
      { el: 'H', p: [0.9, -0.5, 0.35] }, { el: 'H', p: [-0.9, -0.5, 0.35] }, { el: 'H', p: [0, -0.5, -0.95] },
      { el: 'LP', p: [0, 1.05, 0] },
    ],
    bonds: [[0, 1], [0, 2], [0, 3]],
  },
  PCl5: {
    name: 'Phosphorus pentachloride — PCl₅', shape: 'Trigonal bipyramidal', angle: '90° axial · 120° equatorial', hybrid: 'sp³d', dipole: 'Non-polar',
    atoms: [
      { el: 'P', p: [0, 0, 0] },
      { el: 'Cl', p: [0, 1.25, 0] }, { el: 'Cl', p: [0, -1.25, 0] },
      { el: 'Cl', p: [1.1, 0, 0] }, { el: 'Cl', p: [-0.55, 0, 0.95] }, { el: 'Cl', p: [-0.55, 0, -0.95] },
    ],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
  },
  C6H6: {
    name: 'Benzene — C₆H₆', shape: 'Planar hexagonal ring', angle: '120°', hybrid: 'sp² (delocalised π)', dipole: 'Non-polar',
    atoms: (() => {
      const atoms = [{ el: 'C', p: [0, 0, 0] }]
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3
        atoms.push({ el: 'C', p: [Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05] })
      }
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3
        atoms.push({ el: 'H', p: [Math.cos(a) * 1.75, 0, Math.sin(a) * 1.75] })
      }
      return atoms
    })(),
    bonds: (() => {
      const b = []
      for (let i = 0; i < 6; i++) b.push([0, 1 + i]) // C–H
      for (let i = 0; i < 6; i++) b.push([1 + i, 1 + ((i + 1) % 6)]) // ring
      return b
    })(),
    aromaticRing: true,
  },
}

function MoleculeLab() {
  const canvasRef = useRef(null)
  const [molKey, setMolKey] = useState('CH4')
  const rot = useRef({ rx: 0.35, ry: 0.7 })
  const drag = useRef(null)
  const autoSpin = useRef(true)
  const rafRef = useRef(null)
  const mol = MOLECULES[molKey]

  useDPRCanvas(canvasRef, CANVAS_W, CANVAS_H)

  const render = () => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const { rx, ry } = rot.current
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2
    const scale = 92

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    // depth-sorted rendering
    const projected = mol.atoms.map((a, i) => {
      const [sx, sy, z] = projectPoint(a.p, rx, ry, cx, cy, scale)
      return { i, sx, sy, z, el: a.el }
    })
    // bonds first (depth-weighted)
    for (const [a, b] of mol.bonds) {
      const pa = projected[a], pb = projected[b]
      const depth = Math.min(1, Math.max(0.3, (pa.z + pb.z) / 2 + 0.6))
      ctx.strokeStyle = `rgba(212,195,163,${0.35 + depth * 0.5})`
      ctx.lineWidth = 2 + depth * 2
      ctx.beginPath()
      ctx.moveTo(pa.sx, pa.sy)
      ctx.lineTo(pb.sx, pb.sy)
      ctx.stroke()
    }
    // aromatic inner ring
    if (mol.aromaticRing) {
      ctx.strokeStyle = 'rgba(110,231,183,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      const ring = projected.slice(1, 7)
      ring.forEach((p, i) => { if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy) })
      ctx.closePath()
      ctx.stroke()
    }
    // atoms sorted back-to-front
    projected
      .slice()
      .sort((a, b) => a.z - b.z)
      .forEach((p) => {
        const isLP = p.el === 'LP'
        const r = isLP ? 16 : (ELEMENT_RADIUS[p.el] || 18)
        if (isLP) {
          const g2 = ctx.createRadialGradient(p.sx, p.sy, 2, p.sx, p.sy, r)
          g2.addColorStop(0, 'rgba(167,139,250,0.5)')
          g2.addColorStop(1, 'rgba(167,139,250,0.06)')
          ctx.fillStyle = g2
        } else {
          const col = ELEMENT_COLORS[p.el] || '#888'
          const g2 = ctx.createRadialGradient(p.sx - r * 0.3, p.sy - r * 0.3, r * 0.2, p.sx, p.sy, r)
          g2.addColorStop(0, '#FFFFFF22')
          g2.addColorStop(0.25, col)
          g2.addColorStop(1, '#000000AA')
          ctx.fillStyle = g2
        }
        ctx.beginPath()
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2)
        ctx.fill()
        if (!isLP && (p.el === 'O' || p.el === 'N' || p.el === 'Cl' || p.el === 'P' || p.el === 'C')) {
          ctx.font = '700 10px "JetBrains Mono", monospace'
          ctx.fillStyle = '#F4F0EA'
          ctx.textAlign = 'center'
          ctx.fillText(p.el, p.sx, p.sy + 3.5)
          ctx.textAlign = 'left'
        }
      })
    // dipole arrow
    if (mol.dipoleArrow) {
      drawArrow3D(ctx, mol.dipoleArrow[0], mol.dipoleArrow[1], rx, ry, cx, cy, scale, '#EF4444', 2.4, 'μ')
    }
  }

  useEffect(() => {
    const loop = () => {
      if (autoSpin.current && !drag.current) rot.current.ry += 0.006
      render()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }) // eslint-disable-line

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; autoSpin.current = false; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => {
          if (!drag.current) return
          rot.current.ry += (e.clientX - drag.current.x) * 0.009
          rot.current.rx = Math.max(-1.3, Math.min(1.3, rot.current.rx + (e.clientY - drag.current.y) * 0.007))
          drag.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerUp={() => { drag.current = null }}
        style={{ borderRadius: 12, background: '#0A1410', border: `1px solid ${C.border}`, cursor: 'grab', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {Object.keys(MOLECULES).map((k) => (
            <button key={k} onClick={() => { setMolKey(k); autoSpin.current = true }} className="motion-spring" style={{
              padding: '4px 11px', borderRadius: 999,
              background: molKey === k ? C.active : 'transparent',
              border: `1px solid ${molKey === k ? 'rgba(52,211,153,0.4)' : C.borderSoft}`,
              color: molKey === k ? C.primaryBright : C.textMuted,
              fontFamily: fonts.mono, fontSize: 11, cursor: 'pointer',
            }}>
              {MOLECULES[k].name.split('—')[0].trim()}
            </button>
          ))}
        </div>
        <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 19, margin: '0 0 8px', color: C.text }}>
          {mol.name}
        </h3>
        <Readout items={[
          { l: 'SHAPE', v: mol.shape, color: '#34D399' },
          { l: 'BOND ANGLE', v: mol.angle, color: '#F59E0B' },
          { l: 'HYBRID', v: mol.hybrid, color: '#6EE7B7' },
          { l: 'DIPOLE', v: mol.dipole, color: '#EF4444' },
        ]} />
        <p style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, marginTop: 10, lineHeight: 1.6 }}>
          Drag to rotate across X/Y. Purple clouds are lone pairs — they squeeze the bond angle below the ideal tetrahedral 109.5° (H₂O → 104.5°, NH₃ → 107°). The red arrow on water is the net dipole.
        </p>
      </div>
    </div>
  )
}

// ═══ MATHS — 3D vectors + extruded Venn ═══════════════════════

function VectorLab() {
  const canvasRef = useRef(null)
  const [a, setA] = useState([3, 2, 1])
  const [b, setB] = useState([1, -2, 2])
  const rot = useRef({ rx: 0.42, ry: 0.6 })
  const drag = useRef(null)
  const params = useRef({ a, b })
  params.current = { a, b }

  useDPRCanvas(canvasRef, CANVAS_W, CANVAS_H)
  const cross = [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const magCross = Math.hypot(...cross)

  const render = () => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const { rx, ry } = rot.current
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2 + 30
    const scale = 34
    const { a: va, b: vb } = params.current
    const sum = [va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]]
    const cr = [
      va[1] * vb[2] - va[2] * vb[1],
      va[2] * vb[0] - va[0] * vb[2],
      va[0] * vb[1] - va[1] * vb[0],
    ]

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    drawGridFloor(ctx, rx, ry, cx, cy, scale, 3)
    // axes
    drawArrow3D(ctx, [0, -1.2, 0], [3.4, -1.2, 0], rx, ry, cx, cy, scale, 'rgba(131,144,127,0.8)', 1.2, 'x')
    drawArrow3D(ctx, [0, -1.2, 0], [0, 2.2, 0], rx, ry, cx, cy, scale, 'rgba(131,144,127,0.8)', 1.2, 'y')
    drawArrow3D(ctx, [0, -1.2, 0], [0, -1.2, 3.4], rx, ry, cx, cy, scale, 'rgba(131,144,127,0.8)', 1.2, 'z')
    // vectors
    drawArrow3D(ctx, [0, -1.2, 0], va, rx, ry, cx, cy, scale, '#10B981', 2.6, 'a')
    drawArrow3D(ctx, [0, -1.2, 0], vb, rx, ry, cx, cy, scale, '#F59E0B', 2.6, 'b')
    drawArrow3D(ctx, [0, -1.2, 0], sum, rx, ry, cx, cy, scale, '#FAF7F2', 2.6, 'a+b')
    if (magCross > 0.05) {
      const tip = cr.map((c) => c / Math.hypot(...cr) * Math.min(2.6, Math.hypot(...cr) / 2.2))
      drawArrow3D(ctx, [0, -1.2, 0], tip, rx, ry, cx, cy, scale, '#EF4444', 2.6, 'a×b')
      // normal-plane parallelogram spanned by a and b
      const p1 = projectPoint(va, rx, ry, cx, cy, scale)
      const p2 = projectPoint([va[0] + vb[0], va[1] + vb[1] - 1.2, va[2] + vb[2]], rx, ry, cx, cy, scale)
      const p3 = projectPoint(vb, rx, ry, cx, cy, scale)
      const o = projectPoint([0, -1.2, 0], rx, ry, cx, cy, scale)
      ctx.fillStyle = 'rgba(239,68,68,0.08)'
      ctx.beginPath()
      ctx.moveTo(o[0], o[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1])
      ctx.closePath(); ctx.fill()
    }
  }

  useEffect(() => { render() }) // eslint-disable-line

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => {
          if (!drag.current) return
          rot.current.ry += (e.clientX - drag.current.x) * 0.008
          rot.current.rx = Math.max(-0.2, Math.min(1.1, rot.current.rx + (e.clientY - drag.current.y) * 0.006))
          drag.current = { x: e.clientX, y: e.clientY }
          render()
        }}
        onPointerUp={() => { drag.current = null }}
        style={{ borderRadius: 12, background: '#0A1410', border: `1px solid ${C.border}`, cursor: 'grab', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div className="metric-label" style={{ padding: 0, marginBottom: 6 }}>Vector a</div>
        {[0, 1, 2].map((i) => (
          <Slider key={i} label={`a${['x', 'y', 'z'][i]}`} value={a[i]} min={-4} max={4} step={0.5}
            onChange={(v) => { const n = [...a]; n[i] = v; setA(n) }} accent="#10B981" />
        ))}
        <div className="metric-label" style={{ padding: 0, marginBottom: 6, marginTop: 10 }}>Vector b</div>
        {[0, 1, 2].map((i) => (
          <Slider key={i} label={`b${['x', 'y', 'z'][i]}`} value={b[i]} min={-4} max={4} step={0.5}
            onChange={(v) => { const n = [...b]; n[i] = v; setB(n) }} accent="#F59E0B" />
        ))}
        <Readout items={[
          { l: 'a+b', v: `(${sum.map((v) => v.toFixed(1)).join(', ')})`, color: '#FAF7F2' },
          { l: 'a×b', v: `(${cross.map((v) => v.toFixed(1)).join(', ')})`, color: '#EF4444' },
          { l: '|a×b|', v: magCross.toFixed(2), color: '#EF4444' },
          { l: 'a·b', v: dot.toFixed(2), color: '#34D399' },
        ]} />
        <p style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, marginTop: 8, lineHeight: 1.6 }}>
          a×b always points along the normal of the shaded plane spanned by a and b — its magnitude is the parallelogram area. a·b = 0 means the vectors are perpendicular.
        </p>
      </div>
    </div>
  )
}

// ═══ MATHS — extruded Venn explorer ═══════════════════════════

function VennLab() {
  const [region, setRegion] = useState('union') // union | inter | aOnly | complement
  const canvasRef = useRef(null)
  const nA = 18, nB = 14, nBoth = 7
  const onlyA = nA - nBoth, onlyB = nB - nBoth, nUnion = nA + nB - nBoth, universe = 40

  const REGION_INFO = {
    union: { label: 'A ∪ B', formula: `n(A∪B) = n(A) + n(B) − n(A∩B) = ${nA} + ${nB} − ${nBoth} = ${nUnion}`, fill: ['A', 'B'] },
    inter: { label: 'A ∩ B', formula: `n(A∩B) = ${nBoth} — elements in BOTH sets`, fill: ['AB'] },
    aOnly: { label: 'A − B', formula: `n(A−B) = n(A) − n(A∩B) = ${nA} − ${nBoth} = ${onlyA}`, fill: ['A'] },
    complement: { label: "(A ∪ B)′", formula: `n(U) − n(A∪B) = ${universe} − ${nUnion} = ${universe - nUnion}`, fill: ['U'] },
  }
  const info = REGION_INFO[region]

  const render = () => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2 - 6
    // isometric extruded plane (U)
    const skew = 0.42
    ctx.save()
    ctx.translate(cx, cy)
    ctx.transform(1, skew, 0, 0.86, 0, 0)
    const RA = 92, RB = 86, off = 52
    // U rectangle
    ctx.fillStyle = info.fill.includes('U') ? 'rgba(245,158,11,0.25)' : 'rgba(52,211,153,0.06)'
    ctx.strokeStyle = 'rgba(212,195,163,0.35)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.rect(-170, -108, 340, 216)
    ctx.fill(); ctx.stroke()
    // circle A
    const fillA = info.fill.includes('A') && !info.fill.includes('AB')
    ctx.fillStyle = fillA ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.16)'
    ctx.beginPath(); ctx.arc(-off, 0, RA, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#10B981'; ctx.stroke()
    // circle B
    const fillB = info.fill.includes('B') && !info.fill.includes('AB')
    ctx.fillStyle = fillB ? 'rgba(245,158,11,0.5)' : 'rgba(245,158,11,0.14)'
    ctx.beginPath(); ctx.arc(off, 0, RB, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#F59E0B'; ctx.stroke()
    // intersection lens (clip B ∩ A)
    if (info.fill.includes('AB')) {
      ctx.save()
      ctx.beginPath(); ctx.arc(-off, 0, RA, 0, Math.PI * 2); ctx.clip()
      ctx.fillStyle = 'rgba(239,68,68,0.55)'
      ctx.beginPath(); ctx.arc(off, 0, RB, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
    // labels
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif'
    ctx.fillStyle = '#FAF7F2'
    ctx.fillText('A', -off - 6, -RA - 8)
    ctx.fillText('B', off - 6, -RB - 8)
    ctx.font = '600 10px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(212,195,163,0.6)'
    ctx.fillText('U', -160, -94)
    ctx.restore()
    // extrusion side walls (3D depth illusion)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.moveTo(cx - 170, cy - 108 * 0.86 + skew * -170 + 216 * 0.86 * 0)
    // simple depth slab under the plane
    ctx.rect(cx - 170, cy + 108 * 0.86 + skew * 170 + 4, 340, 10)
    ctx.fill()
  }

  useEffect(() => { render() }, [region]) // eslint-disable-line

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <canvas ref={canvasRef} style={{ borderRadius: 12, background: '#0A1410', border: `1px solid ${C.border}`, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {[['union', 'A ∪ B'], ['inter', 'A ∩ B'], ['aOnly', 'A − B'], ['complement', "(A ∪ B)′"]].map(([id, label]) => (
            <button key={id} onClick={() => setRegion(id)} className="motion-spring" style={{
              padding: '5px 12px', borderRadius: 999,
              background: region === id ? C.active : 'transparent',
              border: `1px solid ${region === id ? 'rgba(52,211,153,0.4)' : C.borderSoft}`,
              color: region === id ? C.primaryBright : C.textMuted,
              fontFamily: fonts.mono, fontSize: 11.5, cursor: 'pointer',
            }}>
              {label}
            </button>
          ))}
        </div>
        <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 19, margin: '0 0 8px', color: C.text }}>
          {info.label}
        </h3>
        <p style={{ fontFamily: fonts.mono, fontSize: 11.5, color: '#34D399', background: 'rgba(12,20,16,0.75)', border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>
          {info.formula}
        </p>
        <p style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, marginTop: 10, lineHeight: 1.6 }}>
          The plane is extruded in isometric 3D — tap each region to see exactly which part of the universe lights up. Board questions love the identity n(A∪B) = n(A) + n(B) − n(A∩B).
        </p>
      </div>
    </div>
  )
}

// ═══ Lab picker ═══════════════════════════════════════════════

const SUBJECT_LABS = {
  Physics: [
    { id: 'incline', label: 'Forces on a ramp', el: <InclineLab /> },
    { id: 'pendulum', label: 'SHM pendulum & wave', el: <PendulumLab /> },
  ],
  Science: [
    { id: 'incline', label: 'Forces on a ramp', el: <InclineLab /> },
    { id: 'pendulum', label: 'SHM pendulum & wave', el: <PendulumLab /> },
  ],
  Chemistry: [
    { id: 'molecules', label: 'Molecular geometry', el: <MoleculeLab /> },
  ],
  Mathematics: [
    { id: 'vectors', label: '3D vectors & cross product', el: <VectorLab /> },
    { id: 'venn', label: 'Extruded Venn explorer', el: <VennLab /> },
  ],
}

export default function Interactive3DLab({ subject = 'Physics' }) {
  const labs = SUBJECT_LABS[subject]
  const [active, setActive] = useState(0)

  if (!labs || labs.length === 0) {
    return (
      <div style={{ padding: '26px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: fonts.body, fontSize: 13, color: C.textMuted, margin: '0 0 6px' }}>
          The hands-on lab for {subject} is the SQL 3D Arena itself.
        </p>
        <p style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textFaint, margin: 0 }}>
          Head to <strong style={{ color: C.primaryBright }}>SQL 3D Arena</strong> in the dock — tables, joins and groups run as physical 3D tiles there.
        </p>
      </div>
    )
  }

  const idx = Math.min(active, labs.length - 1)
  return (
    <div>
      {labs.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
          {labs.map((lab, i) => (
            <button key={lab.id} onClick={() => setActive(i)} className="motion-spring" style={{
              padding: '6px 14px', borderRadius: 999,
              background: idx === i ? C.active : 'transparent',
              border: `1px solid ${idx === i ? 'rgba(52,211,153,0.4)' : C.borderSoft}`,
              color: idx === i ? C.primaryBright : C.textMuted,
              fontFamily: fonts.body, fontSize: 12, fontWeight: idx === i ? 700 : 500,
              cursor: 'pointer',
            }}>
              {lab.label}
            </button>
          ))}
        </div>
      )}
      <div style={{
        borderRadius: 16, padding: '16px 18px',
        background: '#131C18', border: `1px solid ${C.border}`,
        contain: 'layout style paint',
      }}>
        {labs[idx].el}
      </div>
    </div>
  )
}
