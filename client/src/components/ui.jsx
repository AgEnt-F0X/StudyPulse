// Shared UI primitives for the Impeccable design system.
import { motion } from 'motion/react'
import { C, fonts, tint, iconBox, card, btnPrimary, btnGhost, radius } from '../utils/theme'

const revealProps = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
}

export function PageHeader({ icon: Icon, title, subtitle, accent = C.blue, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap', marginBottom: 24,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {Icon && (
          <div style={iconBox(accent, 40)}>
            <Icon size={20} weight="duotone" />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontFamily: fonts.heading, fontSize: 22, fontWeight: 700,
            color: C.text, lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em',
          }}>{title}</h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </motion.div>
  )
}

export function Card({ children, style, className = '', onClick, lift }) {
  return (
    <motion.div
      {...revealProps}
      onClick={onClick}
      whileHover={onClick || lift ? { y: -2, borderColor: 'var(--border-color, #2d374e)' } : undefined}
      className={className}
      style={{
        ...card,
        cursor: onClick ? 'pointer' : undefined,
        transition: 'border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

export function StatCard({ icon: Icon, label, value, color = C.blue, sub }) {
  return (
    <motion.div
      {...revealProps}
      whileHover={{ y: -2, borderColor: tint(color, 0.45) }}
      style={{
        ...card,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'border-color 0.15s ease, transform 0.15s ease',
      }}
    >
      {Icon && (
        <div style={iconBox(color, 38)}>
          <Icon size={19} weight="duotone" />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: fonts.heading, fontSize: 22, fontWeight: 700,
          color: C.text, lineHeight: 1.1, letterSpacing: '-0.02em',
        }}>
          {value}
        </div>
        <div style={{
          fontSize: 12, color: C.textMuted, marginTop: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {label}{sub ? <span style={{ color: C.textFaint }}> · {sub}</span> : null}
        </div>
      </div>
    </motion.div>
  )
}

export function SectionTitle({ icon: Icon, children, color = C.blue, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h2 style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: fonts.heading, fontSize: 14.5, fontWeight: 700,
        color: C.text, margin: 0, letterSpacing: '0.01em',
      }}>
        {Icon && <Icon size={15} color={color} strokeWidth={2.4} />}
        {children}
      </h2>
      {action}
    </div>
  )
}

export function Empty({ icon: Icon, title, description, action, actionLabel, accent = C.blue }) {
  return (
    <div className="page-enter" style={{
      textAlign: 'center', padding: '48px 24px',
      background: 'var(--surface-low, #0d1712)',
      border: `1px dashed ${C.border}`,
      borderRadius: radius.lg,
    }}>
      {Icon && (
        <div style={{ ...iconBox(accent, 54), margin: '0 auto 16px' }}>
          <Icon size={24} strokeWidth={1.8} />
        </div>
      )}
      <h3 style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 13, color: C.textMuted, maxWidth: 400, margin: '0 auto 18px', lineHeight: 1.6 }}>
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
        background: 'var(--surface-card-soft, #182033)',
        ...style,
      }}
    />
  )
}

export function Spinner({ size = 20, color = C.blue }) {
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
      <Spinner size={26} />
      <span style={{ fontSize: 13, color: C.textMuted, fontFamily: fonts.body }}>{label}</span>
    </div>
  )
}

export { btnPrimary, btnGhost }
