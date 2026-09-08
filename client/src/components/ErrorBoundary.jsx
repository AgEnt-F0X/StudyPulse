import { Component } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { fallback, inline } = this.props

    if (fallback) return fallback

    if (inline) {
      return (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#f87171' }}>
            Component error — refresh to try again
          </span>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', padding: 4 }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )
    }

    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary, #0a120e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
        padding: 32,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={28} color="#ef4444" />
        </div>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700,
          color: 'var(--text-primary, #f0f4fc)', letterSpacing: '-0.01em', margin: 0,
        }}>
          Something went wrong
        </p>
        <p style={{
          fontFamily: "'Manrope', sans-serif", fontSize: 14, color: 'var(--text-secondary, #94a3b8)',
          maxWidth: 420, textAlign: 'center', lineHeight: 1.5, margin: 0,
        }}>
          {this.state.error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
          style={{
            marginTop: 8,
            padding: '11px 22px', borderRadius: 10, cursor: 'pointer',
            background: 'var(--accent-blue, #10b981)', border: 'none',
            color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
          }}
        >
          <RefreshCw size={14} /> Reload App
        </button>
      </div>
    )
  }
}
