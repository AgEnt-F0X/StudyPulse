import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { SpinnerGap, ArrowClockwise, Plus } from '@phosphor-icons/react'
import {
  useNotesStore,
  useFlashcardsStore,
  useAssignmentsStore,
  useStudyPlansStore,
  useUIStore,
  usePomodoroStore,
  useHabitsStore,
  useXPStore,
  calcStreak,
} from '../stores'
import { C, fonts } from '../utils/theme'
import { PageHeader } from '../components/ui'
import { hasClientKey, getKeyProvider, callGeminiWithMeta } from '../utils/gemini'
import { executeAIAssistantCommand } from '../utils/aiActions'
import { buildTutorRequest, extractStructured, AI_MODES, MODE_IDS } from '../utils/aiModes'
import MarkdownContent from '../components/MarkdownContent'

const ACTION_INTENT_RE = /^(add|create|generate|make|build|summar\w*|quiz|test me|flashcard|evaluate|check|grade|mark|review|solve|derive)\b/i

const QUICK_COMMANDS = [
  { label: 'Grade my answer against the CBSE scheme', hint: 'CBSE evaluator' },
  { label: 'Diagnose the flaw in my last derivation', hint: 'Diagnostic hint' },
  { label: 'Explain Kirchhoff\'s laws with an execution trace', hint: 'Deep breakdown' },
  { label: 'Generate a 5-question quiz on Thermodynamics', hint: 'Generator' },
  { label: 'Create flashcards for Chemical Bonding', hint: 'Generator' },
  { label: 'Add assignment: Chemistry lab report due Friday', hint: 'Action' },
]

const TelemetryRow = ({ label, value, dot, mono = true }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, padding: '7px 0',
    borderBottom: `1px solid ${C.borderSoft}`,
  }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      {dot && <span className={`dot dot-${dot}`} />}
      <span className="metric-label" style={{ padding: 0 }}>{label}</span>
    </span>
    <span style={{
      fontFamily: mono ? fonts.mono : fonts.body,
      fontSize: mono ? 11 : 12, color: C.text,
      fontVariantNumeric: 'tabular-nums',
      textAlign: 'right', minWidth: 0,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {value}
    </span>
  </div>
)

export default function AIAssistant() {
  const { notes, addNote } = useNotesStore()
  const { decks, addDeck, addCard } = useFlashcardsStore()
  const { assignments, addAssignment } = useAssignmentsStore()
  const { studyPlans, addStudyPlan } = useStudyPlansStore()
  const { addToast, geminiApiKey, setGeminiApiKey } = useUIStore()

  // Live telemetry rail
  const { isRunning, isBreak, secondsLeft, sessionCount, totalFocusMinutes, dailyFocusLog, activeAssignment } = usePomodoroStore()
  const habits = useHabitsStore((s) => s.habits)
  const xpStore = useXPStore()
  const xpProgress = xpStore.getProgress()

  const focusStreak = useMemo(() => calcStreak(dailyFocusLog || {}), [dailyFocusLog])
  const habitStreak = useMemo(() => (habits || []).reduce((m, h) => Math.max(m, h.streak || 0), 0), [habits])
  const pending = useMemo(() => (assignments || []).filter(a => !a.completed && a.status !== 'graded'), [assignments])
  const nearest = useMemo(() => pending
    .filter(a => a.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0], [pending])

  const [mode, setMode] = useState('hint')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [lastFailure, setLastFailure] = useState(null)
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || localStorage.getItem('gemini-api-key') || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const hasKey = hasClientKey()
  const provider = getKeyProvider()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, generating])

  const saveKey = () => {
    const trimmed = apiKeyInput.trim()
    setGeminiApiKey(trimmed)
    localStorage.setItem('gemini-api-key', trimmed)
    setShowKeyInput(false)
    addToast({ type: 'success', message: trimmed ? `AI engine set: ${getKeyProvider()}` : 'API key cleared' })
  }

  const tutorCall = async (text, modeId) => {
    const { system, text: promptText } = buildTutorRequest(modeId, text)
    const result = await callGeminiWithMeta(promptText, { system, timeoutMs: 20000 })
    if (result.ok) {
      const { body, pinned } = extractStructured(result.text)
      return { replyText: body || result.text, pinned }
    }
    return {
      replyText: null,
      error: result.error === 'no_key' ? 'NO_KEY'
        : result.rateLimited ? 'RATE_LIMITED'
        : result.error === 'timeout' ? 'TIMEOUT' : 'FAILED',
    }
  }

  const handleSend = async (textOverride) => {
    const text = (typeof textOverride === 'string' ? textOverride : input).trim()
    if (!text || generating) return

    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: ts }])
    setInput('')
    setGenerating(true)
    setLastFailure(null)

    try {
      if (hasKey && (text.startsWith('/run ') || !ACTION_INTENT_RE.test(text))) {
        const res = await tutorCall(text, mode)
        if (res.replyText) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: res.replyText,
            pinned: res.pinned,
            mode,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }])
        } else {
          setLastFailure({ text, kind: res.error })
        }
      } else {
        const stores = { addAssignment, addNote, addDeck, addCard, addStudyPlan, assignments }
        const result = await executeAIAssistantCommand(text, stores, hasKey, mode)
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.replyText,
          actionCard: result.actionCard,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }])
      }
    } catch {
      setLastFailure({ text, kind: 'FAILED' })
    }

    setGenerating(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const codeActions = {
    onInsert: (content) => {
      setInput((prev) => (prev ? `${prev}\n${content}` : content))
      textareaRef.current?.focus()
    },
    onRun: (content) => handleSend(`/run ${content}`),
  }

  const timerState = isRunning ? (isBreak ? 'BREAK' : 'FOCUS') : 'IDLE'
  const timerStatus = isRunning ? (isBreak ? 'warning' : 'success') : 'neutral'
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 1240, margin: '0 auto' }}>
      <PageHeader
        title="AI Tutor"
        subtitle="Diagnostic hints · CBSE scheme grading · deep concept traces — over your live session data"
        status={hasKey
          ? { kind: 'success', label: provider || 'engine connected' }
          : { kind: 'warning', label: 'offline engine' }}
        actions={
          <button
            onClick={() => setShowKeyInput(s => !s)}
            style={{
              padding: '5px 12px', borderRadius: 4,
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: C.text, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              fontFamily: fonts.body,
              transition: 'background 0.13s ease, border-color 0.13s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            {hasKey ? 'Engine settings' : 'Add API key'}
          </button>
        }
      />

      {/* Key config */}
      {showKeyInput && (
        <div style={{
          padding: '14px 16px', marginBottom: 16, borderRadius: 4,
          background: C.card, border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="metric-label">Engine key — Groq / Gemini / OpenRouter</span>
            <div style={{ display: 'flex', gap: 14 }}>
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textMuted }}>
                console.groq.com ↗
              </a>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textMuted }}>
                aistudio.google.com ↗
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="gsk_… / AIza… / sk-or-…"
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 4,
                background: C.bgSoft, border: `1px solid ${C.border}`,
                color: C.text, fontSize: 13, fontFamily: fonts.mono,
                outline: 'none',
              }}
            />
            <button onClick={saveKey} style={{
              padding: '8px 16px', borderRadius: 4,
              background: C.fill, color: C.fillText,
              border: 'none', cursor: 'pointer',
              fontFamily: fonts.body, fontSize: 12.5, fontWeight: 600,
            }}>
              Save
            </button>
          </div>
        </div>
      )}

      {/* Workbench: telemetry rail + chat */}
      <div className="tutor-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'stretch' }}>
        {/* Left rail */}
        <div style={{
          borderRadius: 4, background: C.card, border: `1px solid ${C.border}`,
          padding: '14px 14px 10px', alignSelf: 'start',
        }}>
          <div className="metric-label" style={{ marginBottom: 6 }}>Session telemetry</div>
          <TelemetryRow label="Timer" value={`${timerState} ${fmt(secondsLeft)}`} dot={timerStatus} />
          <TelemetryRow label="Sessions" value={sessionCount} />
          <TelemetryRow label="Focused" value={`${totalFocusMinutes}m total`} />
          <TelemetryRow label="Focus streak" value={`${focusStreak}d`} dot={focusStreak > 0 ? 'success' : 'neutral'} />
          <TelemetryRow label="Habit streak" value={`${habitStreak}d`} dot={habitStreak > 0 ? 'success' : 'neutral'} />
          <TelemetryRow label="Pending" value={pending.length} dot={pending.length > 0 ? 'warning' : 'success'} />
          <TelemetryRow label="Nearest due" value={nearest ? new Date(nearest.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} />
          <TelemetryRow label="Active task" value={activeAssignment?.title || nearest?.title || '—'} mono={false} />
          <TelemetryRow label="Level" value={`L${xpProgress.cur?.level || 1} · ${xpStore.xp} XP`} />
          <TelemetryRow label="Notes" value={notes?.length || 0} />
          <TelemetryRow label="Decks" value={decks?.length || 0} />
          <TelemetryRow label="Plans" value={studyPlans?.length || 0} />

          <div className="metric-label" style={{ margin: '14px 0 6px' }}>Modes</div>
          {MODE_IDS.map((id) => {
            const active = mode === id
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '8px 10px', marginBottom: 4, borderRadius: 4,
                  background: active ? C.cardHover : 'transparent',
                  border: `1px solid ${active ? C.border : 'transparent'}`,
                  cursor: 'pointer', display: 'block',
                }}
              >
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2,
                  fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 500,
                  letterSpacing: '0.08em',
                  color: active ? C.text : C.textMuted,
                }}>
                  {active && <span style={{ width: 2, height: 8, background: C.text, borderRadius: 1 }} />}
                  {AI_MODES[id].short}
                </span>
                <span style={{ fontFamily: fonts.body, fontSize: 11, color: C.textFaint, lineHeight: 1.4, display: 'block' }}>
                  {AI_MODES[id].description}
                </span>
              </button>
            )
          })}
        </div>

        {/* Chat column */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          borderRadius: 4, background: C.card, border: `1px solid ${C.border}`,
          overflow: 'hidden', minHeight: 520, height: 'calc(100vh - 220px)',
        }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
            {messages.length === 0 && (
              <div>
                <div className="metric-label" style={{ marginBottom: 10 }}>Run a command</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {QUICK_COMMANDS.map(q => (
                    <button
                      key={q.label}
                      onClick={() => handleSend(q.label)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        textAlign: 'left', padding: '9px 12px', borderRadius: 4,
                        background: 'transparent',
                        border: `1px solid ${C.borderSoft}`,
                        cursor: 'pointer',
                        transition: 'background 0.12s ease, border-color 0.12s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = C.border }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.borderSoft }}
                    >
                      <span style={{ fontFamily: fonts.body, fontSize: 12.5, color: C.text }}>{q.label}</span>
                      <span className="metric-label" style={{ padding: 0 }}>{q.hint}</span>
                    </button>
                  ))}
                </div>
                <p style={{ fontFamily: fonts.body, fontSize: 11.5, color: C.textFaint, marginTop: 12, lineHeight: 1.6, maxWidth: 480 }}>
                  Every request carries your session telemetry — active subject, timer state, streaks, pending work — so answers reference your actual data. Code blocks in replies include Insert / Run actions.
                </p>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === 'user'
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  style={{ marginBottom: 18 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{
                      fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 500,
                      letterSpacing: '0.08em', color: isUser ? C.text : C.textFaint,
                    }}>
                      {isUser ? 'YOU' : `TUTOR · ${AI_MODES[m.mode]?.short || 'SYSTEM'}`}
                    </span>
                    <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                      {m.timestamp}
                    </span>
                  </div>

                  {isUser ? (
                    <div style={{
                      padding: '9px 12px', borderRadius: 4,
                      background: C.cardHover,
                      border: `1px solid ${C.border}`,
                      fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                    }}>
                      {m.content}
                    </div>
                  ) : (
                    <div style={{ paddingLeft: 12, borderLeft: `2px solid ${C.borderStrong}` }}>
                      <MarkdownContent content={m.content} codeActions={codeActions} />

                      {(m.pinned || []).map((p, i) => (
                        <div key={i} style={{
                          marginTop: 8, padding: '7px 10px',
                          borderRadius: 4,
                          background: C.bgSoft,
                          border: `1px solid ${C.borderSoft}`,
                          borderLeft: `2px solid ${p.kind === 'guiding' ? C.warning : p.kind === 'marks' ? C.text : C.success}`,
                        }}>
                          <span className="metric-label" style={{ display: 'block', marginBottom: 2, padding: 0 }}>
                            {p.kind === 'guiding' ? 'Guiding question' : p.kind === 'invariant' ? 'Invariant' : 'Marks'}
                          </span>
                          <span style={{ fontFamily: fonts.body, fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
                            {p.text}
                          </span>
                        </div>
                      ))}

                      {m.actionCard?.type === 'save_note' && (
                        <ActionRow
                          label="Summary note ready"
                          actionLabel="Save to notes"
                          onClick={() => {
                            addNote({ title: m.actionCard.title, content: m.actionCard.content, color: '#EDEDED' })
                            addToast({ type: 'success', message: `Saved "${m.actionCard.title}" to Notes` })
                          }}
                        />
                      )}
                      {m.actionCard?.type === 'save_flashcards' && m.actionCard.cards && (
                        <ActionRow
                          label={`${m.actionCard.cards.length} flashcards — ${m.actionCard.topic}`}
                          actionLabel="Save deck"
                          onClick={() => {
                            const deckId = addDeck({ name: m.actionCard.topic || 'AI Flashcards', description: 'Generated in tutor' })
                            m.actionCard.cards.forEach(c => addCard(deckId, { front: c.front, back: c.back }))
                            addToast({ type: 'success', message: 'Deck saved to Flashcards' })
                          }}
                        />
                      )}
                      {m.actionCard?.type === 'assignment' && (
                        <ActionRow
                          label={`Assignment added — due ${m.actionCard.dueDate}`}
                          dot="success"
                        />
                      )}
                      {m.actionCard?.type === 'study_plan' && (
                        <ActionRow
                          label={`4-week plan — ${m.actionCard.subject}`}
                          dot="success"
                        />
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}

            {generating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 4px 12px', borderLeft: `2px solid ${C.borderStrong}` }}>
                <SpinnerGap size={13} className="spin" style={{ color: C.textFaint }} />
                <span style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.08em', color: C.textFaint }}>
                  {AI_MODES[mode].short} ENGINE
                </span>
              </div>
            )}

            {lastFailure && !generating && (
              <div style={{
                padding: '8px 10px', borderRadius: 4,
                background: C.bgSoft, border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span className="dot dot-error" />
                  <span style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textMuted }}>
                    {lastFailure.kind === 'RATE_LIMITED' && 'RATE LIMIT — provider throttled. Retry shortly.'}
                    {lastFailure.kind === 'TIMEOUT' && 'TIMEOUT — engine did not respond in 20s.'}
                    {lastFailure.kind === 'NO_KEY' && 'NO KEY — add one above.'}
                    {lastFailure.kind === 'FAILED' && 'REQUEST FAILED — provider unreachable.'}
                  </span>
                </span>
                {lastFailure.kind !== 'NO_KEY' && (
                  <button
                    onClick={() => {
                      const { text } = lastFailure
                      setLastFailure(null)
                      handleSend(text)
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 9px', borderRadius: 3,
                      background: C.cardHover, border: `1px solid ${C.border}`,
                      color: C.text, cursor: 'pointer',
                      fontFamily: fonts.mono, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em',
                    }}
                  >
                    <ArrowClockwise size={11} weight="bold" /> RETRY
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div
              style={{
                display: 'flex', alignItems: 'flex-end', gap: 8,
                padding: '8px 10px', borderRadius: 4,
                background: C.bgSoft, border: `1px solid ${C.border}`,
              }}
              onClick={() => textareaRef.current?.focus()}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Query in ${AI_MODES[mode].short} mode — telemetry attached automatically`}
                rows={2}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: fonts.body, color: C.text,
                  fontSize: 13, lineHeight: 1.5, resize: 'none', minHeight: 36,
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || generating}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 4,
                  background: input.trim() && !generating ? C.fill : 'transparent',
                  color: input.trim() && !generating ? C.fillText : C.textFaint,
                  border: input.trim() && !generating ? 'none' : `1px solid ${C.border}`,
                  cursor: input.trim() && !generating ? 'pointer' : 'default',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 600 }}>↵</span>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>↵ send · ⇧↵ newline · /run executes a snippet through the mode</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .tutor-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

const ActionRow = ({ label, actionLabel, onClick, dot = 'success' }) => (
  <div style={{
    marginTop: 8, padding: '7px 10px', borderRadius: 4,
    background: C.bgSoft, border: `1px solid ${C.borderSoft}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
      <span className={`dot dot-${dot}`} />
      <span style={{
        fontFamily: fonts.mono, fontSize: 10.5, color: C.textMuted,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </span>
    </span>
    {actionLabel && (
      <button
        onClick={onClick}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 3, flexShrink: 0,
          background: C.cardHover, border: `1px solid ${C.border}`,
          color: C.text, cursor: 'pointer',
          fontFamily: fonts.body, fontSize: 11, fontWeight: 500,
        }}
      >
        <Plus size={11} weight="bold" /> {actionLabel}
      </button>
    )}
  </div>
)
