import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gear, ArrowsClockwise, Eye, EyeSlash, Check, SignOut, ArrowCounterClockwise, Sparkle, Key, Lightning, ArrowSquareOut } from '@phosphor-icons/react'
import { useAuthStore, useUIStore, useAssignmentsStore, useEventStore, useGradesStore, useNotesStore, useFlashcardsStore } from '../stores'
import { C, fonts, tint, inputStyle, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader, Card } from '../components/ui'
import { GoogleLogo } from '../components/GoogleButton'
import { hasClientKey, getKeyProvider } from '../utils/gemini'
import { DEMO_COURSES, DEMO_ASSIGNMENTS, DEMO_EVENTS, DEMO_GRADES, DEMO_NOTES, DEMO_COURSE_WEIGHTS, DEMO_DECKS, DEMO_QUIZ_HISTORY, DEMO_LEADERBOARD } from '../utils/demoData'

function Section({ title, children }) {
  return (
    <Card style={{ padding: '22px 24px', marginBottom: 18, background: 'var(--bg-card, #101c17)' }}>
      <h2 style={{
        fontFamily: fonts.heading, fontSize: 11.5, fontWeight: 700, color: C.textFaint,
        letterSpacing: '0.01em', marginBottom: 16, textTransform: 'none',
      }}>{title}</h2>
      {children}
    </Card>
  )
}

function timeAgo(ts) {
  if (!ts) return null
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout, loginWithGoogle, clearGoogleAuth, isGoogleConnected } = useAuthStore()
  const { geminiApiKey, setGeminiApiKey, addToast } = useUIStore()
  const { syncClassroom, syncing, lastSynced } = useAssignmentsStore()
  const [keyInput, setKeyInput] = useState(geminiApiKey || localStorage.getItem('gemini-api-key') || '')
  const [keySaved, setKeySaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const connected = isGoogleConnected()

  const handleSync = async () => {
    try {
      const r = await syncClassroom()
      addToast({ type: 'success', message: `Synced ${r.courses} courses · ${r.assignments} assignments from Classroom` })
    } catch (e) {
      if (e?.name === 'ClassroomAuthError') {
        addToast({ type: 'error', message: 'Google session expired — reconnecting…' })
        loginWithGoogle().catch(() => {})
      } else {
        addToast({ type: 'error', message: e?.message || 'Classroom sync failed' })
      }
    }
  }

  const saveKey = () => {
    const trimmed = keyInput.trim()
    setGeminiApiKey(trimmed)
    localStorage.setItem('gemini-api-key', trimmed)
    setKeySaved(true)
    addToast({ type: 'success', message: trimmed ? 'AI API Key activated!' : 'API Key cleared' })
    setTimeout(() => setKeySaved(false), 2500)
  }

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.name || 'Student'
  const userInitial = userName[0]?.toUpperCase() || 'S'

  const activeProvider = getKeyProvider()

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 720, margin: '0 auto' }}>
      <PageHeader
        icon={Gear}
        accent={C.blue}
        title="Settings"
        subtitle="AI API keys, Classroom integrations, and sample curriculum"
      />

      {/* AI Key Section */}
      <Section title="AI Intelligence & Provider Key">
        <div style={{ marginBottom: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: hasClientKey() ? 'rgba(34, 197, 94, 0.08)' : 'rgba(59, 130, 246, 0.08)',
            border: `1px solid ${hasClientKey() ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: hasClientKey() ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: hasClientKey() ? '#4ade80' : C.blue
              }}>
                <Lightning size={16} weight="duotone" />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, fontFamily: fonts.heading }}>
                  {hasClientKey() ? `Active Engine: ${activeProvider}` : 'Instant Local AI Engine'}
                </div>
                <div style={{ fontSize: 11.5, color: C.textMuted }}>
                  {hasClientKey() ? 'Ultra-low latency intelligent study assistant active' : 'Runs instant CBSE study assistant offline'}
                </div>
              </div>
            </div>
            <span style={{
              padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: fonts.heading,
              color: hasClientKey() ? '#4ade80' : C.blue,
              background: hasClientKey() ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.12)',
              border: `1px solid ${hasClientKey() ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
            }}>
              {hasClientKey() ? 'Connected' : 'Local Ready'}
            </span>
          </div>

          <label style={{ display: 'block', fontSize: 13, color: C.text, marginBottom: 6, fontWeight: 700 }}>
            Paste Free API Key (Groq / Gemini / OpenRouter)
          </label>
          <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
            Paste any free key below. StudyPulse automatically detects the provider prefix:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--surface-low, #0d1712)', border: `1px solid ${C.border}`, fontSize: 12 }}>
              <span style={{ color: C.blue, fontWeight: 700 }}>Groq — recommended (~300 t/s)</span>: Free Llama 3.3 70B & DeepSeek R1.{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: 'underline', fontWeight: 600 }}>
                Get free Groq key <ArrowSquareOut size={10} style={{ display: 'inline', verticalAlign: '-1px' }} />
              </a>
            </div>
            <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--surface-low, #0d1712)', border: `1px solid ${C.border}`, fontSize: 12 }}>
              <span style={{ color: C.blue, fontWeight: 700 }}>Google Gemini</span>: Free Gemini 2.0 Flash.{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: 'underline', fontWeight: 600 }}>
                Get free Gemini key <ArrowSquareOut size={10} style={{ display: 'inline', verticalAlign: '-1px' }} />
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Paste your key: gsk_... or AIza... or sk-or-..."
              style={{ ...inputStyle, flex: 1, width: 'auto' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-blue, #10b981)' }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
            <button onClick={() => setShowKey(s => !s)} aria-label={showKey ? 'Hide key' : 'Show key'} style={{
              padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: 'transparent', color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
              {showKey ? <EyeSlash size={15} /> : <Eye size={15} />}
            </button>
            <button onClick={saveKey} style={{
              ...btnPrimary,
              background: keySaved ? '#22c55e' : 'var(--accent-blue, #10b981)',
              minWidth: 90,
            }}>
              {keySaved ? <><Check size={14} /> Saved</> : 'Save Key'}
            </button>
          </div>
        </div>
      </Section>

      {/* Profile */}
      <Section title="Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: 'var(--accent-blue, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: fonts.heading, fontWeight: 700, fontSize: 18, color: '#ffffff',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
          }}>
            {userInitial}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{userName}</div>
            <div style={{ fontSize: 12.5, color: C.textMuted }}>{user?.email || 'Local Student Session'}</div>
          </div>
        </div>
      </Section>

      {/* Integrations */}
      <Section title="Integrations">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GoogleLogo size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Google Classroom</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              {connected
                ? `Connected${lastSynced ? ` · synced ${timeAgo(lastSynced)}` : ''}`
                : 'Import your courses, assignments and grades automatically.'}
            </div>
          </div>
          <span style={{
            padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            fontFamily: fonts.heading, flexShrink: 0,
            color: connected ? '#4ade80' : C.textMuted,
            background: connected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${connected ? 'rgba(34, 197, 94, 0.3)' : C.border}`,
          }}>{connected ? 'Connected' : 'Not connected'}</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {connected ? (
            <>
              <button onClick={handleSync} disabled={syncing} style={{
                ...btnPrimary,
                cursor: syncing ? 'not-allowed' : 'pointer',
                opacity: syncing ? 0.7 : 1,
              }}>
                <ArrowsClockwise size={14} className={syncing ? 'spin' : ''} /> {syncing ? 'Syncing…' : 'Sync now'}
              </button>
              <button onClick={() => { clearGoogleAuth(); addToast({ type: 'info', message: 'Disconnected from Google Classroom' }) }} style={{ ...btnGhost, color: C.textMuted }}>
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={() => loginWithGoogle().catch(() => {})} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: '#ffffff', color: '#090d16', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: fonts.heading, fontSize: 12.5, fontWeight: 700,
            }}><GoogleLogo size={15} /> Connect Google Classroom</button>
          )}
        </div>
      </Section>

      {/* CBSE Sample Data Reset */}
      <Section title="Data & Sample Content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Reset to CBSE Class 11 Subjects</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              Loads clean sample assignments, notes & flashcards for Physics, Chemistry, Maths & Biology.
            </div>
          </div>
          <button
            onClick={() => {
              useAssignmentsStore.getState().setCourses(DEMO_COURSES)
              useAssignmentsStore.getState().setAssignments(DEMO_ASSIGNMENTS)
              useEventStore.getState().setEvents(DEMO_EVENTS)
              useNotesStore.getState().replaceNotes(DEMO_NOTES)
              useFlashcardsStore.getState().replaceDecks(DEMO_DECKS)
              Object.entries(DEMO_GRADES).forEach(([id, g]) => useGradesStore.getState().setCourseGrades(id, g))
              Object.entries(DEMO_COURSE_WEIGHTS).forEach(([id, w]) => useGradesStore.getState().setCourseWeights(id, w))
              localStorage.setItem('studypulse-quiz-history', JSON.stringify(DEMO_QUIZ_HISTORY))
              localStorage.setItem('studypulse-leaderboard', JSON.stringify(DEMO_LEADERBOARD))
              localStorage.setItem('studypulse_seed_version', 'v4_cbse_clean')
              addToast({ type: 'success', message: 'Loaded CBSE Class 11 subjects & study notes!' })
            }}
            style={{
              ...btnPrimary,
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 12.5, padding: '8px 14px',
            }}
          >
            <ArrowCounterClockwise size={13} /> Load CBSE Samples
          </button>
        </div>
      </Section>

      {/* Account */}
      <Section title="Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => { Promise.resolve(logout?.()).finally(() => navigate('/home')) }} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '10px 14px', borderRadius: 8,
            border: `1px solid ${C.border}`, background: 'transparent',
            color: C.text, cursor: 'pointer', textAlign: 'left',
            fontFamily: fonts.heading, fontSize: 13, fontWeight: 600,
            transition: 'border-color 0.15s ease',
          }}><SignOut size={14} /> Reset Session</button>
        </div>
      </Section>
    </div>
  )
}
