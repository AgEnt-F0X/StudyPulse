import { useState } from 'react'
import { Puzzle, X, Trophy, ThumbsUp, BookOpen, Sparkles, Key, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotesStore } from '../stores'
import { C, fonts, tint, inputStyle, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader, Card } from '../components/ui'
import { callGeminiClient, hasClientKey } from '../utils/gemini'

const CBSE_SUBJECT_QUIZZES = {
  physics: [
    { q: 'What is the SI unit of force in CBSE Class 11 Physics?', opts: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'], ans: 0 },
    { q: 'What is the horizontal range formula for projectile motion?', opts: ['R = u²sin(2θ) / g', 'R = u²cos(θ) / g', 'R = u²sin²(θ) / 2g', 'R = 2u / g'], ans: 0 },
    { q: 'Newton’s second law of motion states that force is equal to:', opts: ['mass × acceleration (F = ma)', 'mass × velocity', 'work / time', 'momentum × velocity'], ans: 0 },
    { q: 'What is the standard value of acceleration due to gravity (g) near Earth’s surface?', opts: ['9.8 m/s²', '12.5 m/s²', '6.67 m/s²', '3.00 × 10⁸ m/s²'], ans: 0 },
    { q: 'According to Newton’s Third Law, action and reaction forces:', opts: ['Act on two different interacting bodies', 'Act on the same body simultaneously', 'Cancel each other out to zero', 'Act only when bodies are at rest'], ans: 0 },
  ],
  chemistry: [
    { q: 'Which type of chemical bond is formed by complete transfer of electrons?', opts: ['Ionic bond', 'Covalent bond', 'Hydrogen bond', 'Metallic bond'], ans: 0 },
    { q: 'Which element has the highest electronegativity on the Pauling scale?', opts: ['Fluorine (F)', 'Chlorine (Cl)', 'Oxygen (O)', 'Nitrogen (N)'], ans: 0 },
    { q: 'Moving left to right across a period in the Periodic Table, atomic radius generally:', opts: ['Decreases', 'Increases', 'Remains constant', 'Doubles'], ans: 0 },
    { q: 'What is the shape of a water (H₂O) molecule according to VSEPR theory?', opts: ['Bent / V-shaped', 'Linear', 'Tetrahedral', 'Trigonal planar'], ans: 0 },
    { q: 'What is the molar mass of water (H₂O)?', opts: ['18 g/mol', '16 g/mol', '20 g/mol', '14 g/mol'], ans: 0 },
  ],
  math: [
    { q: 'What is the fundamental trigonometric identity for sin²θ + cos²θ?', opts: ['1', '0', '-1', '2'], ans: 0 },
    { q: 'What is the double angle formula for sin(2A)?', opts: ['2 sinA cosA', 'cos²A − sin²A', '2 tanA', 'sinA + cosA'], ans: 0 },
    { q: 'What is the derivative of sin(x) with respect to x?', opts: ['cos(x)', '−cos(x)', 'tan(x)', '−sin(x)'], ans: 0 },
    { q: 'If tan(θ) = 1 in the first quadrant, what is the angle θ?', opts: ['45° (π/4)', '30° (π/6)', '60° (π/3)', '90° (π/2)'], ans: 0 },
    { q: 'What is the expression equal to 1 + tan²θ?', opts: ['sec²θ', 'cosec²θ', 'cot²θ', 'cos²θ'], ans: 0 },
  ],
  biology: [
    { q: 'Which organelle is known as the "powerhouse of the cell"?', opts: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'], ans: 0 },
    { q: 'What is the primary green pigment involved in photosynthesis?', opts: ['Chlorophyll', 'Carotene', 'Xanthophyll', 'Hemoglobin'], ans: 0 },
    { q: 'Which organelle is the primary site of protein synthesis in a cell?', opts: ['Ribosome', 'Lysosome', 'Vacuole', 'Centrosome'], ans: 0 },
    { q: 'In cell division, chromosomes align along the equator during:', opts: ['Metaphase', 'Prophase', 'Anaphase', 'Telophase'], ans: 0 },
    { q: 'What does DNA stand for in genetics?', opts: ['Deoxyribonucleic Acid', 'Dynamic Nucleic Acid', 'Digital Nucleotide Array', 'Dextro Nucleic Acid'], ans: 0 },
  ]
}

function getFallbackQuiz(noteId, notes) {
  const note = (notes || []).find(n => n.id === noteId)
  const title = (note?.title || '').toLowerCase()
  const content = (note?.content || '').toLowerCase()

  if (title.includes('physic') || title.includes('kinematic') || content.includes('motion') || content.includes('velocity')) {
    return CBSE_SUBJECT_QUIZZES.physics
  }
  if (title.includes('chem') || title.includes('periodic') || content.includes('bonding') || content.includes('atom')) {
    return CBSE_SUBJECT_QUIZZES.chemistry
  }
  if (title.includes('math') || title.includes('trig') || content.includes('sin') || content.includes('derivative')) {
    return CBSE_SUBJECT_QUIZZES.math
  }
  if (title.includes('bio') || title.includes('cell') || content.includes('photosynthesis')) {
    return CBSE_SUBJECT_QUIZZES.biology
  }
  return [
    CBSE_SUBJECT_QUIZZES.physics[0],
    CBSE_SUBJECT_QUIZZES.chemistry[0],
    CBSE_SUBJECT_QUIZZES.math[0],
    CBSE_SUBJECT_QUIZZES.biology[0],
    CBSE_SUBJECT_QUIZZES.physics[1],
  ]
}

export default function Quiz() {
  const navigate = useNavigate()
  const { notes } = useNotesStore()
  const [phase, setPhase] = useState('setup') // setup | quiz | results
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedNote, setSelectedNote] = useState('')
  const hasKey = hasClientKey()

  const startQuiz = async () => {
    setLoading(true)
    const fallback = getFallbackQuiz(selectedNote, notes)

    if (hasKey) {
      try {
        const note = (notes || []).find(n => n.id === selectedNote)
        const content = note?.content || (note ? `${note.title}\n${note.content}` : 'CBSE Class 11 Science: Physics, Chemistry, and Mathematics concepts')
        const text = await callGeminiClient(
          `Generate 5 multiple choice questions for CBSE Class 11 based on this content. Return ONLY a valid JSON array of objects with keys "q" (string), "opts" (array of 4 option strings), and "ans" (0-based integer index of correct option). No markdown code blocks, just raw JSON:\n\n${content}`,
          { timeoutMs: 5000 }
        )
        if (text) {
          const match = text.match(/\[[\s\S]*\]/)
          if (match) {
            const parsed = JSON.parse(match[0])
            if (Array.isArray(parsed) && parsed.length > 0) {
              setQuestions(parsed)
              setLoading(false)
              setPhase('quiz')
              setCurrent(0); setAnswers([]); setSelected(null)
              return
            }
          }
        }
      } catch (err) {
        console.warn('Gemini quiz failed, using CBSE question bank', err)
      }
    }

    // Instant fallback (<0.1s)
    setQuestions(fallback)
    setLoading(false)
    setPhase('quiz')
    setCurrent(0); setAnswers([]); setSelected(null)
  }

  const handleAnswer = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    setTimeout(() => {
      setAnswers(a => [...a, { q: current, selected: idx, correct: idx === questions[current].ans }])
      if (current + 1 < questions.length) {
        setCurrent(c => c + 1)
        setSelected(null)
      } else {
        setPhase('results')
      }
    }, 800)
  }

  const score = answers.filter(a => a.correct).length

  if (phase === 'results') {
    const perfect = score === questions.length
    const good = score >= questions.length / 2
    const ResultIcon = perfect ? Trophy : good ? ThumbsUp : BookOpen
    const resultColor = perfect ? C.yellow : good ? C.green : C.blue
    return (
      <div className="page-enter" style={{ fontFamily: fonts.body, color: C.text, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <Card style={{ padding: 44 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 22, margin: '0 auto 18px',
            background: tint(resultColor, 0.12), border: `1px solid ${tint(resultColor, 0.3)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: resultColor,
            boxShadow: `0 0 40px ${tint(resultColor, 0.2)}`,
          }}>
            <ResultIcon size={34} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontFamily: fonts.heading, fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            {score} / {questions.length}
          </h2>
          <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 8 }}>
            {perfect ? 'Perfect score!' : good ? 'Good job!' : 'Keep practicing!'}
          </p>
          <p style={{ color: C.green, fontSize: 13, marginBottom: 28, fontWeight: 700 }}>+{score * 10} XP earned</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => setPhase('setup')} style={btnGhost}>New Quiz</button>
            <button onClick={() => { setCurrent(0); setAnswers([]); setSelected(null); setPhase('quiz') }} style={btnPrimary}>Retry</button>
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'quiz') {
    const q = questions[current]
    return (
      <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: C.textMuted, fontFamily: fonts.heading, fontWeight: 600 }}>
            Question {current + 1} of {questions.length}
          </span>
          <button onClick={() => setPhase('setup')} style={{ ...btnGhost, padding: '5px 12px', fontSize: 12, color: C.textMuted }}>
            <X size={12} /> Quit
          </button>
        </div>
        <div style={{ height: 5, background: tint(C.blue, 0.1), borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{
            height: '100%', width: `${((current + 1) / questions.length) * 100}%`,
            background: C.blueDark,
            borderRadius: 3, transition: 'width 0.3s',
          }} />
        </div>
        <Card style={{ padding: '24px 28px', marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>{q?.q}</p>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(q?.opts || []).map((opt, i) => {
            let bg = C.card, border = C.border, color = C.text
            if (selected !== null) {
              if (i === q.ans) { bg = tint(C.greenDark, 0.12); border = tint(C.greenDark, 0.5); color = C.green }
              else if (i === selected && selected !== q.ans) { bg = tint(C.pink, 0.12); border = tint(C.pink, 0.5); color = C.pink }
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} className={selected === null ? 'hover-lift' : ''} style={{
                padding: '14px 18px', borderRadius: 12, border: `1px solid ${border}`,
                background: bg, color, cursor: selected !== null ? 'default' : 'pointer',
                textAlign: 'left', fontSize: 14, fontFamily: fonts.body, fontWeight: 500,
                transition: 'all 0.2s',
              }}>{opt}</button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 560, margin: '0 auto' }}>
      <PageHeader
        icon={Puzzle}
        accent={C.purple}
        title="Quiz Generator"
        subtitle="Test yourself with CBSE subject & AI-generated questions"
      />
      <Card style={{ padding: 28 }}>
        {hasKey ? (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center',
            background: tint(C.green, 0.08), border: `1px solid ${tint(C.green, 0.3)}`,
            borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: C.green,
          }}>
            <CheckCircle size={15} color={C.green} style={{ flexShrink: 0 }} />
            <span><strong>Gemini AI Active</strong> — Custom questions generated in seconds</span>
          </div>
        ) : (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between',
            background: tint(C.blue, 0.06), border: `1px solid ${tint(C.blue, 0.25)}`,
            borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: C.blue,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Sparkles size={14} style={{ flexShrink: 0 }} />
              <span>Instant CBSE Class 11 Question Bank ready</span>
            </div>
            <button
              onClick={() => navigate('/settings')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 6,
                background: tint(C.blue, 0.15), border: `1px solid ${tint(C.blue, 0.3)}`,
                color: C.blue, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Key size={11} /> Add Key
            </button>
          </div>
        )}

        {(notes || []).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>
              Select Subject / Note
            </label>
            <select value={selectedNote} onChange={e => setSelectedNote(e.target.value)} style={inputStyle}>
              <option value=''>— General CBSE Class 11 Science —</option>
              {(notes || []).map(n => (<option key={n.id} value={n.id}>{n.title || 'Untitled'}</option>))}
            </select>
          </div>
        )}

        <button onClick={startQuiz} disabled={loading} style={{
          ...btnPrimary, width: '100%', padding: '13px', fontSize: 15,
          opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          <Sparkles size={16} /> {loading ? 'Generating…' : 'Start Quiz'}
        </button>
      </Card>
    </div>
  )
}
