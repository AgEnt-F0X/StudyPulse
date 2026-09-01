import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, X, Sparkles, Zap, ArrowRight, FileText, CheckCircle2, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { generateAI, aiAvailable } from '../utils/ai'
import { hasClientKey } from '../utils/gemini'
import { executeAIAssistantCommand } from '../utils/aiActions'
import { useAuthStore, useAssignmentsStore, useNotesStore, useFlashcardsStore, useStudyPlansStore } from '../stores'
import { tint, btnGhost } from '../utils/theme'

const QUICK_PROMPTS = [
  "What's due this week?",
  "Add assignment: Physics homework due Friday",
  "Generate a 5-question quiz on Motion",
  "Summarize key formulas for Chemistry",
]

// Local heuristic responder — works on real or demo data with no API key.
const getLocalResponse = (message, assignments) => {
  const msg = message.toLowerCase()
  const pending = assignments.filter(a => a.status !== 'graded')
  const today = new Date()

  const soonest = pending
    .filter(a => a.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]

  if (msg.includes('due') || msg.includes('deadline') || msg.includes('week')) {
    const upcoming = pending
      .filter(a => a.dueDate && new Date(a.dueDate) <= new Date(today.getTime() + 7 * 86400000))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    if (upcoming.length > 0) {
      return `You have ${upcoming.length} assignment${upcoming.length > 1 ? 's' : ''} due this week:\n\n${upcoming.map(a =>
        `• ${a.title} (${a.courseName}) — ${new Date(a.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
      ).join('\n')}\n\nI'd prioritize the ${upcoming[0].title} first since it's coming up soonest.`
    }
    return "You're all caught up this week — no assignments due in the next 7 days!"
  }

  if (msg.includes('first') || msg.includes('priority') || msg.includes('start') || msg.includes('which')) {
    if (soonest) {
      const high = pending.filter(a => a.priority === 'high')
      const top = high.length > 0 ? high[0] : soonest
      return `Start with **${top.title}** (${top.courseName}). It's ${top.priority === 'high' ? 'high priority' : 'coming up soon'} and estimated at ${top.estimatedHours || 2} hours. Tackle it when you're fresh — morning focus sessions work best for problem sets.`
    }
    return "You're all caught up! No pending assignments right now."
  }

  if (msg.includes('plan') || msg.includes('schedule') || msg.includes('generate')) {
    return `I can generate a personalized study plan for your ${pending.length} pending assignments! Go to the **Study Plans** tab and click "Generate Plan" — I'll build a day-by-day schedule based on your deadlines and estimated hours.`
  }

  if (msg.includes('grade') || msg.includes('gpa') || msg.includes('score')) {
    return `Based on your current grades across all courses, you're averaging around 87% — solid B+ territory. Your Physics and CS grades are strongest. Want me to help you figure out what scores you need on upcoming assignments to hit your target GPA?`
  }

  if (msg.includes('help') || msg.includes('what can') || msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    return `Hey! I'm StudyPulse (栞), your AI study companion. I can see you have ${pending.length} pending assignments right now.\n\nHere's what I can do:\n• Prioritize your tasks by deadline + weight\n• Generate personalized study plans\n• Track your grades and predict final scores\n• Answer questions about your schedule\n\nWhat would you like to tackle first?`
  }

  if (msg.includes('tip') || msg.includes('advice') || msg.includes('study')) {
    const tips = [
      "The Pomodoro technique works great for your schedule — 25 min focused on one task, then a 5 min break. There's a timer built into StudyPulse!",
      "Space your study sessions across multiple days rather than cramming the night before. Your brain consolidates memory during sleep.",
      "For your Calculus assignments, try working through one example problem fully before moving to the next. Understanding > volume.",
      "Set your hardest task as the first thing you do — your willpower is highest in the morning.",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  // Default contextual response
  if (soonest) {
    return `Good question! Right now your most pressing item is **${soonest.title}** due ${new Date(soonest.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. Would you like me to help you break it down into a study plan?`
  }

  return `I'm here to help you stay on top of your academics! You currently have ${pending.length} pending assignments. Ask me about deadlines, grades, or say "generate a study plan" to get started.`
}

const AIChat = ({ onClose }) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { assignments, addAssignment } = useAssignmentsStore()
  const { addNote } = useNotesStore()
  const { addDeck, addCard } = useFlashcardsStore()
  const { addStudyPlan } = useStudyPlansStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (messages.length === 0 && (assignments || []).length > 0) {
      const pending = assignments.filter(a => a.status !== 'graded')
      const soonest = pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
      setTimeout(() => {
        setMessages([{
          id: Date.now(),
          role: 'assistant',
          content: `Hey! I'm StudyPulse AI. I can see you have ${pending.length} pending assignments.\n\nMost urgent: **${soonest?.title}** (${soonest?.courseName || soonest?.course || 'CBSE'}) due ${soonest ? new Date(soonest.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'soon'}.\n\nAsk me about deadlines, revision tips, or say "generate a study plan"!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }])
      }, 300)
    }
  }, [assignments]) // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role, content, actionCard = null) => ({
    id: Date.now() + Math.random(),
    role,
    content,
    actionCard,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })

  const sendMessage = async (text) => {
    const msgText = text || input.trim()
    if (!msgText || generating) return

    setMessages(prev => [...prev, addMessage('user', msgText)])
    setGenerating(true)
    setInput('')

    try {
      const stores = { addAssignment, addNote, addDeck, addCard, addStudyPlan, assignments }
      const res = await executeAIAssistantCommand(msgText, stores, hasClientKey())
      setMessages(prev => [...prev, addMessage('assistant', res.replyText, res.actionCard)])
    } catch {
      setMessages(prev => [...prev, addMessage('assistant', getLocalResponse(msgText, assignments))])
    }

    setGenerating(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: '#14181e', borderBottom: '1px solid rgba(66,71,84,0.30)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: '#528dff', color: '#0b0e14' }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.875rem', color: '#dfe2eb' }}>
              StudyPulse AI
            </p>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.7rem', color: '#606080' }}>
              {hasClientKey() ? '⚡ Gemini 2.0 Flash Active' : '✨ Instant Study Assistant'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-sa"
            style={{ color: '#8c90a0', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#afc6ff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8c90a0' }}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: 'rgba(24,28,34,0.30)' }}>
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div
              className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-lg"
              style={{ background: 'rgba(82,141,255,0.14)' }}
            >
              <Sparkles className="w-6 h-6" style={{ color: '#afc6ff' }} />
            </div>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.875rem', color: '#8c90a0' }}>
              Ask me anything about your schedule
            </p>
            <div className="mt-4 space-y-2">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left px-3 py-2 rounded-lg transition-sa"
                  style={{
                    background: 'rgba(82,141,255,0.06)',
                    border: '1px solid rgba(82,141,255,0.15)',
                    color: '#8c90a0',
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(82,141,255,0.12)'; e.currentTarget.style.color = '#afc6ff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(82,141,255,0.06)'; e.currentTarget.style.color = '#8c90a0' }}
                >
                  <Zap size={11} style={{ display: 'inline', marginRight: 6 }} />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 flex flex-col gap-2`}
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '0.875rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                background: msg.role === 'user' ? '#9db8ff' : '#181c22',
                color: msg.role === 'user' ? '#0b0e14' : '#dfe2eb',
                borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                border: msg.role === 'user' ? 'none' : '1px solid rgba(66,71,84,0.25)',
              }}
            >
              <p>{msg.content}</p>
              
              {/* Action Cards */}
              {msg.actionCard?.type === 'assignment' && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(77,255,145,0.1)', border: '1px solid rgba(77,255,145,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="#4dff91" />
                    <span style={{ fontSize: 11, color: '#4dff91', fontWeight: 600 }}>
                      Added (Due: {msg.actionCard.dueDate})
                    </span>
                  </div>
                  <button onClick={() => navigate('/assignments')} style={{ ...btnGhost, fontSize: 10, padding: '2px 6px', color: '#afc6ff' }}>
                    View <ArrowRight size={10} />
                  </button>
                </div>
              )}

              {msg.actionCard?.type === 'save_note' && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(82,141,255,0.1)', border: '1px solid rgba(82,141,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 11, color: '#afc6ff', fontWeight: 600 }}>Summary Note</span>
                  <button
                    onClick={() => {
                      addNote({ title: msg.actionCard.title, content: msg.actionCard.content, color: '#4daaff' })
                    }}
                    style={{ ...btnGhost, fontSize: 10, padding: '2px 6px', color: '#4daaff' }}
                  >
                    + Save to Notes
                  </button>
                </div>
              )}

              <p style={{ fontSize: '0.65rem', marginTop: 2, opacity: 0.6 }}>{msg.timestamp}</p>
            </div>
          </motion.div>
        ))}

        {generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div style={{
              padding: '12px 16px', borderRadius: '10px 10px 10px 2px',
              background: '#181c22', border: '1px solid rgba(66,71,84,0.25)',
            }}>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#8c90a0', display: 'block' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(66,71,84,0.30)' }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: '#14181e', border: '1px solid rgba(66,71,84,0.40)' }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask StudyPulse..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none min-h-[24px] text-sm"
            style={{ fontFamily: "'Manrope', sans-serif", color: '#dfe2eb' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || generating}
            className="p-2 rounded-lg transition-sa"
            style={{
              background: input.trim() && !generating ? '#528dff' : 'rgba(66,71,84,0.25)',
              color: input.trim() && !generating ? '#0b0e14' : '#606080',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
            }}
          >
            <Send className="w-4 h-4" style={{ display: 'block' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIChat
