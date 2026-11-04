import { useState, useMemo, useRef, useEffect } from 'react'
import { Brain, X, Trophy, ThumbsUp, BookOpenText, Sparkle, Key, CheckCircle, CircleNotch, ArrowRight } from '@phosphor-icons/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNotesStore, useLearnerStore, useXPStore } from '../stores'
import { getLearnerChapters } from '../utils/cbseSubjects'
import { generateQuizMeQuestions, hasClientKey, callGeminiClient } from '../utils/gemini'
import {
  CONFIDENCE_LEVELS, STATUS_META, statusLabel, statusScore,
} from '../utils/learnerEngine'
import { C, fonts, inputStyle, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader, Card } from '../components/ui'

// ── Static CBSE fallback bank (concept-tagged, offline-safe) ──

const CHAPTER_BANK = {
  'sci10-light': [
    { conceptName: 'Laws of reflection', q: 'For a ray reflected from a plane mirror, which statement is always true?', opts: ['Angle of incidence equals angle of reflection, both measured from the normal', 'Angle of incidence equals angle of reflection, measured from the mirror surface', 'The ray retraces its path', 'The angles add up to 90°'], ans: 0, explanation: 'The first law of reflection: i = r measured from the normal.', trapNote: 'Students measure angles from the mirror surface instead of the normal.' },
    { conceptName: 'Mirror formula and magnification', q: 'A concave mirror forms an image magnified twice with object 10 cm from the pole. Using m = −v/u, v =', opts: ['−20 cm (real, same side as object)', '+20 cm', '−5 cm', '+5 cm'], ans: 0, explanation: 'm = −v/u → 2 = −v/(−10) → v = −20 cm: real image 20 cm in front.', trapNote: 'Sign conventions — forgetting m = −v/u and mixing up the sign of v.' },
    { conceptName: 'Lens formula and power of a lens', q: 'Power of a lens with focal length 25 cm is', opts: ['+4 D', '+2 D', '−4 D', '0.25 D'], ans: 0, explanation: 'P = 1/f (in metres) = 1/0.25 = +4 D.', trapNote: 'Forgetting to convert cm to metres before using P = 1/f.' },
  ],
  'sci10-electricity': [
    { conceptName: 'Ohm\'s law and V-I relationship', q: 'Ohm\'s law (V = IR) is valid when', opts: ['Temperature and other physical conditions stay constant', 'Current is very large', 'The circuit is parallel', 'The resistor is made of a liquid'], ans: 0, explanation: 'V ∝ I holds only at constant physical conditions, chiefly temperature.', trapNote: 'Ignoring the constant-temperature condition in the definition.' },
    { conceptName: 'Series vs parallel combinations', q: 'Three 6 Ω resistors are connected in parallel. The equivalent resistance is', opts: ['2 Ω', '18 Ω', '6 Ω', '0.5 Ω'], ans: 0, explanation: '1/R = 1/6 + 1/6 + 1/6 = 1/2 → R = 2 Ω.', trapNote: 'Adding resistances (series formula) in a parallel question.' },
    { conceptName: 'Heating effect of current and electric power', q: 'An electric heater draws 4 A across 220 V. The heat produced per second is', opts: ['880 W', '55 W', '2200 W', '1760 W'], ans: 0, explanation: 'P = VI = 220 × 4 = 880 J/s.', trapNote: 'Using P = V/I or I²R with the wrong variable.' },
  ],
  'sci10-carbon': [
    { conceptName: 'Functional groups and homologous series', q: 'The functional group −COOH characterises which family?', opts: ['Carboxylic acids', 'Alcohols', 'Aldehydes', 'Ketones'], ans: 0, explanation: '−COOH is the carboxylic acid group (e.g. ethanoic acid).', trapNote: 'Confusing −COOH (acid) with −CHO (aldehyde).' },
    { conceptName: 'Ethanol and ethanoic acid reactions', q: 'Esterification is the reaction of an acid with an alcohol in the presence of', opts: ['A concentrated acid catalyst', 'Sodium hydroxide', 'Sodium bicarbonate', 'No catalyst'], ans: 0, explanation: 'Acid + alcohol → ester + water, catalysed by concentrated H₂SO₄.', trapNote: 'Calling it a neutralisation — the acid is a catalyst here, not a reactant.' },
  ],
  'math10-trigo': [
    { conceptName: 'Trigonometric ratios (sin, cos, tan and reciprocals)', q: 'In a right triangle, tan A is defined as', opts: ['Opposite side ÷ adjacent side', 'Opposite side ÷ hypotenuse', 'Adjacent side ÷ hypotenuse', 'Hypotenuse ÷ opposite side'], ans: 0, explanation: 'tan A = (side opposite A)/(side adjacent to A).', trapNote: 'Swapping the adjacent side and hypotenuse in the ratio.' },
    { conceptName: 'Ratios of 0°, 30°, 45°, 60° and 90°', q: 'The value of sin 30° is', opts: ['1/2', '√3/2', '1', '0'], ans: 0, explanation: 'sin 30° = 1/2 from the standard ratios table.', trapNote: 'Swapping sin 30° with cos 30° (√3/2).' },
    { conceptName: 'Trigonometric identities', q: 'Which identity is always true?', opts: ['1 + tan²A = sec²A', '1 + tan²A = cosec²A', 'sin²A + tan²A = 1', 'cos²A − sin²A = 1'], ans: 0, explanation: 'Dividing sin²A + cos²A = 1 by cos²A gives 1 + tan²A = sec²A.', trapNote: 'Mixing up which identity divides by cos²A vs sin²A.' },
  ],
  'math10-quadratic': [
    { conceptName: 'Quadratic formula and discriminant', q: 'The discriminant of 2x² − 4x + 3 = 0 is', opts: ['−8', '40', '8', '−40'], ans: 0, explanation: 'D = b² − 4ac = 16 − 24 = −8.', trapNote: 'Sign slip: computing 4ac before b² or mis-substituting −4.' },
    { conceptName: 'Nature of roots (real, equal, complex)', q: 'If D < 0, the quadratic equation has', opts: ['No real roots', 'Two distinct real roots', 'Two equal real roots', 'Exactly one real root'], ans: 0, explanation: 'D < 0 → the square root of a negative number → no real roots.', trapNote: 'Claiming two equal roots, which is the D = 0 case.' },
  ],
  'phy11-motion': [
    { conceptName: 'Displacement vs distance', q: 'A particle completes one full circle of radius r. Distance and displacement are', opts: ['2πr and 0', '0 and 2πr', '2πr and 2πr', 'πr and 0'], ans: 0, explanation: 'Distance = circumference 2πr; displacement = 0 (returns to start).', trapNote: 'Reporting displacement as 2πr — it is the shortest gap from start to end.' },
    { conceptName: 'Kinematic equations for uniform acceleration', q: 'For uniformly accelerated motion, v² = u² +', opts: ['2as', 'at', 'at²', 'as²'], ans: 0, explanation: 'Third kinematic equation: v² = u² + 2as.', trapNote: 'Mixing the three equations — v = u + at has no s.' },
  ],
  'phy11-laws': [
    { conceptName: 'Newton\'s second law: F = ma and momentum', q: 'Newton\'s second law in momentum form states', opts: ['F = dp/dt', 'F = p/t', 'F = mv', 'p = F/t'], ans: 0, explanation: 'Force equals the rate of change of momentum: F = dp/dt.', trapNote: 'Writing F = p (momentum itself) instead of its rate of change.' },
    { conceptName: 'Impulse and force-time graphs', q: 'Impulse equals', opts: ['Change in momentum', 'Force × velocity', 'Momentum × time', 'Change in kinetic energy'], ans: 0, explanation: 'Impulse J = FΔt = Δp — the change in momentum.', trapNote: 'Confusing impulse with work/energy quantities.' },
  ],
  'chem11-basic': [
    { conceptName: 'Mole concept and Avogadro\'s number', q: 'The number of molecules in 1 mole of any substance is', opts: ['6.022 × 10²³', '6.022 × 10²²', '1.6 × 10⁻¹⁹', '22.4 × 10²³'], ans: 0, explanation: 'Avogadro\'s number NA = 6.022 × 10²³ per mole.', trapNote: 'Mixing up 22.4 L (molar volume) with Avogadro\'s number.' },
    { conceptName: 'Molarity, molality and mole fraction', q: 'Molarity is defined as moles of solute per', opts: ['Litre of solution', 'Kilogram of solvent', 'Mole of solvent', 'Litre of solvent'], ans: 0, explanation: 'Molarity = moles of solute / volume of solution in litres.', trapNote: 'Confusing molarity (per litre of solution) with molality (per kg of solvent).' },
  ],
  'chem11-atom': [
    { conceptName: 'Quantum numbers and their meaning', q: 'Which quantum number determines the shape of an orbital?', opts: ['Azimuthal quantum number (l)', 'Principal quantum number (n)', 'Magnetic quantum number (m)', 'Spin quantum number (s)'], ans: 0, explanation: 'l defines the subshell shape (s, p, d…); m gives its orientation.', trapNote: 'Assigning shape to m (orientation) instead of l.' },
    { conceptName: 'Aufbau principle and electronic configuration', q: 'Electrons fill orbitals in order of increasing', opts: ['(n + l) value, lower n first on ties', 'n value only', 'l value only', 'Random order'], ans: 0, explanation: 'Aufbau: fill by increasing n + l; ties go to the lower n.', trapNote: 'Filling 4s after 3d, or using n alone.' },
  ],
  'cs11-mysql-ddl': [
    { conceptName: 'Candidate, primary, foreign and alternate keys', q: 'A column in one table that references the primary key of another table is a', opts: ['Foreign key', 'Candidate key', 'Alternate key', 'Composite key'], ans: 0, explanation: 'A foreign key links rows across tables via the referenced key.', trapNote: 'Calling every referencing column a candidate key.' },
    { conceptName: 'Degree and cardinality', q: 'A table has 8 columns and 12 rows. Its degree and cardinality are', opts: ['Degree 8, Cardinality 12', 'Degree 12, Cardinality 8', 'Both 8', 'Both 12'], ans: 0, explanation: 'Degree counts columns (attributes); cardinality counts rows (tuples).', trapNote: 'Swapping the two terms — the classic 1-mark trap.' },
    { conceptName: 'ALTER TABLE and DROP TABLE', q: 'Which statement changes the DATA TYPE of an existing column?', opts: ['ALTER TABLE … MODIFY COLUMN', 'UPDATE TABLE SET', 'DROP COLUMN', 'DESC TABLE'], ans: 0, explanation: 'MODIFY restates the column definition inside ALTER TABLE.', trapNote: 'Using UPDATE — that changes data values, not structure.' },
  ],
  'cs11-mysql-dml': [
    { conceptName: 'WHERE operators: BETWEEN, IN, LIKE, IS NULL', q: 'To find rows where a column has no value, use', opts: ['WHERE col IS NULL', 'WHERE col = NULL', 'WHERE col == NULL', 'WHERE col LIKE NULL'], ans: 0, explanation: 'NULL is unknown — only IS NULL / IS NOT NULL can test it.', trapNote: '= NULL never matches anything; the most common board trap.' },
    { conceptName: 'Aggregate functions and GROUP BY / HAVING', q: 'To keep only groups with average salary above 50000, use', opts: ['HAVING AVG(salary) > 50000 after GROUP BY', 'WHERE AVG(salary) > 50000', 'HAVING before GROUP BY', 'WHERE salary > 50000'], ans: 0, explanation: 'HAVING filters aggregated groups; WHERE cannot contain aggregates.', trapNote: 'Placing the aggregate condition in WHERE.' },
    { conceptName: 'Equi-join, INNER JOIN and NATURAL JOIN', q: 'NATURAL JOIN matches rows based on', opts: ['All columns with the same name in both tables', 'Any WHERE condition', 'The primary key only', 'Column order'], ans: 0, explanation: 'NATURAL JOIN implicitly equates every shared column name.', trapNote: 'Expecting NATURAL JOIN to use ON — it has no ON clause.' },
  ],
  'eng11-writing': [
    { conceptName: 'Subject-verb agreement', q: 'Choose the correct sentence.', opts: ['Neither of the boys was present', 'Neither of the boys were present', 'Neither of the boy were present', 'Neither boys was present'], ans: 0, explanation: '"Neither of + plural noun" takes a singular verb.', trapNote: 'Agreeing the verb with the plural noun instead of "neither".' },
    { conceptName: 'Reported speech transformations', q: 'He said, "I am writing a letter." → Reported:', opts: ['He said that he was writing a letter', 'He said that he is writing a letter', 'He said that he wrote a letter', 'He says that he was writing a letter'], ans: 0, explanation: 'Present continuous shifts to past continuous in reported speech.', trapNote: 'Leaving the tense unchanged or shifting the pronoun wrongly.' },
  ],
}

const GENERIC_BANK = [
  { conceptName: 'CBSE fundamentals', q: 'What is the SI unit of force?', opts: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'], ans: 0, explanation: 'Force is measured in newtons; 1 N = 1 kg·m/s².', trapNote: 'Confusing force (N) with energy (J).' },
  { conceptName: 'CBSE fundamentals', q: 'Which bond forms by complete transfer of electrons?', opts: ['Ionic bond', 'Covalent bond', 'Hydrogen bond', 'Metallic bond'], ans: 0, explanation: 'Full electron transfer creates ions held by electrostatic attraction.', trapNote: 'Calling electron sharing ionic.' },
  { conceptName: 'CBSE fundamentals', q: 'sin²θ + cos²θ equals', opts: ['1', '0', '-1', '2'], ans: 0, explanation: 'The fundamental Pythagorean identity.', trapNote: 'Applying it to tan²θ without the sec² conversion.' },
]

// ── Helpers ───────────────────────────────────────────────────

function shuffleOptions(item) {
  const opts = item.options || item.opts || []
  const order = opts.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const correctIdx = 'correctIndex' in item ? item.correctIndex : item.ans
  return {
    ...item,
    options: order.map((oi) => opts[oi]),
    correctIndex: order.indexOf(correctIdx),
  }
}

const ALL_CHAPTERS = getLearnerChapters()

export default function Quiz() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { notes } = useNotesStore()
  const learner = useLearnerStore()
  const hasKey = hasClientKey()

  const [mode, setMode] = useState('chapter') // chapter | note
  const [chapterId, setChapterId] = useState(() => searchParams.get('chapterId') || ALL_CHAPTERS[0]?.id || '')
  const [selectedNote, setSelectedNote] = useState(() => searchParams.get('noteId') || '')
  const [phase, setPhase] = useState('setup')
  const [questions, setQuestions] = useState([])
  const [chapter, setChapter] = useState(null) // { subject, chapterId, chapterTitle, concepts[] }
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [confidence, setConfidence] = useState(null)
  const [attemptInfo, setAttemptInfo] = useState(null) // { correct, before, after, conceptName }
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [usingAI, setUsingAI] = useState(false)
  const xpAwarded = useRef(false)

  const ch = chapter ? learner.getChapterState(chapter.subject, chapter.chapterId) : null

  const weakConcepts = useMemo(() => {
    if (!ch) return []
    return Object.entries(ch.concepts)
      .filter(([, c]) => c.status === 'needs_attention' || c.status === 'developing' || c.luckyGuess)
      .sort((a, b) => (a[1].status === 'needs_attention' ? -1 : 1) - (b[1].status === 'needs_attention' ? -1 : 1))
      .map(([name]) => name)
  }, [ch])

  const pickFromBank = (chapterObj, weak, n) => {
    const bank = chapterObj ? (CHAPTER_BANK[chapterObj.chapterId] || []) : GENERIC_BANK
    const norm = bank.map((b) => ({
      id: `bank-${b.q.slice(0, 18)}`,
      conceptName: b.conceptName,
      question: b.q,
      options: b.opts,
      correctIndex: b.ans,
      explanation: b.explanation,
      trapNote: b.trapNote,
    }))
    const weakSet = new Set(weak || [])
    const weakQs = norm.filter((q) => weakSet.has(q.conceptName))
    const restQs = norm.filter((q) => !weakSet.has(q.conceptName))
    return [...weakQs, ...restQs].slice(0, n)
  }

  const startQuiz = async () => {
    setLoading(true)
    xpAwarded.current = false
    let chapterObj = null
    let pageText = ''
    let concepts = []
    let weak = []

    if (mode === 'chapter') {
      chapterObj = ALL_CHAPTERS.find((c) => c.id === chapterId) || ALL_CHAPTERS[0]
      pageText = chapterObj?.summary || ''
      concepts = chapterObj?.concepts || []
      // Seed the learner state for this chapter (does not overwrite progress)
      learner.ensureChapter(chapterObj.subject, chapterObj.chapterId, `${chapterObj.classLevel} · ${chapterObj.subject} · ${chapterObj.title}`, concepts)
      const state = learner.getChapterState(chapterObj.subject, chapterObj.chapterId)
      weak = Object.entries(state?.concepts || {})
        .filter(([, c]) => c.status === 'needs_attention' || c.luckyGuess)
        .map(([name]) => name)
    } else {
      const note = (notes || []).find((n) => n.id === selectedNote)
      pageText = note ? `${note.title}\n${note.content}` : 'General CBSE Class 11 Science'
      concepts = [note?.title || 'General']
    }

    let qs = []
    if (hasKey) {
      try {
        const res = await generateQuizMeQuestions({
          chapterTitle: chapterObj ? `${chapterObj.classLevel} ${chapterObj.subject} · ${chapterObj.title}` : (concepts[0] || 'CBSE quiz'),
          pageText,
          concepts,
          weakConcepts: weak,
          count: mode === 'chapter' ? 4 : 5,
        })
        if (res.ok) { qs = res.questions; setUsingAI(true) }
      } catch (e) {
        console.warn('Quiz Me generation failed, using bank', e)
      }
    }

    // Top up from the static bank, weak concepts first
    if (qs.length < 3) {
      const need = Math.max(3, mode === 'chapter' ? 4 : 5) - qs.length
      qs = [...qs, ...pickFromBank(chapterObj, weak, need)]
      setUsingAI(false)
    }

    setChapter(chapterObj
      ? { subject: chapterObj.subject, chapterId: chapterObj.chapterId, chapterTitle: `${chapterObj.classLevel} · ${chapterObj.subject} · ${chapterObj.title}`, concepts }
      : { subject: 'General', chapterId: `note-${selectedNote || 'general'}`, chapterTitle: concepts[0] || 'General practice', concepts })
    setQuestions(qs.map(shuffleOptions))
    setLoading(false)
    setPhase('quiz')
    setCurrent(0); setSelected(null); setConfidence(null); setAttemptInfo(null); setAnswers([])
  }

  const statePercent = (s) => `${statusScore(s)}%`

  const handleSubmit = () => {
    if (selected === null || !confidence || attemptInfo) return
    const q = questions[current]
    const correct = selected === q.correctIndex
    const res = learner.recordQuizAttempt({
      subject: chapter.subject,
      chapterId: chapter.chapterId,
      chapterTitle: chapter.chapterTitle,
      conceptName: q.conceptName || 'General',
      correct,
      confidence,
      questionText: q.question,
      chosenAnswer: q.options[selected],
      correctAnswer: q.options[q.correctIndex],
    })
    setAttemptInfo({ correct, before: res.before, after: res.after, conceptName: q.conceptName || 'General' })
    setAnswers((a) => [...a, { q: current, selected, correct }])
  }

  const handleNext = () => {
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1)
      setSelected(null); setConfidence(null); setAttemptInfo(null)
    } else {
      setPhase('results')
    }
  }

  // Award real XP once per session on entering results
  useEffect(() => {
    if (phase === 'results' && !xpAwarded.current && questions.length > 0) {
      xpAwarded.current = true
      try { useXPStore.getState().addXP(answers.filter((a) => a.correct).length * 10) } catch {}
    }
  }, [phase]) // eslint-disable-line

  const score = answers.filter((a) => a.correct).length

  // ── CHAPTER LEARNER STATE footer ────────────────────────────
  const renderLearnerFooter = () => {
    if (!chapter) return null
    const state = learner.getChapterState(chapter.subject, chapter.chapterId)
    if (!state) return null
    const entries = Object.entries(state.concepts)
    return (
      <Card style={{ padding: '14px 16px', marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="metric-label">Chapter learner state</span>
          <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint, fontVariantNumeric: 'tabular-nums' }}>
            {entries.filter(([, c]) => c.status !== 'not_checked').length}/{entries.length} checked
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map(([name, c]) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', borderRadius: 10,
              background: 'rgba(20,32,27,0.55)', border: `1px solid ${C.borderSoft}`,
            }}>
              <span style={{ flex: 1, fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </span>
              <span className={`badge3d ${c.status}`} style={{ fontSize: 9, padding: '3px 9px' }}>
                {statusLabel(c.status)}
              </span>
              <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint, fontVariantNumeric: 'tabular-nums', width: 52, textAlign: 'right' }}>
                {c.attempts} att.
              </span>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (phase === 'results') {
    const perfect = score === questions.length
    const good = score >= questions.length / 2
    const ResultIcon = perfect ? Trophy : good ? ThumbsUp : BookOpenText
    const resultColor = perfect ? C.warning : good ? C.success : C.error
    const readiness = chapter ? learner.getChapterReadiness(chapter.subject, chapter.chapterId) : null
    return (
      <div className="page-enter" style={{ fontFamily: fonts.body, color: C.text, maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <Card style={{ padding: 40, marginBottom: 0 }}>
            <div style={{
              width: 68, height: 68, borderRadius: 16, margin: '0 auto 16px',
              background: C.cardSoft, border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: resultColor,
            }}>
              <ResultIcon size={34} weight="duotone" />
            </div>
            <h2 style={{ fontFamily: fonts.body, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
              {score} / {questions.length}
            </h2>
            <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 4 }}>
              {perfect ? 'Clean sweep.' : good ? 'Solid session.' : 'The weak spots are mapped now.'}
            </p>
            <p style={{ color: C.success, fontSize: 12.5, marginBottom: 20, fontFamily: fonts.mono }}>
              +{score * 10} XP
            </p>
            {readiness !== null && (
              <p style={{ fontFamily: fonts.mono, fontSize: 11, color: C.textFaint, marginBottom: 20 }}>
                CHAPTER READINESS: {readiness}% — verified from concept states, not a mark prediction.
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setPhase('setup')} style={btnGhost}>New session</button>
              <button onClick={startQuiz} style={btnPrimary}>Quiz me again</button>
            </div>
          </Card>
        </div>
        {renderLearnerFooter()}
      </div>
    )
  }

  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[current]
    const canSubmit = selected !== null && confidence !== null && !attemptInfo
    return (
      <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="metric-label">Question {current + 1} of {questions.length}</span>
            {usingAI && <span className="metric-label" style={{ padding: 0, color: C.success }}>AI TARGETED</span>}
          </span>
          <button onClick={() => setPhase('setup')} style={{ ...btnGhost, padding: '4px 10px', fontSize: 11, color: C.textMuted }}>
            <X size={13} weight="bold" /> Quit
          </button>
        </div>

        <Card style={{ padding: '18px 20px', marginBottom: 12 }}>
          <span className="metric-label" style={{ display: 'block', marginBottom: 6, padding: 0 }}>
            {q.conceptName}
          </span>
          <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em', margin: 0 }}>{q.question}</p>
        </Card>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {q.options.map((opt, i) => {
            let bg = C.card, border = C.border, color = C.text
            if (attemptInfo) {
              if (i === q.correctIndex) { bg = 'color-mix(in srgb, var(--md-primary) 10%, transparent)'; border = 'color-mix(in srgb, var(--md-primary) 45%, transparent)'; color = C.success }
              else if (i === selected && selected !== q.correctIndex) { bg = 'rgba(239,68,68,0.10)'; border = 'rgba(239,68,68,0.45)'; color = C.error }
            } else if (i === selected) {
              bg = C.cardHover; border = C.borderStrong
            }
            return (
              <button
                key={i}
                onClick={() => !attemptInfo && setSelected(i)}
                style={{
                  padding: '12px 16px', borderRadius: 4, border: `1px solid ${border}`,
                  background: bg, color, cursor: attemptInfo ? 'default' : 'pointer',
                  textAlign: 'left', fontSize: 13.5, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'border-color 0.13s ease, background 0.13s ease',
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                  background: C.cardSoft, border: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontFamily: fonts.mono, fontWeight: 600,
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            )
          })}
        </div>

        {/* Mandatory confidence bar */}
        {!attemptInfo ? (
          <div style={{
            padding: '10px 14px', borderRadius: 4,
            background: C.bgSoft, border: `1px solid ${C.borderSoft}`, marginBottom: 12,
          }}>
            <span className="metric-label" style={{ display: 'block', marginBottom: 8, padding: 0 }}>
              How sure are you? A lucky guess never counts
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {CONFIDENCE_LEVELS.map((c) => {
                const active = confidence === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setConfidence(c.id)}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 4,
                      background: active ? C.cardHover : 'transparent',
                      border: active ? `1px solid ${C.borderStrong}` : `1px solid ${C.borderSoft}`,
                      color: active ? C.text : C.textFaint,
                      cursor: 'pointer',
                      fontFamily: fonts.body, fontSize: 12, fontWeight: active ? 600 : 400,
                    }}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                ...btnPrimary, width: '100%', marginTop: 10,
                opacity: canSubmit ? 1 : 0.45,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              Submit answer
            </button>
          </div>
        ) : (
          /* Immediate state-update banner */
          <div style={{
            padding: '12px 14px', borderRadius: 4, marginBottom: 12,
            background: attemptInfo.correct ? 'color-mix(in srgb, var(--md-primary) 7%, transparent)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${attemptInfo.correct ? 'color-mix(in srgb, var(--md-primary) 35%, transparent)' : 'rgba(239,68,68,0.35)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className={`dot dot-${attemptInfo.correct ? 'success' : 'error'}`} />
              <span style={{
                fontFamily: fonts.mono, fontSize: 11, fontWeight: 600,
                color: attemptInfo.correct ? C.success : C.error,
              }}>
                {attemptInfo.correct ? 'CORRECT' : 'NOT QUITE'} · STATE UPDATED
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: C.text, margin: '0 0 6px', lineHeight: 1.5 }}>
              {attemptInfo.correct
                ? `${statePercent(attemptInfo.before.status)} ${statusLabel(attemptInfo.before.status)} → ${statePercent(attemptInfo.after.status)} ${statusLabel(attemptInfo.after.status)} · ${attemptInfo.conceptName}${attemptInfo.after.luckyGuess ? ' (lucky guess — flagged for +24h review)' : ''}`
                : `${attemptInfo.conceptName} marked ${statusLabel(attemptInfo.after.status)} — review due now`}
            </p>
            {q.explanation && (
              <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 4px', lineHeight: 1.5 }}>
                {q.explanation}
              </p>
            )}
            {q.trapNote && (
              <p style={{
                fontSize: 11.5, color: C.warning, margin: 0, lineHeight: 1.5,
                fontFamily: fonts.mono,
              }}>
                TRAP: {q.trapNote}
              </p>
            )}
            <button onClick={handleNext} style={{ ...btnPrimary, marginTop: 10, display: 'inline-flex' }}>
              {current + 1 < questions.length ? 'Next question' : 'See results'} <ArrowRight size={13} weight="bold" />
            </button>
          </div>
        )}

        {/* Progress stepper */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < current + (attemptInfo ? 1 : 0) ? C.text : i === current ? C.textMuted : C.cardSoft,
              transition: 'background 0.2s ease',
            }} />
          ))}
        </div>

        {renderLearnerFooter()}
      </div>
    )
  }

  // ── Setup ────────────────────────────────────────────────────
  const grouped = {}
  for (const c of ALL_CHAPTERS) {
    if (!grouped[c.classLevel]) grouped[c.classLevel] = {}
    if (!grouped[c.classLevel][c.subject]) grouped[c.classLevel][c.subject] = []
    grouped[c.classLevel][c.subject].push(c)
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 680, margin: '0 auto' }}>
      <PageHeader
        title="Quiz Me"
        subtitle="Confidence-weighted practice — a lucky guess never counts"
        status={hasKey ? { kind: 'success', label: 'AI targeted' } : { kind: 'warning', label: 'question bank' }}
      />
      <Card style={{ padding: 20, marginBottom: 14 }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 2, padding: 2, border: `1px solid ${C.border}`, borderRadius: 4, background: C.bgSoft, marginBottom: 16 }}>
          {[['chapter', 'Chapter practice'], ['note', 'From my notes']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 3, border: 'none',
                background: mode === id ? C.cardHover : 'transparent',
                color: mode === id ? C.text : C.textFaint,
                cursor: 'pointer', fontFamily: fonts.body, fontSize: 12.5, fontWeight: mode === id ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'chapter' ? (
          <div style={{ marginBottom: 16 }}>
            <label className="metric-label" style={{ display: 'block', marginBottom: 8, padding: 0 }}>Chapter</label>
            <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} style={inputStyle}>
              {Object.entries(grouped).map(([cls, subjects]) => (
                <optgroup key={cls} label={cls}>
                  {Object.entries(subjects).map(([subj, chs]) => (
                    chs.map((c) => (
                      <option key={c.id} value={c.id}>{subj} · Ch {c.number} — {c.title}</option>
                    ))
                  ))}
                </optgroup>
              ))}
            </select>
            <p style={{ fontSize: 11.5, color: C.textFaint, marginTop: 8, lineHeight: 1.5 }}>
              Questions target your weak concepts first. Every answer updates your learner state.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label className="metric-label" style={{ display: 'block', marginBottom: 8, padding: 0 }}>Source note</label>
            <select value={selectedNote} onChange={(e) => setSelectedNote(e.target.value)} style={inputStyle}>
              <option value=''>— General CBSE bank —</option>
              {(notes || []).map((n) => (<option key={n.id} value={n.id}>{n.title || 'Untitled'}</option>))}
            </select>
          </div>
        )}

        {!hasKey && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: C.bgSoft, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: '9px 12px', marginBottom: 16,
          }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Offline CBSE bank active — add a key for AI-targeted questions</span>
            <button
              onClick={() => navigate('/settings')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 4,
                background: C.cardHover, border: `1px solid ${C.border}`,
                color: C.text, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: fonts.body,
              }}
            >
              <Key size={11} weight="duotone" /> Add key
            </button>
          </div>
        )}

        <button onClick={startQuiz} disabled={loading} style={{
          ...btnPrimary, width: '100%', padding: 12, fontSize: 13.5,
          opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'inline-flex', justifyContent: 'center',
        }}>
          {loading ? <CircleNotch size={15} className="spin" /> : <Sparkle size={15} weight="duotone" />}
          {loading ? 'Building your session…' : 'Start Quiz Me'}
        </button>
      </Card>

      {/* Idle: what StudyPulse has noticed across all chapters */}
      {(() => {
        const noticed = learner.getNoticed().slice(0, 4)
        if (noticed.length === 0) return null
        return (
          <Card style={{ padding: '14px 16px' }}>
            <span className="metric-label" style={{ display: 'block', marginBottom: 10, padding: 0 }}>
              What StudyPulse has noticed
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {noticed.map((m) => (
                <div key={m.id} style={{
                  padding: '8px 10px', borderRadius: 4,
                  background: C.bgSoft, border: `1px solid ${C.borderSoft}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span className="dot dot-error" />
                    <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textMuted }}>
                      {m.chapterTitle} · {m.conceptName}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{m.correctiveRule}</p>
                </div>
              ))}
            </div>
          </Card>
        )
      })()}
    </div>
  )
}
