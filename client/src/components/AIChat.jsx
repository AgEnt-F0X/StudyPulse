import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, PaperPlaneRight, ArrowClockwise, SpinnerGap } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { callGeminiWithMeta, hasClientKey, getKeyProvider } from '../utils/gemini'
import { buildTutorRequest, extractStructured, AI_MODES, MODE_IDS, isModeId } from '../utils/aiModes'
import { executeAIAssistantCommand } from '../utils/aiActions'
import { useAuthStore, useAssignmentsStore, useNotesStore, useFlashcardsStore, useStudyPlansStore, usePomodoroStore, useHabitsStore, useXPStore } from '../stores'
import { calcStreak } from '../stores'
import { C, fonts } from '../utils/theme'
import MarkdownContent from './MarkdownContent'

const MODE_LABELS = MODE_IDS.map(id => AI_MODES[id].short)

const ACTION_INTENT_RE = /^(add|create|generate|make|build|summar\w*|quiz|test me|flashcard|evaluate|check|grade|mark|review|solve|derive)\b/i

const QUICK_PROMPTS = [
  'What should I work on first?',
  'Grade my answer against the CBSE scheme',
  'Explain wave-particle duality with an execution trace',
  'Add assignment: Physics numericals due Friday',
]

// Offline heuristic responder — no key required, real data only.
const getLocalResponse = (message, assignments) => {
  const msg = message.toLowerCase()
  const pending = assignments.filter(a => a.status !== 'graded')

  if (msg.includes('due') || msg.includes('deadline') || msg.includes('week') || msg.includes('first') || msg.includes('priorit')) {
    const upcoming = pending
      .filter(a => a.dueDate && new Date(a.dueDate) <= new Date(Date.now() + 7 * 86400000))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    if (upcoming.length > 0) {
      return `Due within 7 days (${upcoming.length}):\n\n${upcoming.map(a =>
        `- ${a.title} (${a.courseName}) — ${new Date(a.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
      ).join('\n')}\n\nStart with ${upcoming[0].title} — nearest deadline.`
    }
    return 'Nothing due in the next 7 days.'
  }

  if (msg.includes('plan') || msg.includes('schedule') || msg.includes('generat')) {
    return `Study plans are generated from your ${pending.length} pending assignments. Open Study Plans and run Generate Plan.`
  }

  if (msg.includes('help') || msg.includes('hi') || msg.includes('hello')) {
    return `Diagnostic tutor, offline engine. I can see ${pending.length} pending assignments.\n\nWithout an API key (Settings → AI Engine) I handle scheduling queries only. With a key, switch modes above: HINT diagnoses the flaw in your attempt, CBSE grades to the marking scheme, DEEP traces the mechanism.`
  }

  if (pending.length > 0) {
    const soonest = pending.filter(a => a.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
    return soonest
      ? `Nearest deadline: **${soonest.title}** (${soonest.courseName}) — ${new Date(soonest.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.`
      : `${pending.length} pending, none dated.`
  }
  return 'No pending work. Configure an API key in Settings to enable the tutor modes.'
}

const AIChat = ({ onClose }) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { assignments, addAssignment } = useAssignmentsStore()
  const { addNote } = useNotesStore()
  const { addDeck, addCard } = useFlashcardsStore()
  const { addStudyPlan } = useStudyPlansStore()

  // Live telemetry for the header strip
  const { isRunning, isBreak, secondsLeft, dailyFocusLog } = usePomodoroStore()
  const habits = useHabitsStore((s) => s.habits)
  const xp = useXPStore((s) => s.xp)
  const focusStreak = useMemo(() => calcStreak(dailyFocusLog || {}), [dailyFocusLog])
  const habitStreak = useMemo(() => (habits || []).reduce((m, h) => Math.max(m, h.streak || 0), 0), [habits])
  const pendingCount = useMemo(() => (assignments || []).filter(a => a.status !== 'graded' && !a.completed).length, [assignments])

  const [mode, setMode] = useState('hint')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [lastFailure, setLastFailure] = useState(null) // { text, kind }
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const hasKey = hasClientKey()
  const provider = getKeyProvider()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, generating])

  // Ctrl+Enter from the status bar / global handler + external prefill (SQL Pulse tutor hand-off)
  useEffect(() => {
    const onSend = () => sendMessageRef.current()
    const onFocus = () => textareaRef.current?.focus()
    const onPrefill = (e) => {
      const text = e?.detail?.text || ''
      if (text) setInput(text)
      setTimeout(() => textareaRef.current?.focus(), 60)
    }
    window.addEventListener('studypulse-ai-send', onSend)
    window.addEventListener('studypulse-ai-focus', onFocus)
    window.addEventListener('studypulse-ai-prefill', onPrefill)
    return () => {
      window.removeEventListener('studypulse-ai-send', onSend)
      window.removeEventListener('studypulse-ai-focus', onFocus)
      window.removeEventListener('studypulse-ai-prefill', onPrefill)
    }
  }, [])

  const addMessage = (role, content, extra = {}) => ({
    id: Date.now() + Math.random(),
    role,
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ...extra,
  })

  // Core engine call — mode system prompt + live telemetry injection.
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

  const sendMessage = async (text) => {
    const msgText = (typeof text === 'string' ? text : input).trim()
    if (!msgText || generating) return

    setMessages(prev => [...prev, addMessage('user', msgText)])
    setGenerating(true)
    setInput('')
    setLastFailure(null)

    try {
      // Route: /run and conversational queries → tutor engine; explicit
      // task commands (add/quiz/flashcards/plans/evaluate) → action executor.
      if (hasKey && (msgText.startsWith('/run ') || !ACTION_INTENT_RE.test(msgText))) {
        const res = await tutorCall(msgText, mode)
        if (res.replyText) {
          setMessages(prev => [...prev, addMessage('assistant', res.replyText, { pinned: res.pinned, mode })])
        } else {
          setLastFailure({ text: msgText, kind: res.error })
        }
      } else {
        const stores = { addAssignment, addNote, addDeck, addCard, addStudyPlan, assignments }
        const res = await executeAIAssistantCommand(msgText, stores, hasKey, mode)
        setMessages(prev => [...prev, addMessage('assistant', res.replyText, { actionCard: res.actionCard })])
      }
    } catch {
      setLastFailure({ text: msgText, kind: 'FAILED' })
    }

    setGenerating(false)
  }
  const sendMessageRef = useRef(sendMessage)
  sendMessageRef.current = sendMessage

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const codeActions = {
    onInsert: (content) => {
      setInput((prev) => (prev ? `${prev}\n${content}` : content))
      textareaRef.current?.focus()
    },
    onRun: (content) => sendMessage(`/run ${content}`),
  }

  // Telemetry strip values
  const timerState = isRunning ? (isBreak ? 'BREAK' : 'FOCUS') : 'IDLE'
  const timerStatus = isRunning ? (isBreak ? 'warning' : 'success') : 'neutral'
  const activeSubject =
    (assignments || []).filter(a => a.status !== 'graded' && a.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
    ?.courseName || '—'

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="h-full flex flex-col" style={{ background: C.card }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0"
        style={{ height: 44, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2.5">
          <span style={{
            fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 500,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: C.text,
          }}>
            AI Tutor
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span className={`dot dot-${hasKey ? 'success' : 'warning'}`} />
            <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint }}>
              {hasKey ? provider || 'LLM' : 'offline engine'}
            </span>
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: 4, color: C.textFaint,
              background: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'background 0.12s ease, color 0.12s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textFaint }}
          >
            <X size={15} weight="regular" />
          </button>
        )}
      </div>

      {/* Mode switcher */}
      <div style={{ padding: '10px 12px 0', flexShrink: 0 }}>
        <div style={{
          display: 'flex', gap: 2, padding: 2,
          border: `1px solid ${C.border}`, borderRadius: 4,
          background: C.bgSoft,
        }}>
          {MODE_IDS.map((id) => {
            const active = mode === id
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                title={AI_MODES[id].description}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 3,
                  border: 'none',
                  background: active ? C.cardHover : 'transparent',
                  color: active ? C.text : C.textFaint,
                  cursor: 'pointer',
                  fontFamily: fonts.mono, fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.08em',
                  transition: 'background 0.12s ease, color 0.12s ease',
                }}
              >
                {AI_MODES[id].short}
              </button>
            )
          })}
        </div>
        <p style={{
          fontFamily: fonts.body, fontSize: 11, color: C.textFaint,
          margin: '6px 0 0', lineHeight: 1.4,
        }}>
          {AI_MODES[mode]?.description}
          {isModeId(mode) ? '' : ''}
        </p>
      </div>

      {/* Telemetry strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        margin: '10px 12px 0', padding: '6px 10px',
        border: `1px solid ${C.borderSoft}`, borderRadius: 4,
        background: C.bgSoft,
        fontFamily: fonts.mono, fontSize: 10,
        fontVariantNumeric: 'tabular-nums', color: C.textFaint,
        flexShrink: 0, overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        <span style={{ color: C.textMuted }}>SUBJ <span style={{ color: C.text }}>{activeSubject}</span></span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span className={`dot dot-${timerStatus}`} />
          {timerState} {fmt(secondsLeft)}
        </span>
        <span>STREAK <span style={{ color: Math.max(focusStreak, habitStreak) > 0 ? C.text : C.textFaint }}>{Math.max(focusStreak, habitStreak)}d</span></span>
        <span>PENDING <span style={{ color: pendingCount > 0 ? C.text : C.textFaint }}>{pendingCount}</span></span>
        <span style={{ marginLeft: 'auto' }}>XP <span style={{ color: C.text }}>{xp}</span></span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '14px 12px' }}>
        {messages.length === 0 && (
          <div style={{ padding: '8px 2px' }}>
            <p style={{ fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 8 }}>
              Session queries
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  style={{
                    textAlign: 'left', padding: '7px 10px', borderRadius: 4,
                    background: 'transparent',
                    border: `1px solid ${C.borderSoft}`,
                    color: C.textMuted,
                    fontFamily: fonts.body, fontSize: 12,
                    cursor: 'pointer',
                    transition: 'background 0.12s ease, color 0.12s ease, border-color 0.12s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.border }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.borderSoft }}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: fonts.body, fontSize: 11, color: C.textFaint, marginTop: 10, lineHeight: 1.5 }}>
              Telemetry is injected into every request — the tutor knows your timer state, streak, and pending work.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            style={{ marginBottom: 16 }}
          >
            {/* Message header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{
                fontFamily: fonts.mono, fontSize: 9.5, fontWeight: 500,
                letterSpacing: '0.08em', color: msg.role === 'user' ? C.text : C.textFaint,
              }}>
                {msg.role === 'user' ? 'YOU' : `TUTOR · ${AI_MODES[msg.mode]?.short || 'SYSTEM'}`}
              </span>
              <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                {msg.timestamp}
              </span>
            </div>

            {msg.role === 'user' ? (
              <div style={{
                padding: '8px 12px', borderRadius: 4,
                background: C.cardHover,
                border: `1px solid ${C.border}`,
                fontFamily: fonts.body, fontSize: 13, lineHeight: 1.55,
                color: C.text, whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            ) : (
              <div style={{
                paddingLeft: 12,
                borderLeft: `2px solid ${C.borderStrong}`,
              }}>
                <MarkdownContent content={msg.content} codeActions={codeActions} />

                {/* Pinned structured lines (GUIDING / INVARIANT / MARKS) */}
                {(msg.pinned || []).map((p, i) => (
                  <div key={i} style={{
                    marginTop: 8, padding: '6px 10px',
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

                {/* Action cards */}
                {msg.actionCard?.type === 'assignment' && (
                  <ActionRow
                    dot="success"
                    label={`Added — due ${msg.actionCard.dueDate}`}
                    actionLabel="Open"
                    onClick={() => navigate('/assignments')}
                  />
                )}
                {msg.actionCard?.type === 'save_note' && (
                  <ActionRow
                    dot="success"
                    label="Summary note ready"
                    actionLabel="Save"
                    onClick={() => addNote({ title: msg.actionCard.title, content: msg.actionCard.content, color: '#EDEDED' })}
                  />
                )}
                {msg.actionCard?.type === 'save_flashcards' && msg.actionCard.cards && (
                  <ActionRow
                    dot="success"
                    label={`${msg.actionCard.cards.length} flashcards — ${msg.actionCard.topic}`}
                    actionLabel="Save deck"
                    onClick={() => {
                      const deckId = addDeck({ name: msg.actionCard.topic || 'AI Flashcards', description: 'Generated in tutor' })
                      msg.actionCard.cards.forEach(c => addCard(deckId, { front: c.front, back: c.back }))
                    }}
                  />
                )}
                {msg.actionCard?.type === 'study_plan' && (
                  <ActionRow
                    dot="success"
                    label={`4-week plan — ${msg.actionCard.subject}`}
                    actionLabel="Open"
                    onClick={() => navigate('/study-plans')}
                  />
                )}
                {(msg.actionCard?.type === 'evaluation' || msg.actionCard?.type === 'solution') && (
                  <ActionRow
                    dot="neutral"
                    label={msg.actionCard.type === 'evaluation' ? 'Graded against CBSE scheme' : 'Deep breakdown'}
                  />
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* Generating indicator */}
        {generating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 4px 12px', borderLeft: `2px solid ${C.borderStrong}` }}>
            <SpinnerGap size={13} className="spin" style={{ color: C.textFaint }} />
            <span style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.08em', color: C.textFaint }}>
              {AI_MODES[mode].short} ENGINE
            </span>
          </div>
        )}

        {/* Failure / retry state */}
        {lastFailure && !generating && (
          <div style={{
            margin: '4px 0', padding: '8px 10px',
            borderRadius: 4,
            background: C.bgSoft,
            border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span className="dot dot-error" />
              <span style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textMuted }}>
                {lastFailure.kind === 'RATE_LIMITED' && 'RATE LIMIT — provider throttled. Retry in a moment.'}
                {lastFailure.kind === 'TIMEOUT' && 'TIMEOUT — engine did not respond in 20s.'}
                {lastFailure.kind === 'NO_KEY' && 'NO KEY — add one in Settings → AI Engine.'}
                {['FAILED', 'network', 'auth', 'http_429'].includes(lastFailure.kind) && 'REQUEST FAILED — provider unreachable.'}
                {lastFailure.kind.startsWith('http_') && !['http_429'].includes(lastFailure.kind) && `PROVIDER ERROR — ${lastFailure.kind}`}
              </span>
            </span>
            {lastFailure.kind !== 'NO_KEY' && (
              <button
                onClick={() => {
                  const { text } = lastFailure
                  setLastFailure(null)
                  sendMessage(text)
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 9px', borderRadius: 3,
                  background: C.cardHover, border: `1px solid ${C.border}`,
                  color: C.text, cursor: 'pointer',
                  fontFamily: fonts.mono, fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.06em',
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
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div
          style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            padding: '8px 10px', borderRadius: 4,
            background: C.bgSoft, border: `1px solid ${C.border}`,
            transition: 'border-color 0.13s ease',
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
            className="flex-1 resize-none outline-none"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: fonts.body, color: C.text,
              fontSize: 13, lineHeight: 1.5,
              minHeight: 36, resize: 'none',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || generating}
            title="Send (Enter) — Ctrl+Enter works globally"
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
            <PaperPlaneRight size={13} weight="bold" />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <kbd className="kbd">↵</kbd>
            <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>send</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <kbd className="kbd">⇧↵</kbd>
            <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>newline</span>
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>
            {user?.name || 'local session'}
          </span>
        </div>
      </div>
    </div>
  )
}

const ActionRow = ({ dot, label, actionLabel, onClick }) => (
  <div style={{
    marginTop: 8, padding: '6px 10px', borderRadius: 4,
    background: C.bgSoft, border: `1px solid ${C.borderSoft}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
      <span className={`dot dot-${dot || 'neutral'}`} />
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
          padding: '2px 8px', borderRadius: 3, flexShrink: 0,
          background: C.cardHover, border: `1px solid ${C.border}`,
          color: C.text, cursor: 'pointer',
          fontFamily: fonts.mono, fontSize: 10, fontWeight: 500,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}
      >
        {actionLabel}
      </button>
    )}
  </div>
)

export default AIChat
