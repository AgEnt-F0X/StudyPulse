import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'
import { SHORTCUT_HELP } from '../hooks/useKeyboardShortcuts'

const extra = [
  { key: 'Ctrl+K', label: 'Open AI Chat' },
  { key: 'Ctrl+Shift+A', label: 'Quick add assignment' },
  { key: '?', label: 'Show this help' },
]

export default function ShortcutModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }}
          />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 301,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, pointerEvents: 'none',
          }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{
              width: 'min(520px, 100%)', pointerEvents: 'auto',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Keyboard size={16} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontFamily: "var(--md-font-body)", fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>KEYBOARD SHORTCUTS</span>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <p style={{ fontFamily: "var(--md-font-body)", fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 10 }}>NAVIGATION</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
                {SHORTCUT_HELP.map(({ key, label }) => (
                  <ShortcutRow key={key} keyStr={key} label={label} />
                ))}
              </div>

              <p style={{ fontFamily: "var(--md-font-body)", fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 10 }}>GLOBAL</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {extra.map(({ key, label }) => (
                  <ShortcutRow key={key} keyStr={key} label={label} />
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontFamily: "var(--md-font-body)", fontSize: 12, color: 'var(--text-muted)' }}>Press Esc or click outside to close</span>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

function ShortcutRow({ keyStr, label }) {
  const keys = keyStr.split('+')
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
      <span style={{ fontFamily: "var(--md-font-body)", fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {keys.map((k, i) => (
          <kbd key={i} style={{
            padding: '2px 7px', borderRadius: 6,
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.25)',
            fontFamily: "var(--md-font-mono)", fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)',
          }}>{k}</kbd>
        ))}
      </div>
    </div>
  )
}
