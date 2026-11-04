import { Component } from 'react'
import { ArrowCounterClockwise, Warning, Broom, CaretDown, CaretRight } from '@phosphor-icons/react'

// Material You Iris Indigo tonal styling — no beige, no green.
// Shows the exact error + stack trace for transparent debugging.

const STUDYPULSE_STATE_KEYS = [
  'studypulse-auth', 'studypulse-events', 'studypulse-assignments',
  'studypulse-grades', 'studypulse-flashcards', 'studypulse-notes',
  'studypulse-calendar', 'studypulse-pomodoro', 'studypulse-ui',
  'studypulse-xp', 'studypulse-habits', 'studypulse-study-plans',
  'studypulse-learner', 'studypulse-sql-pulse', 'studypulse-exams',
  'studypulse-quiz-history', 'studypulse-leaderboard',
  'studypulse-custom-books', 'studypulse-highlights', 'studypulse-reading-progress',
  'studypulse-theme-prefs',
]

// Hard reset: unregister every service worker, delete every cache bucket,
// clear cached app state (keeps the Gemini key), then reload.
function hardResetAndReload() {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) r.unregister()
      }).catch(() => {})
    }
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const k of keys) caches.delete(k)
      }).catch(() => {})
    }
    for (const k of STUDYPULSE_STATE_KEYS) {
      try { localStorage.removeItem(k) } catch {}
    }
  } catch {}
  window.location.reload()
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null, showStack: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    this.setState({ info })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { fallback, inline } = this.props

    if (fallback) return fallback

    if (inline) {
      return (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <span style={{ fontFamily: 'var(--md-font-body, sans-serif)', fontSize: 13, color: '#EF4444' }}>
            Component error — refresh to try again
          </span>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: 4 }}
          >
            <ArrowCounterClockwise size={14} />
          </button>
        </div>
      )
    }

    const stackLine = this.state.error?.stack
      ? this.state.error.stack.split('\n').slice(0, 4).join('\n')
      : ''

    return (
      <div style={{
        width: '100%', minHeight: '100vh', background: 'var(--md-bg, #0B0C14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14,
        padding: 32, boxSizing: 'border-box',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Warning size={28} color="#EF4444" />
        </div>
        <p style={{
          fontFamily: 'var(--md-font-serif, serif)', fontSize: 22,
          color: 'var(--md-text, #ECECF6)', letterSpacing: '-0.01em', margin: 0,
        }}>
          Something went wrong
        </p>
        <p style={{
          fontFamily: 'var(--md-font-mono, monospace)', fontSize: 13,
          color: 'var(--md-text, #ECECF6)',
          maxWidth: 560, textAlign: 'center', lineHeight: 1.55, margin: 0,
          wordBreak: 'break-word',
        }}>
          {this.state.error?.message || 'An unexpected error occurred.'}
        </p>

        {/* Exact stack trace — transparent debugging */}
        {stackLine && (
          <div style={{ width: 'min(680px, 100%)' }}>
            <button
              onClick={() => this.setState((s) => ({ showStack: !s.showStack }))}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 8,
                background: 'var(--md-surface-high, #21253E)', border: '1px solid var(--md-outline, rgba(129,140,248,0.18))',
                color: 'var(--md-text-muted, #A6A8C4)', cursor: 'pointer',
                fontFamily: 'var(--md-font-mono, monospace)', fontSize: 10.5,
              }}
            >
              {this.state.showStack ? <CaretDown size={11} /> : <CaretRight size={11} />}
              Stack trace
            </button>
            {this.state.showStack && (
              <pre style={{
                marginTop: 8, padding: '12px 14px', borderRadius: 12,
                background: 'var(--md-surface, #181B2E)', border: '1px solid var(--md-outline, rgba(129,140,248,0.18))',
                fontFamily: 'var(--md-font-mono, monospace)', fontSize: 10.5, lineHeight: 1.6,
                color: 'var(--md-text-muted, #A6A8C4)',
                overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '8px 0 0',
              }}>
                {this.state.error.stack}
                {this.state.info?.componentStack ? `\n\n--- component stack ---${this.state.info.componentStack}` : ''}
              </pre>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => { this.setState({ hasError: false, error: null, info: null }); window.location.reload() }}
            style={{
              padding: '10px 20px', borderRadius: 999, cursor: 'pointer',
              background: 'var(--md-primary, #818CF8)', border: 'none',
              color: 'var(--md-on-primary, #1E1B4B)', fontFamily: 'var(--md-font-body, sans-serif)', fontSize: 13, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <ArrowCounterClockwise size={14} weight="bold" /> Reload Workspace
          </button>
          <button
            onClick={hardResetAndReload}
            style={{
              padding: '10px 20px', borderRadius: 999, cursor: 'pointer',
              background: 'var(--md-surface-high, #21253E)', border: '1px solid var(--md-outline, rgba(129,140,248,0.18))',
              color: 'var(--md-text, #ECECF6)', fontFamily: 'var(--md-font-body, sans-serif)', fontSize: 13, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <Broom size={14} weight="bold" /> Hard Reset Cache & Reload
          </button>
        </div>
        <p style={{
          fontFamily: 'var(--md-font-mono, monospace)', fontSize: 10.5,
          color: 'var(--md-text-faint, #6F7294)', marginTop: 6, textAlign: 'center', maxWidth: 460, lineHeight: 1.6,
        }}>
          Hard Reset unregisters service workers, purges corrupted cache buckets, and clears cached app state — your Gemini key is kept.
        </p>
      </div>
    )
  }
}
