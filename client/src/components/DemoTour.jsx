import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen, BarChart3, Brain, Zap, Github } from 'lucide-react'

const STEPS = [
  {
    icon: Sparkles,
    color: '#c44dff',
    title: 'Welcome to StudyPulse',
    subtitle: 'AI Study Companion',
    body: 'You\'re exploring a fully-loaded demo with sample courses, assignments, grades, and flashcards. Everything here is pre-filled — no account or setup needed.',
    hint: 'All your real data stays 100% local. No tracking.',
  },
  {
    icon: Brain,
    color: '#afc6ff',
    title: 'AI Study Plans',
    subtitle: 'Gemini AI inside',
    body: 'Add your Gemini API key (free at aistudio.google.com) in Settings → and StudyPulse will build a personalized day-by-day study schedule from your deadlines.',
    hint: 'Or use Google Classroom sync to auto-import assignments.',
  },
  {
    icon: BookOpen,
    color: '#4dff91',
    title: 'SRS Flashcards',
    subtitle: 'Spaced repetition',
    body: 'The flashcard system uses Anki-style spaced repetition. Import from Quizlet CSV, generate AI cards from your notes, or create them manually.',
    hint: 'Cards you know well appear less often. You\'ll retain 80%+ long-term.',
  },
  {
    icon: BarChart3,
    color: '#ffd6a0',
    title: 'GPA Predictor',
    subtitle: 'Real-time calculation',
    body: 'Enter grades with weighted categories and StudyPulse calculates your GPA in real time. Ask "what score do I need on the final to keep a B+" and get an exact answer.',
    hint: 'Supports 4.0 scale, percentage grades, and letter grades.',
  },
  {
    icon: Zap,
    color: '#ff6b9d',
    title: 'Claude Code MCP',
    subtitle: 'AI-native integration',
    body: 'StudyPulse has a built-in MCP server — add it to Claude Code and ask things like "what\'s due this week?" or "summarize my Calculus notes" without leaving your editor.',
    hint: 'See mcp/ folder for setup instructions.',
  },
  {
    icon: Github,
    color: '#e5b5ff',
    title: 'Open Source',
    subtitle: 'MIT licensed',
    body: 'StudyPulse is fully open-source on GitHub. Self-host it, contribute features, or fork it for your school. 100% free forever for personal use.',
    hint: '⭐ Star the repo if you find it useful — it helps others discover it!',
    cta: {
      label: 'Star on GitHub',
      href: 'https://github.com/kaorii-ako/StudyPulse',
    },
  },
]

const TOUR_KEY = 'studypulse-demo-tour-seen'

const DemoTour = () => {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem(TOUR_KEY)) return
    const t = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(t)
  }, [])

  const close = () => {
    sessionStorage.setItem(TOUR_KEY, '1')
    setOpen(false)
  }

  const next = () => step < STEPS.length - 1 ? setStep(s => s + 1) : close()
  const prev = () => setStep(s => Math.max(0, s - 1))

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(0,0,0,0.7)',
            }}
          />

          {/* Centering wrapper — flex centering avoids the framer-motion
              transform overriding a manual translate(-50%,-50%). */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 301,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, pointerEvents: 'none',
          }}>
          {/* Modal */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              width: 'min(440px, 100%)',
              maxHeight: 'calc(100dvh - 32px)',
              overflowY: 'auto',
              pointerEvents: 'auto',
              background: 'var(--bg-card, #101c17)',
              border: `1px solid ${current.color}40`,
              borderRadius: 14,
              padding: '32px 28px 24px',
              boxShadow: `0 0 60px ${current.color}20, 0 24px 64px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Close */}
            <button
              onClick={close}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted, #64748b)', padding: 4,
              }}
            >
              <X size={16} />
            </button>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i === step ? current.color : i < step ? `${current.color}60` : 'rgba(255,255,255,0.1)',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>

            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 14, marginBottom: 20,
              background: `${current.color}18`,
              border: `1px solid ${current.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={26} style={{ color: current.color }} />
            </div>

            {/* Content */}
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: current.color, letterSpacing: '0.01em', marginBottom: 6, textTransform: 'none' }}>
              {current.subtitle}
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text-primary, #f0f4fc)', marginBottom: 12, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
              {current.title}
            </h2>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7, marginBottom: 16 }}>
              {current.body}
            </p>
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 24,
            }}>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: 'var(--text-muted, #64748b)' }}>
                {current.hint}
              </p>
            </div>

            {/* CTA if last step */}
            {current.cta && (
              <a
                href={current.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 18px', borderRadius: 8,
                  background: current.color,
                  color: '#0b0e14', textDecoration: 'none',
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                <Github size={15} />
                {current.cta.label}
              </a>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={prev}
                disabled={step === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: step === 0 ? 'not-allowed' : 'pointer',
                  color: step === 0 ? 'rgba(255,255,255,0.15)' : 'var(--text-muted, #64748b)',
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
                  padding: '8px 0',
                }}
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={next}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: current.color,
                  color: '#0b0e14',
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700,
                  boxShadow: `0 4px 14px ${current.color}40`,
                }}
              >
                {step === STEPS.length - 1 ? 'Start Exploring' : 'Next'}
                {step < STEPS.length - 1 && <ChevronRight size={14} />}
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default DemoTour
