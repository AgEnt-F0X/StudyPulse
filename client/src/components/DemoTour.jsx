import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowRight, ArrowLeft, Play } from '@phosphor-icons/react'
import { C, fonts } from '../utils/theme'

// "How to Use StudyPulse" — interactive 5-step guide with deep links.
// Triggered from the dock's [? Guide] button (studypulse-open-guide event)
// and auto-offered once on a student's very first visit.

const GUIDE_SEEN_KEY = 'studypulse-guide-seen'

const STEPS = [
  {
    tag: 'Step 1 · Today',
    title: 'Your adaptive Home decides for you',
    accent: '#10B981',
    vignette: 'hero',
    body: 'The Home card reads your learner memory — what you last read, what is due for a refresh, and where you slipped — and lines up the single best next action. You never waste time deciding what to study.',
    bullets: [
      '"What should you do next?" always points at your current chapter',
      'Due concepts come back automatically before you forget them',
      'The Ask bar answers any homework question in English, Hindi or Hinglish',
    ],
    link: { label: 'Open Today', path: '/home' },
  },
  {
    tag: 'Step 2 · Study & 3D Labs',
    title: 'Read NCERT like a real book — then ask it anything',
    accent: '#34D399',
    vignette: 'reader',
    body: 'The Library shelves every chapter as a physical 3D book. Inside the reader, select any sentence to save it, or press [Select area] and drag a box around a diagram, graph or equation — StudyPulse crops that exact region and explains it in English, Hindi or Hinglish. Every chapter also has a hands-on 3D Concept Lab.',
    bullets: [
      '[Select area] → glowing green box → crop → Ask StudyPulse',
      'Explain · Why this? · PYQs · Quiz Me · Notes dock beside the page',
      'Physics ramps, spinning molecules and 3D vectors live in the [3D Lab] tab',
    ],
    link: { label: 'Open the Library', path: '/library' },
  },
  {
    tag: 'Step 3 · Quiz Me',
    title: 'Lucky guesses never count',
    accent: '#F59E0B',
    vignette: 'quiz',
    body: 'Every question asks HOW SURE you are before you submit. Correct + Certain upgrades the concept; correct but Guessed only marks it Developing with a 24-hour review; wrong marks it Needs attention immediately — and "What StudyPulse Noticed" remembers your exact mistake until you fix it.',
    bullets: [
      'Guessed | Unsure | Fairly sure | Certain — required before submit',
      'The live banner shows the state transition after every answer',
      'SQL traps (like = NULL vs IS NULL) land in the same memory',
    ],
    link: { label: 'Try a Quiz Me', path: '/quiz' },
  },
  {
    tag: 'Step 4 · SQL 3D Arena',
    title: 'See your query hit the tables',
    accent: '#6EE7B7',
    vignette: 'sql',
    body: 'CBSE MySQL missions run on a real in-browser engine. The 3D relational stage shows the actual tables as physical trays: rows satisfying your WHERE clause elevate and glow, JOIN beams connect the matched key pairs, and GROUP BY stacks aggregate buckets in real time.',
    bullets: [
      'Scaffold queries with the clause builder chips — or type raw SQL',
      'Declare certainty per mission; traps feed the learner memory',
      'Reset DB restores the seed data anytime',
    ],
    link: { label: 'Enter the Arena', path: '/sql' },
  },
  {
    tag: 'Step 5 · Exam Plan',
    title: 'Honest readiness, 20-minute days',
    accent: '#F59E0B',
    vignette: 'exam',
    body: 'Create an exam, tick your syllabus chapters, and StudyPulse computes a readiness % strictly from verified Quiz Me and SQL states — never a mark prediction. Your daily queue builds 20-minute micro-tasks (READ · QUIZ · REFRESH · PYQ) with weak topics first.',
    bullets: [
      '[Start] deep-links straight into the right chapter or quiz',
      'Mark done / Skip — the queue reshapes around your real states',
      'Notes generator: mind maps, timelines, formula sheets, handwritten mode',
    ],
    links: [
      { label: 'Open Exam Plan', path: '/study-plans' },
      { label: 'Notes', path: '/notes' },
    ],
  },
]

// Small CSS vignettes per step — no screenshots needed
function Vignette({ kind }) {
  if (kind === 'hero') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 74 }}>
        <div style={{ width: 46, height: 62, borderRadius: '3px 6px 6px 3px', background: 'linear-gradient(160deg, #2FB489, #0F7A5C)', boxShadow: '6px 8px 16px rgba(0,0,0,0.45)' }} />
        <div style={{ flex: 1 }}>
          <div className="editorial" style={{ fontSize: 16, color: C.text, lineHeight: 1.1 }}>What should<br />you do next?</div>
          <div style={{ marginTop: 6, height: 20, borderRadius: 999, background: 'rgba(12,20,16,0.8)', border: `1px solid ${C.borderSoft}`, width: '88%' }} />
        </div>
        <span className="badge3d mastered" style={{ fontSize: 9 }}>GO</span>
      </div>
    )
  }
  if (kind === 'reader') {
    return (
      <div style={{ display: 'flex', gap: 8, height: 74 }}>
        <div style={{ flex: 1.5, borderRadius: 6, background: '#FAF7F2', position: 'relative', padding: 8 }}>
          <div style={{ height: 4, width: '70%', background: '#C9C2B4', borderRadius: 2, marginBottom: 5 }} />
          <div style={{ height: 4, width: '85%', background: '#DDD6C8', borderRadius: 2, marginBottom: 5 }} />
          <div style={{ height: 4, width: '55%', background: 'rgba(245,158,11,0.5)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', right: 10, top: 14, width: 34, height: 26, border: '2px solid #10B981', background: 'rgba(16,185,129,0.15)', boxShadow: '0 0 10px rgba(16,185,129,0.5)', borderRadius: 2 }} />
        </div>
        <div style={{ flex: 1, borderRadius: 6, background: '#131C18', border: `1px solid ${C.border}`, padding: 8 }}>
          {['Explain', 'Why this?', '3D Lab'].map((t) => (
            <div key={t} style={{ fontFamily: fonts.mono, fontSize: 8.5, color: '#6EE7B7', padding: '3px 0' }}>▸ {t}</div>
          ))}
        </div>
      </div>
    )
  }
  if (kind === 'quiz') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 74, flexWrap: 'wrap' }}>
        {['Guessed', 'Unsure', 'Fairly sure', 'Certain'].map((t, i) => (
          <span key={t} className={`badge3d ${i === 3 ? 'mastered' : i === 2 ? 'developing' : 'needs_attention'}`} style={{ fontSize: 9 }}>{t}</span>
        ))}
        <span style={{ fontFamily: fonts.mono, fontSize: 9, color: C.textFaint, width: '100%' }}>
          → state updated: 0% Needs attention → 50% Developing
        </span>
      </div>
    )
  }
  if (kind === 'sql') {
    return (
      <div style={{ display: 'flex', gap: 8, height: 74 }}>
        <div style={{
          flex: 1, borderRadius: 6, background: '#101A15', border: '1px solid rgba(52,211,153,0.3)',
          transform: 'perspective(600px) rotateX(24deg) rotateZ(-8deg)', padding: 6,
        }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              height: 9, margin: '2px 0', borderRadius: 2,
              background: i === 1 ? 'rgba(16,185,129,0.5)' : 'rgba(52,211,153,0.1)',
              boxShadow: i === 1 ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
            }} />
          ))}
        </div>
        <div style={{ alignSelf: 'center', width: 34, height: 2, background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.8)', borderRadius: 2 }} />
        <div style={{
          flex: 1, borderRadius: 6, background: '#101A15', border: '1px solid rgba(52,211,153,0.3)',
          transform: 'perspective(600px) rotateX(24deg) rotateZ(-8deg)', padding: 6,
        }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              height: 9, margin: '2px 0', borderRadius: 2,
              background: i === 1 ? 'rgba(16,185,129,0.5)' : 'rgba(52,211,153,0.1)',
            }} />
          ))}
        </div>
      </div>
    )
  }
  // exam
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: 74, justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="editorial" style={{ fontSize: 26, color: C.warning }}>25%</span>
        <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>READINESS · AT RISK — honest, not a mark prediction</span>
      </div>
      {['READ · 20 MIN', 'QUIZ · 15 MIN', 'PYQ · 20 MIN'].map((t, i) => (
        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 8.5, color: i === 0 ? '#F59E0B' : '#34D399', width: 84 }}>{t}</span>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(52,211,153,0.15)' }}>
            <div style={{ width: `${[70, 45, 55][i]}%`, height: '100%', borderRadius: 3, background: i === 0 ? '#F59E0B' : '#34D399' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DemoTour() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  // Auto-offer once on first visit (real accounts and demo alike)
  useEffect(() => {
    const onOpen = () => { setOpen(true); setStep(0) }
    window.addEventListener('studypulse-open-guide', onOpen)
    let timer = null
    try {
      if (!localStorage.getItem(GUIDE_SEEN_KEY)) {
        timer = setTimeout(() => {
          setOpen(true)
          localStorage.setItem(GUIDE_SEEN_KEY, String(Date.now()))
        }, 2200)
      }
    } catch {}
    return () => {
      window.removeEventListener('studypulse-open-guide', onOpen)
      if (timer) clearTimeout(timer)
    }
  }, [])

  const close = () => setOpen(false)
  const s = STEPS[step]

  const jump = (path) => {
    try { localStorage.setItem(GUIDE_SEEN_KEY, String(Date.now())) } catch {}
    setOpen(false)
    navigate(path)
  }

  if (!open) return null

  return (
    <>
      {/* Dim overlay — click outside to dismiss */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          animation: 'studypulseFadeUp 0.2s ease both',
        }}
      />
      {/* Guide card */}
      <div style={{
        position: 'fixed', zIndex: 201,
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%) translate3d(0,0,0)',
        width: 'min(520px, calc(100vw - 24px))',
        background: '#131C18',
        border: '1px solid rgba(52,211,153,0.3)',
        borderRadius: 20,
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        padding: '22px 24px 18px',
        animation: 'studypulseFadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 18, height: 18, borderRadius: 999,
              background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.4)',
              color: C.primaryBright, fontSize: 11, fontWeight: 800,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>?</span>
            <span className="metric-label" style={{ padding: 0, color: C.primaryBright }}>
              How to use StudyPulse · {s.tag}
            </span>
          </span>
          <button onClick={close} aria-label="Skip guide" style={{
            width: 26, height: 26, borderRadius: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: `1px solid ${C.borderSoft}`,
            color: C.textFaint, cursor: 'pointer',
          }}>
            <X size={13} />
          </button>
        </div>

        {/* Vignette */}
        <div style={{
          borderRadius: 12, padding: '12px 14px', marginBottom: 14,
          background: '#0A1410', border: `1px solid ${C.borderSoft}`,
        }}>
          <Vignette kind={s.vignette} />
        </div>

        {/* Copy */}
        <h2 className="editorial" style={{ fontSize: 21, lineHeight: 1.15, margin: '0 0 8px', color: s.accent }}>
          {s.title}
        </h2>
        <p style={{ fontSize: 12.5, lineHeight: 1.6, color: C.textMuted, margin: '0 0 10px' }}>
          {s.body}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
          {s.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: C.text }}>
              <span className="dot" style={{ background: s.accent, marginTop: 6 }} />
              <span style={{ lineHeight: 1.5 }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
          {STEPS.map((_, i) => (
            <span key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? s.accent : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s ease',
            }} />
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={close} style={{
            padding: '6px 12px', borderRadius: 999,
            background: 'transparent', border: `1px solid ${C.borderSoft}`,
            color: C.textFaint, cursor: 'pointer', fontFamily: fonts.body, fontSize: 12,
          }}>
            Skip guide
          </button>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {step > 0 && (
              <button
                onClick={() => setStep((v) => v - 1)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '7px 13px', borderRadius: 999,
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.textMuted, cursor: 'pointer', fontFamily: fonts.body, fontSize: 12.5, fontWeight: 600,
                }}
              >
                <ArrowLeft size={12} /> Back
              </button>
            )}
            {(s.links || [s.link]).filter(Boolean).map((l) => (
              <button
                key={l.path + l.label}
                onClick={() => jump(l.path)}
                className="motion-spring"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 15px', borderRadius: 999,
                  background: s.accent, color: '#06251A',
                  border: 'none', cursor: 'pointer',
                  fontFamily: fonts.body, fontSize: 12.5, fontWeight: 700,
                  boxShadow: '0 4px 0 rgba(0,0,0,0.3)',
                }}
              >
                <Play size={11} weight="fill" /> {l.label}
              </button>
            ))}
            {step < STEPS.length - 1 && (
              <button
                onClick={() => setStep((v) => v + 1)}
                className="motion-spring"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '7px 15px', borderRadius: 999,
                  background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.4)',
                  color: C.primaryBright, cursor: 'pointer',
                  fontFamily: fonts.body, fontSize: 12.5, fontWeight: 700,
                }}
              >
                Next step <ArrowRight size={12} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
