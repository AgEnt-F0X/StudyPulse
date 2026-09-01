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
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <PageHeader
        icon={Sparkles}
        accent={C.blue}
        title="AI Study Assistant"
        subtitle="Talk, summarize text, generate quizzes, flashcards & study plans"
        actions={
          <button
            onClick={() => setShowKeyInput(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              background: hasKey ? tint(C.green, 0.12) : tint(C.blue, 0.12),
              border: `1px solid ${hasKey ? tint(C.green, 0.4) : tint(C.blue, 0.4)}`,
              color: hasKey ? C.green : C.blue,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: fonts.heading,
            }}
          >
            <Key size={13} /> {hasKey ? `${activeProvider} Active` : 'Add AI Key'}
          </button>
        }
      />

      {/* API Key Modal / Quick Bar */}
      {showKeyInput && (
        <Card style={{ padding: '16px 20px', marginBottom: 14, background: C.card, border: `1px solid ${tint(C.blue, 0.3)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>AI API Key (Groq / Gemini / OpenRouter)</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: 'underline' }}>
                Get Groq Key (Fastest) ↗
              </a>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: 'underline' }}>
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
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, background: C.card }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div key={m.id} style={{ display: 'flex', gap: 12, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                {!isUser && (
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, #5a8bff, #b55cff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0e14',
                  }}>
                    <Bot size={18} />
                  </div>
                )}
                <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{
                    padding: '14px 18px', borderRadius: 16,
                    background: isUser ? C.blueDark : C.bg,
                    border: `1px solid ${isUser ? tint(C.blue, 0.4) : C.border}`,
                    color: C.text, fontSize: 14, lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {m.content}
                  </div>

                  {/* Action Cards */}
                  {m.actionCard?.type === 'save_note' && (
                    <div style={{
                      padding: '12px 16px', borderRadius: 12,
                      background: tint(C.blue, 0.08), border: `1px solid ${tint(C.blue, 0.3)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} color={C.blue} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Save this summary to your Notes?</span>
                      </div>
                      <button
                        onClick={() => {
                          addNote({ title: m.actionCard.title, content: m.actionCard.content, color: '#4daaff' })
                          addToast({ type: 'success', message: `Saved "${m.actionCard.title}" to Notes!` })
                        }}
                        style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12 }}
                      >
                        <Plus size={13} /> Save to Notes
                      </button>
                    </div>
                  )}

                  {m.actionCard?.type === 'save_flashcards' && (
                    <div style={{
                      padding: '12px 16px', borderRadius: 12,
                      background: tint(C.purple, 0.08), border: `1px solid ${tint(C.purple, 0.3)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={16} color={C.purple} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Save as Flashcard Deck?</span>
                      </div>
                      <button
                        onClick={() => {
                          const deckId = addDeck({ name: m.actionCard.topic, cards: [] })
                          if (m.actionCard.cards) {
                            m.actionCard.cards.forEach(c => addCard(deckId, c))
                          }
                          addToast({ type: 'success', message: `Created flashcard deck "${m.actionCard.topic}"!` })
                        }}
                        style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12 }}
                      >
                        <Plus size={13} /> Save Deck
                      </button>
                    </div>
                  )}

                  {m.actionCard?.type === 'assignment' && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: tint(C.green, 0.08), border: `1px solid ${tint(C.green, 0.3)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={15} color={C.green} />
                        <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
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
                      padding: '10px 14px', borderRadius: 10,
                      background: tint(C.blue, 0.08), border: `1px solid ${tint(C.blue, 0.3)}`,
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
                      padding: '10px 14px', borderRadius: 10,
                      background: tint(C.orange, 0.08), border: `1px solid ${tint(C.orange, 0.3)}`,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <CheckCircle2 size={15} color={C.orange} />
                      <span style={{ fontSize: 12, color: C.orange, fontWeight: 600 }}>
                        Answer Evaluated — {m.actionCard.subject}
                      </span>
                    </div>
                  )}

                  {m.actionCard?.type === 'solution' && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: tint(C.green, 0.08), border: `1px solid ${tint(C.green, 0.3)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={15} color={C.green} />
                        <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
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

                  <span style={{ fontSize: 11, color: C.textFaint, alignSelf: isUser ? 'flex-end' : 'flex-start', padding: '0 4px' }}>
                    {m.timestamp}
                  </span>
                </div>
                {isUser && (
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted,
                  }}>
                    <User size={18} />
                  </div>
                )}
              </div>
            )
          })}
          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, #5a8bff, #b55cff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0e14',
              }}>
                <Sparkles size={16} className="spin" />
              </div>
              <div style={{
                padding: '12px 18px', borderRadius: 16, background: C.bg,
                border: `1px solid ${C.border}`, fontSize: 13, color: C.textMuted,
              }}>
                Thinking & generating response…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Buttons */}
        <div style={{
          padding: '10px 16px', background: C.bg, borderTop: `1px solid ${C.border}`,
          display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.label}
              onClick={() => {
                setInput(action.prompt)
              }}
              style={{
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                color: C.textMuted, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted }}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '14px 16px', background: C.card, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
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
              ...inputStyle, flex: 1, resize: 'none', minHeight: 44, maxHeight: 120,
              padding: '12px 16px',
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{
              ...btnPrimary, padding: '0 20px', height: 44,
              opacity: loading || !input.trim() ? 0.6 : 1,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </Card>
    </div>
  )
}