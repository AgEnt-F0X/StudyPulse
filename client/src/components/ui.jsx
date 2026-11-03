// Shared UI primitives for the Obsidian workbench design system.
import { motion } from 'motion/react'
import { C, fonts, tint, card, btnPrimary, btnGhost, radius, statusDot } from '../utils/theme'

const revealProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.18, ease: 'easeOut' },
}

export function PageHeader({ icon: _Icon, title, subtitle, accent = C.blue, actions, status }) {
  return (
    <motion.div
      {...revealProps}
      style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap', marginBottom: 20,
      }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontFamily: fonts.body, fontSize: 18, fontWeight: 600,
            color: C.text, lineHeight: 1.25, margin: 0, letterSpacing: '-0.02em',
          }}>{title}</h1>
          {subtitle && (
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {(actions || status) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {status && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: C.textFaint,
              fontVariantNumeric: 'tabular-nums',
            }}>
              <span className={`dot dot-${status.kind || 'neutral'}`} />
              {status.label}
            </span>
          )}
          {actions}
        </div>
      )}
    </motion.div>
  )
}

export function Card({ children, style, className = '', onClick, lift }) {
  return (
    <motion.div
      {...revealProps}
      onClick={onClick}
      className={className}
      style={{
        ...card,
        cursor: onClick ? 'pointer' : undefined,
        transition: 'border-color 0.13s ease, background 0.13s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick || lift) e.currentTarget.style.borderColor = C.borderStrong
      }}
      onMouseLeave={(e) => {
        if (onClick || lift) e.currentTarget.style.borderColor = C.border
      }}
    >
      {children}
    </motion.div>
  )
}

// Telemetry cell — hairline-grid panel, mono tabular value, uppercase label
export function StatCard({ icon: _Icon, label, value, color = C.text, sub, status }) {
  return (
    <motion.div
      {...revealProps}
      style={{
        ...card,
        padding: '13px 16px',
        borderRadius: 0,
        boxShadow: 'none',
        background: 'transparent',
        minWidth: 0,
        transition: 'background 0.13s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-card-soft, #18181C)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
      }}>
        {status && <span className={`dot dot-${status}`} />}
        <span className="metric-label">{label}</span>
      </div>
      <div style={{
        fontFamily: fonts.mono, fontSize: 20, fontWeight: 600,
        color: color === C.text ? C.text : color,
        lineHeight: 1.1, letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize: 11, color: C.textFaint, marginTop: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {sub}
        </div>
      )}
    </motion.div>
  )
}

export function SectionTitle({ icon: _Icon, children, color = C.blue, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h2 style={{
        fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 500,
        color: C.textFaint, margin: 0,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {children}
      </h2>
      {action}
    </div>
  )
}

export function Empty({ icon: _Icon, title, description, action, actionLabel, accent = C.blue }) {
  return (
    <div className="page-enter" style={{
      textAlign: 'center', padding: '48px 24px',
      background: 'var(--surface-low, #0C0C0E)',
      border: `1px solid ${C.border}`,
      borderRadius: radius.lg,
    }}>
      <h3 style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6, letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 12.5, color: C.textMuted, maxWidth: 400, margin: '0 auto 18px', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && (
        <button onClick={action} style={btnPrimary}>{actionLabel || 'Get started'}</button>
      )}
    </div>
  )
}

export function Skeleton({ width = '100%', height = 20, borderRadius = radius.md, style }) {
  return (
    <div
      className="pulse"
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--surface-card-soft, #18181C)',
        ...style,
      }}
    />
  )
}

export function Spinner({ size = 18, color = C.textMuted }) {
  return (
    <div
      className="spin"
      style={{
        width: size, height: size,
        border: `2px solid ${tint(color, 0.2)}`,
        borderTopColor: color,
        borderRadius: '50%',
      }}
    />
  )
}

export function PageLoading({ label = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 0' }}>
      <Spinner size={22} />
      <span style={{ fontFamily: fonts.mono, fontSize: 11, color: C.textFaint }}>{label}</span>
    </div>
  )
}

export { btnPrimary, btnGhost, statusDot }
