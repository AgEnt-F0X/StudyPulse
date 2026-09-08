import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, X, Sparkles, Zap, ArrowRight, FileText, CheckCircle2, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { generateAI, aiAvailable } from '../utils/ai'
import { hasClientKey } from '../utils/gemini'
import { executeAIAssistantCommand } from '../utils/aiActions'
import { useAuthStore, useAssignmentsStore, useNotesStore, useFlashcardsStore, useStudyPlansStore } from '../stores'
import { C, fonts, tint, btnGhost } from '../utils/theme'
import MarkdownContent from './MarkdownContent'

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
    return `Hey! I'm StudyPulse, your AI study companion. I can see you have ${pending.length} pending assignments right now.\n\nHere's what I can do:\n• Prioritize your tasks by deadline + weight\n• Generate personalized study plans\n• Track your grades and predict final scores\n• Answer questions about your schedule\n\nWhat would you like to tackle first?`
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
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{
              background: 'var(--grad-logo, linear-gradient(135deg, #10b981, #059669))',
              color: '#04120c',
              boxShadow: '0 8px 32px rgba(16,185,129,0.22)',
            }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: '0.9rem', color: C.text }}>
              StudyPulse AI
            </p>
            <p style={{ fontFamily: fonts.body, fontSize: '0.75rem', color: C.textMuted }}>
              {hasClientKey() ? '⚡ Connected to AI Engine' : '✨ Instant Study Assistant'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-sa"
            style={{ color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.text }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted }}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: 'var(--surface-low, #0d1712)' }}>
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div
              className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl"
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}
            >
              <Sparkles className="w-6 h-6" style={{ color: C.blue }} />
            </div>
            <p style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: '0.95rem', color: C.text }}>
              How can I assist your study session today?
            </p>
            <p style={{ fontFamily: fonts.body, fontSize: '0.8rem', color: C.textMuted, marginTop: 4 }}>
              Ask questions, parse syllabi, or generate customized study plans.
            </p>
            <div className="mt-4 space-y-2">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-sa"
                  style={{
                    background: 'var(--bg-card, #101c17)',
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    fontFamily: fonts.body,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.45)'; e.currentTarget.style.background = 'var(--surface-card-hover, #1d273e)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'var(--bg-card, #101c17)' }}
                >
                  <Zap size={12} color={C.blue} style={{ display: 'inline', marginRight: 7 }} />
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
              className="max-w-[85%] px-4 py-3 flex flex-col gap-2"
              style={{
                fontFamily: fonts.body,
                fontSize: '0.875rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                background: msg.role === 'user' ? 'var(--accent-blue, #10b981)' : 'var(--bg-card, #101c17)',
                color: msg.role === 'user' ? '#ffffff' : C.text,
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                border: msg.role === 'user' ? 'none' : `1px solid ${C.border}`,
                boxShadow: msg.role === 'user' ? '0 2px 8px rgba(59,130,246,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {msg.role === 'user' ? (
                <p style={{ margin: 0 }}>{msg.content}</p>
              ) : (
                <MarkdownContent content={msg.content} />
              )}
              
              {/* Action Cards */}
              {msg.actionCard?.type === 'assignment' && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="#4ade80" />
                    <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
                      Added (Due: {msg.actionCard.dueDate})
                    </span>
                  </div>
                  <button onClick={() => navigate('/assignments')} style={{ ...btnGhost, fontSize: 10, padding: '2px 8px', color: C.blue }}>
                    View <ArrowRight size={10} />
                  </button>
                </div>
              )}

              {msg.actionCard?.type === 'save_note' && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>Summary Note</span>
                  <button
                    onClick={() => {
                      addNote({ title: msg.actionCard.title, content: msg.actionCard.content, color: '#3b82f6' })
                    }}
                    style={{ ...btnGhost, fontSize: 10, padding: '2px 8px', color: C.blue }}
                  >
                    + Save to Notes
                  </button>
                </div>
              )}

              <p style={{ fontSize: '0.68rem', marginTop: 2, color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : C.textMuted }}>
                {msg.timestamp}
              </p>
            </div>
          </motion.div>
        ))}

        {generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div style={{
              padding: '12px 16px', borderRadius: '12px 12px 12px 2px',
              background: 'var(--bg-card, #101c17)', border: `1px solid ${C.border}`,
            }}>
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: C.blue, display: 'block' }}
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

      {/* Input Bar */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${C.borderSoft}`, background: 'var(--bg-primary, #0a120e)' }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'var(--bg-card, #101c17)', border: `1px solid ${C.border}` }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask StudyPulse..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none min-h-[24px] text-sm"
            style={{ fontFamily: fonts.body, color: C.text }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || generating}
            className="p-2 rounded-lg transition-sa"
            style={{
              background: input.trim() && !generating ? 'var(--accent-blue, #10b981)' : 'rgba(255,255,255,0.06)',
              color: input.trim() && !generating ? '#ffffff' : C.textFaint,
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
