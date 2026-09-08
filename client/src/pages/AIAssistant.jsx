import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Send, Bot, User, Check, Plus, BookOpen, Layers,
  Puzzle, ClipboardList, Key, ArrowRight, RotateCcw, FileText, CheckCircle2
} from 'lucide-react'
import {
  useNotesStore,
  useFlashcardsStore,
  useAssignmentsStore,
  useStudyPlansStore,
  useUIStore,
} from '../stores'
import { C, fonts, tint, inputStyle, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader, Card } from '../components/ui'
import { hasClientKey, getKeyProvider } from '../utils/gemini'
import { executeAIAssistantCommand } from '../utils/aiActions'
import MarkdownContent from '../components/MarkdownContent'

const QUICK_ACTIONS = [
  { label: '✅ Evaluate My Answer', prompt: 'Evaluate my answer: ' },
  { label: '🧮 Solve Step-by-Step', prompt: 'Solve step by step: ' },
  { label: '📝 Summarize Notes', prompt: 'Summarize this topic for CBSE exams with key definitions, formulas & tips:\n\n' },
  { label: '🧩 Generate 5-Question Quiz', prompt: 'Generate a 5-question CBSE quiz on: ' },
  { label: '🗂️ Create Flashcards', prompt: 'Create 5 flashcards for: ' },
  { label: '📅 Build 4-Week Study Plan', prompt: 'Create a 4-week CBSE study plan for: ' },
  { label: '✍️ Add Assignment', prompt: 'Add an assignment titled "Chapter 4 Practice" for Physics due in 3 days' },
  { label: '💡 Explain a Concept', prompt: 'Explain the concept of VSEPR Theory in simple terms with examples and shapes.' },
]

export default function AIAssistant() {
  const navigate = useNavigate()
  const { notes, addNote } = useNotesStore()
  const { decks, addDeck, addCard } = useFlashcardsStore()
  const { assignments, addAssignment } = useAssignmentsStore()
  const { studyPlans, addStudyPlan } = useStudyPlansStore()
  const { addToast, geminiApiKey, setGeminiApiKey } = useUIStore()

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **StudyPulse AI Assistant** 🎓.\n\nYou can talk to me, ask me to explain any topic, or tell me to perform actions like:\n• *"Summarize this text: [paste content]"*\n• *"Generate a 5-question quiz on Kinematics"*\n• *"Create flashcards for Chemical Bonding"*\n• *"Add an assignment: Chemistry Lab Report due Friday"*\n• *"Build a study plan for Mathematics"*\n\nWhat would you like to do?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || localStorage.getItem('gemini-api-key') || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const messagesEndRef = useRef(null)

  const hasKey = hasClientKey()
  const activeProvider = getKeyProvider()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const saveKey = () => {
    const trimmed = apiKeyInput.trim()
    setGeminiApiKey(trimmed)
    localStorage.setItem('gemini-api-key', trimmed)
    setShowKeyInput(false)
    addToast({ type: 'success', message: trimmed ? `AI Activated with ${getKeyProvider()}!` : 'API Key cleared' })
  }

  const handleActionExecution = async (userText) => {
    const stores = { addAssignment, addNote, addDeck, addCard, addStudyPlan, assignments }
    return await executeAIAssistantCommand(userText, stores, hasKey)
  }

  const handleSend = async (textToSend) => {
    const text = textToSend || input.trim()
    if (!text || loading) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const result = await handleActionExecution(text)
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.replyText,
          actionCard: result.actionCard,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ])
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing that. Please try again or add a valid AI API key in Settings.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <PageHeader
        icon={Sparkles}
        accent={C.blue}
        title="AI Study Assistant"
        subtitle="Chat, summarize curriculum, generate quizzes, flashcards & study plans"
        actions={
          <button
            onClick={() => setShowKeyInput(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: hasKey ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${hasKey ? 'rgba(34, 197, 94, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`,
              color: hasKey ? '#4ade80' : C.blue,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: fonts.heading,
            }}
          >
            <Key size={12} /> {hasKey ? `${activeProvider} Active` : 'Add Key'}
          </button>
        }
      />

      {/* API Key Quick Bar */}
      {showKeyInput && (
        <Card style={{ padding: '16px 20px', marginBottom: 14, background: 'var(--bg-card, #101c17)', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: fonts.heading }}>Paste API Key (Groq / Gemini / OpenRouter)</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: 'underline', fontWeight: 600 }}>
                Get Groq Key ↗
              </a>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: 'underline', fontWeight: 600 }}>
                Get Gemini Key ↗
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="Paste key: gsk_... or AIza... or sk-or-..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={saveKey} style={btnPrimary}>Save Key</button>
          </div>
        </Card>
      )}

      {/* Chat Messages Container */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, background: 'var(--bg-card, #101c17)', borderRadius: 12 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div key={m.id} style={{ display: 'flex', gap: 12, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                {!isUser && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue,
                  }}>
                    <Sparkles size={16} />
                  </div>
                )}
                <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isUser ? 'var(--accent-blue, #10b981)' : 'var(--surface-low, #0d1712)',
                    border: `1px solid ${isUser ? 'transparent' : C.border}`,
                    color: isUser ? '#ffffff' : C.text, fontSize: 13.5, lineHeight: 1.6,
                    wordBreak: 'break-word',
                  }}>
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    ) : (
                      <MarkdownContent content={m.content} />
                    )}
                  </div>

                  {/* Action Cards */}
                  {m.actionCard?.type === 'save_note' && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={15} color={C.blue} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>Save this summary to your Notes?</span>
                      </div>
                      <button
                        onClick={() => {
                          addNote({ title: m.actionCard.title, content: m.actionCard.content, color: '#4daaff' })
                          addToast({ type: 'success', message: `Saved "${m.actionCard.title}" to Notes!` })
                        }}
                        style={{ ...btnPrimary, padding: '5px 12px', fontSize: 11.5 }}
                      >
                        <Plus size={12} /> Save to Notes
                      </button>
                    </div>
                  )}

                  {m.actionCard?.type === 'save_flashcards' && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={15} color={C.purple} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>Save as Flashcard Deck?</span>
                      </div>
                      <button
                        onClick={() => {
                          const deckId = addDeck({ name: m.actionCard.topic, cards: [] })
                          if (m.actionCard.cards) {
                            m.actionCard.cards.forEach(c => addCard(deckId, c))
                          }
                          addToast({ type: 'success', message: `Created flashcard deck "${m.actionCard.topic}"!` })
                        }}
                        style={{ ...btnPrimary, padding: '5px 12px', fontSize: 11.5 }}
                      >
                        <Plus size={12} /> Save Deck
                      </button>
                    </div>
                  )}

                  {m.actionCard?.type === 'assignment' && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={15} color="#4ade80" />
                        <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>
                          Added to Assignments (Due: {m.actionCard.dueDate})
                        </span>
                      </div>
                      <button onClick={() => navigate('/assignments')} style={{ ...btnGhost, fontSize: 11, padding: '4px 8px' }}>
                        View <ArrowRight size={11} />
                      </button>
                    </div>
                  )}

                  {m.actionCard?.type === 'study_plan' && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>
                        4-Week Plan for {m.actionCard.subject} is ready
                      </span>
                      <button onClick={() => navigate('/study-plans')} style={{ ...btnGhost, fontSize: 11, padding: '4px 8px' }}>
                        Open Plans <ArrowRight size={11} />
                      </button>
                    </div>
                  )}

                  {m.actionCard?.type === 'evaluation' && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(251, 146, 60, 0.08)', border: '1px solid rgba(251, 146, 60, 0.25)',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <CheckCircle2 size={15} color="#fb923c" />
                      <span style={{ fontSize: 12, color: '#fb923c', fontWeight: 600 }}>
                        Answer Evaluated — {m.actionCard.subject}
                      </span>
                    </div>
                  )}

                  {m.actionCard?.type === 'solution' && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={15} color="#4ade80" />
                        <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>
                          Step-by-Step Solution — {m.actionCard.subject}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          addNote({
                            id: Date.now().toString(),
                            title: `Solution: ${m.actionCard.subject}`,
                            content: m.content,
                            createdAt: new Date().toISOString(),
                          })
                          addToast({ type: 'success', message: 'Solution saved to Notes!' })
                        }}
                        style={{ ...btnGhost, fontSize: 11, padding: '4px 8px' }}
                      >
                        Save to Notes
                      </button>
                    </div>
                  )}

                  <span style={{ fontSize: 10.5, color: C.textFaint, alignSelf: isUser ? 'flex-end' : 'flex-start', padding: '0 4px' }}>
                    {m.timestamp}
                  </span>
                </div>
                {isUser && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted,
                  }}>
                    <User size={16} />
                  </div>
                )}
              </div>
            )
          })}
          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue,
              }}>
                <Sparkles size={15} className="spin" />
              </div>
              <div style={{
                padding: '10px 16px', borderRadius: 8, background: 'var(--surface-low, #0d1712)',
                border: `1px solid ${C.border}`, fontSize: 12.5, color: C.textMuted,
              }}>
                Thinking & generating response…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Buttons */}
        <div style={{
          padding: '8px 16px', background: 'var(--bg-primary, #0a120e)', borderTop: `1px solid ${C.borderSoft}`,
          display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.label}
              onClick={() => {
                setInput(action.prompt)
              }}
              style={{
                padding: '5px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                color: C.textMuted, fontSize: 11.5, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'border-color 0.12s ease, color 0.12s ease',
                fontFamily: fonts.body,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue, #10b981)'; e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted }}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-card, #101c17)', borderTop: `1px solid ${C.borderSoft}`, display: 'flex', gap: 10 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask AI to summarize text, create a quiz, build flashcards, or add assignments…"
            rows={1}
            style={{
              ...inputStyle, flex: 1, resize: 'none', minHeight: 40, maxHeight: 120,
              padding: '10px 14px', borderRadius: 8,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{
              ...btnPrimary, padding: '0 18px', height: 40,
              opacity: loading || !input.trim() ? 0.6 : 1,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </Card>
    </div>
  )
}