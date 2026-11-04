import { useRef, useState, useCallback, useEffect } from 'react'

// <Book3D /> — hardware-accelerated CSS-3D hardcover.
// Tilt is driven by CSS custom properties (--rx / --ry / --ss) written
// directly to the DOM node inside a requestAnimationFrame — ZERO React
// re-renders on hover. Click-to-open is the only React state.

export const SUBJECT_ART = {
  physics: { base: '#C77B2B', dark: '#8A5215', light: '#E8A85C', ink: '#FFF6E8', label: 'Physics' },
  chemistry: { base: '#0F7A5C', dark: '#084C38', light: '#2FB489', ink: '#EFFFF7', label: 'Chemistry' },
  maths: { base: '#B45438', dark: '#7A3421', light: '#D97E5F', ink: '#FFF1EA', label: 'Mathematics' },
  cs: { base: '#2B3430', dark: '#171E1A', light: '#46544C', ink: '#D7F5E6', label: 'Computer Science' },
  science: { base: '#157F5B', dark: '#0B4E36', light: '#3AAE85', ink: '#EFFFF7', label: 'Science' },
  english: { base: '#9C5F5F', dark: '#6B3B3B', light: '#C08383', ink: '#FFF0F0', label: 'English' },
  custom: { base: '#6E6455', dark: '#453E32', light: '#978B77', ink: '#F4F0EA', label: 'PDF' },
}

const SIZES = {
  sm: { w: 96, h: 134, t: 14 },
  md: { w: 150, h: 208, t: 20 },
  lg: { w: 196, h: 270, t: 24 },
}

// Deterministic geometric cover art — one pattern family per subject index
function CoverArt({ art, patternIndex }) {
  const stroke = art.ink
  const pid = patternIndex % 4
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 138" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
      {pid === 0 && (
        <>
          <circle cx="50" cy="46" r="26" fill="none" stroke={stroke} strokeWidth="1.2" />
          <circle cx="50" cy="46" r="16" fill="none" stroke={stroke} strokeWidth="1" />
          <line x1="50" y1="72" x2="50" y2="104" stroke={stroke} strokeWidth="1" />
          <line x1="30" y1="104" x2="70" y2="104" stroke={stroke} strokeWidth="1.2" />
        </>
      )}
      {pid === 1 && (
        <>
          <path d="M50 24 L78 76 L22 76 Z" fill="none" stroke={stroke} strokeWidth="1.2" />
          <path d="M50 40 L66 70 L34 70 Z" fill="none" stroke={stroke} strokeWidth="1" />
          <line x1="22" y1="92" x2="78" y2="92" stroke={stroke} strokeWidth="1" />
          <line x1="22" y1="100" x2="78" y2="100" stroke={stroke} strokeWidth="0.6" />
        </>
      )}
      {pid === 2 && (
        <>
          <rect x="30" y="30" width="40" height="40" fill="none" stroke={stroke} strokeWidth="1.2" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="10" fill="none" stroke={stroke} strokeWidth="1" />
          <line x1="34" y1="98" x2="66" y2="98" stroke={stroke} strokeWidth="1" />
          <line x1="40" y1="106" x2="60" y2="106" stroke={stroke} strokeWidth="0.6" />
        </>
      )}
      {pid === 3 && (
        <>
          <path d="M28 78 Q50 30 72 78" fill="none" stroke={stroke} strokeWidth="1.2" />
          <path d="M34 90 Q50 56 66 90" fill="none" stroke={stroke} strokeWidth="1" />
          <circle cx="50" cy="34" r="5" fill="none" stroke={stroke} strokeWidth="1.2" />
          <line x1="30" y1="104" x2="70" y2="104" stroke={stroke} strokeWidth="1" />
        </>
      )}
      <rect x="8" y="8" width="84" height="122" fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.65" />
    </svg>
  )
}

/**
 * @param {object} props
 *  title, subject (display), subjectKey (SUBJECT_ART key), classLevel,
 *  size 'sm'|'md'|'lg', onOpen (click), open (controlled opened state),
 *  flat (disable tilt, for inline hero use), style
 */
export default function Book3D({
  title,
  subject = '',
  subjectKey = 'science',
  classLevel = '',
  size = 'md',
  onOpen,
  open: openProp,
  flat = false,
  style,
}) {
  const art = SUBJECT_ART[subjectKey] || SUBJECT_ART.science
  const dims = SIZES[size] || SIZES.md
  const { w, h, t } = dims
  const wrapRef = useRef(null)
  const sceneRef = useRef(null)
  const shadowRef = useRef(null)
  const rafRef = useRef(null)
  const lastEvent = useRef(null)
  const [selfOpen, setSelfOpen] = useState(false)
  const opened = openProp !== undefined ? openProp : selfOpen

  // rAF-throttled tilt — writes CSS vars straight to the DOM, no setState
  const applyTilt = useCallback(() => {
    rafRef.current = null
    const e = lastEvent.current
    const node = wrapRef.current
    if (!e || !node) return
    const rect = node.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    const ry = x * 22
    const rx = -y * 14
    node.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
    node.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
    node.style.setProperty('--ss', (1 - Math.min(0.3, Math.abs(ry) / 90)).toFixed(3))
    if (sceneRef.current) {
      sceneRef.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(calc(var(--book-base, -26deg) + ${ry.toFixed(2)}deg))`
    }
  }, [])

  const onMouseMove = useCallback((e) => {
    if (flat) return
    lastEvent.current = e
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(applyTilt)
    }
  }, [applyTilt, flat])

  const onMouseLeave = useCallback(() => {
    lastEvent.current = null
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const node = wrapRef.current
    if (node) {
      node.style.setProperty('--ry', '0deg')
      node.style.setProperty('--rx', '0deg')
      node.style.setProperty('--ss', '1')
    }
    if (sceneRef.current) {
      sceneRef.current.style.transform = 'rotateX(0deg) rotateY(var(--book-base, -26deg))'
    }
  }, [])

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
  }, [])

  const handleClick = () => {
    if (onOpen) onOpen()
    else setSelfOpen((o) => !o)
  }

  const pageStriation = `repeating-linear-gradient(90deg, #EFE6D4 0px, #EFE6D4 2px, #D9CDB4 2px, #D9CDB4 3px)`
  const pagesBg = `linear-gradient(180deg, #EFE8D8, #E4DAC2)`
  const baseRy = flat ? '0deg' : '-26deg'

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      className="book3d"
      style={{
        perspective: 1200,
        width: w, height: h + 26,
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        '--book-base': baseRy,
        '--ry': '0deg',
        '--rx': '0deg',
        '--ss': 1,
        ...style,
      }}
    >
      <style>{`
        .book3d .b3d-sheen { opacity: 0; transition: opacity 300ms ease; }
        .book3d:hover .b3d-sheen { opacity: 1; }
        .book3d .b3d-shadow { transition: opacity 300ms ease; opacity: 0.6; }
        .book3d:hover .b3d-shadow { opacity: 0.85; }
        .book3d .b3d-scene { transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1); transform: rotateX(var(--rx, 0deg)) rotateY(var(--book-base, -26deg)); will-change: transform; transform-style: preserve-3d; }
        .book3d:hover .b3d-scene { transition: transform 80ms linear; }
      `}</style>

      {/* Floor shadow — scaled via --ss, no layout cost */}
      <div ref={shadowRef} className="b3d-shadow" style={{
        position: 'absolute', left: '50%', bottom: 0,
        width: w * 0.92, height: 16,
        transform: 'translateX(-50%) scaleX(var(--ss, 1))',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.45), transparent 70%)',
        filter: 'blur(4px)',
        pointerEvents: 'none',
      }} />

      {/* 3D book scene — transform fully driven by CSS vars via rAF */}
      <div ref={sceneRef} className="b3d-scene" style={{
        position: 'absolute', left: 0, top: 4,
        width: w, height: h,
      }}>
        {/* Front cover (swings open around the spine) */}
        <div style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          transformOrigin: 'left center',
          transform: `translateZ(${t / 2}px) rotateY(${opened ? -150 : 0}deg)`,
          transition: 'transform 0.9s cubic-bezier(0.5, 0, 0.2, 1)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '3px 8px 8px 3px',
            background: `linear-gradient(160deg, ${art.light} 0%, ${art.base} 42%, ${art.dark} 100%)`,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14), inset 4px 0 8px rgba(0,0,0,0.28)',
            overflow: 'hidden',
          }}>
            <CoverArt art={art} patternIndex={title.length} />
            {/* Foil-stamped editorial title */}
            <div style={{ position: 'absolute', left: 12, right: 10, top: 12 }}>
              <div style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: size === 'lg' ? 19 : size === 'md' ? 15 : 11,
                lineHeight: 1.1,
                color: art.ink,
                textShadow: '0 1px 0 rgba(0,0,0,0.35), 0 0 12px rgba(212,195,163,0.35)',
                letterSpacing: '-0.01em',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {title}
              </div>
              <div style={{
                marginTop: 5,
                display: 'inline-block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: size === 'sm' ? 6.5 : 8,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: art.ink,
                border: `1px solid ${art.ink}55`,
                borderRadius: 3,
                padding: '1.5px 6px',
                opacity: 0.9,
              }}>
                {art.label}
              </div>
            </div>
            {classLevel && (
              <div style={{
                position: 'absolute', left: 12, bottom: 10,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: size === 'sm' ? 6.5 : 8,
                letterSpacing: '0.14em',
                color: `${art.ink}CC`,
              }}>
                CBSE · {classLevel}
              </div>
            )}
            {/* Specular sheen — CSS hover, zero JS */}
            <div className="b3d-sheen" style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.20) 46%, rgba(255,255,255,0.05) 54%, transparent 66%)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* Back cover */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translateZ(${-t / 2}px)`,
          borderRadius: '8px 3px 3px 8px',
          background: `linear-gradient(200deg, ${art.dark}, ${art.base})`,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3)',
        }} />

        {/* Spine — left face */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          width: t, height: h,
          marginLeft: -t / 2, marginTop: -h / 2,
          transform: `rotateY(-90deg) translateZ(${w / 2}px)`,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${art.dark}, ${art.base} 55%, ${art.dark})`,
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 0',
          overflow: 'hidden',
        }}>
          <div style={{
            writingMode: 'vertical-rl',
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: size === 'lg' ? 13 : size === 'md' ? 11 : 8.5,
            color: art.ink,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            maxWidth: h - 40,
            overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.04em',
          }}>
            {title}
          </div>
          <div style={{
            writingMode: 'vertical-rl',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 7, letterSpacing: '0.18em',
            color: `${art.ink}AA`,
          }}>
            {classLevel || art.label}
          </div>
        </div>

        {/* Page block — right face */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          width: t, height: h - 6,
          marginLeft: -t / 2, marginTop: -(h - 6) / 2,
          transform: `rotateY(90deg) translateZ(${w / 2 - 1}px)`,
          background: pageStriation,
          boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)',
        }} />

        {/* Page block — bottom face */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          width: w - 6, height: t,
          marginLeft: -(w - 6) / 2, marginTop: -t / 2,
          transform: `rotateX(90deg) translateZ(${h / 2 - 2}px)`,
          background: pagesBg,
        }} />

        {/* Inner page revealed when open */}
        {opened && (
          <div style={{
            position: 'absolute', left: 2, top: 3, bottom: 3, width: w - 8,
            transform: `translateZ(${t / 2 - 1}px)`,
            background: 'linear-gradient(180deg, #FBF8F3, #F2EDE0)',
            borderRadius: '2px 6px 6px 2px',
            boxShadow: 'inset 12px 0 22px -10px rgba(20,18,14,0.25)',
            padding: 12,
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 9, color: '#5C5647', lineHeight: 1.7,
            overflow: 'hidden',
          }}>
            {title}
            <div style={{ marginTop: 8, fontSize: 8, color: '#8A8272' }}>
              Chapter pages open in the reader — click again to close the cover.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
