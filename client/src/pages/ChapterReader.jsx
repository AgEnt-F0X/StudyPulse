import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  X, Sparkle, CircleNotch, CaretLeft, CaretRight, Crosshair,
  ArrowsOutSimple, NotePencil, ChatCircleText, GraduationCap, Plus, Warning,
} from '@phosphor-icons/react'
import { C, fonts, btnPrimary } from '../utils/theme'
import { getAnyChapter } from '../data/ncertLibrary'
import { pickFromBank } from '../data/quizBank'
import { getPYQsForChapter } from '../data/pyqBank'
import {
  askPageGroundedTutor, generateQuizMeQuestions, generateChapterNotes,
  solveBoardPYQ, NOTE_FORMATS, hasClientKey,
} from '../utils/gemini'
import {
  useLearnerStore, useAssignmentsStore, useNotesStore, useUIStore, useXPStore,
} from '../stores'
import {
  CONFIDENCE_LEVELS, STATUS_META, statusLabel, statusScore,
} from '../utils/learnerEngine'
import { saveReadingProgress } from './Library'
import MarkdownContent from '../components/MarkdownContent'

const HIGHLIGHTS_KEY = 'studypulse-highlights'

function getHighlights(chapterKey) {
  try {
    const all = JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '{}')
    return all[chapterKey] || []
  } catch { return [] }
}

function saveHighlight(chapterKey, entry) {
  try {
    const all = JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '{}')
    const list = all[chapterKey] || []
    list.push(entry)
    all[chapterKey] = list.slice(0, 50)
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(all))
  } catch {}
}

// ── Render a text block with saved highlights marked ──────────

function HighlightedText({ text, highlights }) {
  if (!highlights.length) return text
  let out = [text]
  for (const h of highlights) {
    const next = []
    for (const seg of out) {
      if (typeof seg !== 'string' || !seg.includes(h.text)) { next.push(seg); continue }
      const parts = seg.split(h.text)
      parts.forEach((p, i) => {
        next.push(p)
        if (i < parts.length - 1) next.push(
          <span key={`${h.ts}-${i}`} style={{ background: 'rgba(245,158,11,0.18)', borderRadius: 2 }}>
            {h.text}
          </span>
        )
      })
    }
    out = next
  }
  return out
}

// ── Confidence bar (shared with Quiz page) ────────────────────

function ConfidenceBar({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {CONFIDENCE_LEVELS.map((c) => {
        const active = value === c.id
        return (
          <button key={c.id} onClick={() => onChange(c.id)} style={{
            flex: 1, padding: '5px 0', borderRadius: 3,
            background: active ? C.cardHover : 'transparent',
            border: `1px solid ${active ? C.borderStrong : C.borderSoft}`,
            color: active ? C.text : C.textFaint,
            cursor: 'pointer', fontFamily: fonts.body, fontSize: 11, fontWeight: active ? 600 : 400,
          }}>
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

export default function ChapterReader() {
  const { chapterId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { addAssignment } = useAssignmentsStore()
  const { addNote } = useNotesStore()

  const chapter = useMemo(() => getAnyChapter(chapterId), [chapterId])
  const chapterKey = `${chapter?.subject}::${chapter?.id}`

  const learner = useLearnerStore()
  useEffect(() => {
    if (chapter?.concepts?.length) {
      learner.ensureChapter(chapter.subject, chapter.id, `${chapter.classLevel} · ${chapter.subject} · ${chapter.title}`, chapter.concepts)
    }
  }, [chapterId]) // eslint-disable-line

  const [pageIndex, setPageIndex] = useState(() => {
    const p = parseInt(searchParams.get('page') || '1', 10)
    return Number.isFinite(p) && p > 0 ? p - 1 : 0
  })
  const [readerMode, setReaderMode] = useState(false)
  const [tab, setTab] = useState(null) // explain | why | pyq | quiz | notes

  // Select-area
  const [selectMode, setSelectMode] = useState(false)
  const [dragRect, setDragRect] = useState(null)
  const [crop, setCrop] = useState(null) // { base64, thumb }
  const [cropQuestion, setCropQuestion] = useState('')
  const pageRef = useRef(null)
  const dragStart = useRef(null)

  // Highlight popover
  const [selection, setSelection] = useState(null) // { text, x, y }
  const highlights = useMemo(() => getHighlights(chapterKey), [chapterKey, pageIndex]) // eslint-disable-line

  // Explain / Why thread
  const [thread, setThread] = useState([]) // { role:'you'|'ai', text, bullets, citation, followUps, mode, error }
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)

  // Quiz me drawer
  const [quizState, setQuizState] = useState(null) // { questions, idx, selected, confidence, attempt }
  const [quizLoading, setQuizLoading] = useState(false)

  // Notes drawer
  const [noteFormat, setNoteFormat] = useState('all_topics')
  const [noteData, setNoteData] = useState(null)
  const [noteLoading, setNoteLoading] = useState(false)

  const page = chapter?.pages?.[pageIndex]
  const pageText = useMemo(() => {
    if (!chapter) return ''
    return chapter.pages.map((p) => `${p.heading}\n${p.blocks.map((b) => b.text || b.description || '').join('\n')}`).join('\n\n')
  }, [chapter])

  // PYQs for this chapter
  const chapterPYQs = useMemo(() => chapter ? getPYQsForChapter(chapter.id) : [], [chapter])

  useEffect(() => {
    if (chapter) saveReadingProgress(chapter.id, pageIndex + 1)
  }, [pageIndex, chapter])

  // ── Text-selection highlight popover ─────────────────────────
  const onMouseUpPage = () => {
    if (selectMode) return
    const sel = window.getSelection()
    const text = sel?.toString()?.trim()
    if (!text || text.length < 8 || text.length > 600) { setSelection(null); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    setSelection({
      text,
      x: Math.min(rect.left, window.innerWidth - 320),
      y: rect.top - 46,
    })
  }

  const askSelection = () => {
    if (!selection) return
    setTab('explain')
    setQuestion(selection.text)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const noteSelection = () => {
    if (!selection || !chapter) return
    saveHighlight(chapterKey, {
      text: selection.text,
      ts: Date.now(),
      page: pageIndex + 1,
      chapterTitle: chapter.title,
      subject: chapter.subject,
    })
    addToast({ type: 'success', message: 'Highlight saved — used by the notes generator' })
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  // ── Select-area crop ─────────────────────────────────────────
  const startDrag = (e) => {
    if (!selectMode || !pageRef.current) return
    const rect = pageRef.current.getBoundingClientRect()
    dragStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setDragRect({ x0: dragStart.current.x, y0: dragStart.current.y, x1: dragStart.current.x, y1: dragStart.current.y })
  }
  const onDrag = (e) => {
    if (!dragStart.current || !pageRef.current) return
    const rect = pageRef.current.getBoundingClientRect()
    setDragRect((r) => r && ({ ...r, x1: e.clientX - rect.left, y1: e.clientY - rect.top }))
  }
  const endDrag = async () => {
    if (!dragStart.current || !dragRect || !pageRef.current || !chapter) return
    const rect = pageRef.current.getBoundingClientRect()
    const x0 = Math.min(dragRect.x0, dragRect.x1), x1 = Math.max(dragRect.x0, dragRect.x1)
    const y0 = Math.min(dragRect.y0, dragRect.y1), y1 = Math.max(dragRect.y0, dragRect.y1)
    dragStart.current = null
    setDragRect(null)
    if (x1 - x0 < 24 || y1 - y0 < 24) return
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(pageRef.current, { scale: 2, backgroundColor: '#FFFFFF', logging: false })
      const cropCanvas = document.createElement('canvas')
      cropCanvas.width = (x1 - x0) * 2
      cropCanvas.height = (y1 - y0) * 2
      const ctx = cropCanvas.getContext('2d')
      ctx.drawImage(canvas, x0 * 2, y0 * 2, (x1 - x0) * 2, (y1 - y0) * 2, 0, 0, cropCanvas.width, cropCanvas.height)
      const base64 = cropCanvas.toDataURL('image/png').split(',')[1]
      setCrop({ base64, thumb: `data:image/png;base64,${base64}` })
      setCropQuestion('')
      // Pre-fill with nearby page text for grounding
      void rect
    } catch (e) {
      addToast({ type: 'error', message: 'Crop failed — try again' })
    }
  }

  const askCrop = async () => {
    if (!crop || !cropQuestion.trim() || !chapter) return
    const q = cropQuestion.trim()
    setCrop(null)
    setTab('explain')
    await runAsk(q, crop.base64)
  }

  // ── Grounded tutor call ──────────────────────────────────────
  const runAsk = async (q, imageBase64 = null, { simpler = false, tabMode = tab === 'why' ? 'why' : 'explain' } = {}) => {
    if (!q?.trim() || !chapter || asking) return
    setAsking(true)
    setThread((t) => [...t, { role: 'you', text: q, mode: tabMode }])
    if (tab === null) setTab('explain')
    const res = await askPageGroundedTutor({
      pageText,
      croppedImageBase64: imageBase64,
      question: q,
      tabMode,
      simpler,
      pageNumber: pageIndex + 1,
      chapterTitle: chapter.title,
    })
    setThread((t) => [...t, {
      role: 'ai',
      text: res.answerMarkdown || (res.ok ? '' : 'The tutor engine is unavailable right now. Add an API key in Settings, or retry in a moment.'),
      bullets: res.keyBullets || [],
      citation: res.sectionCitation || '',
      followUps: res.followUpSuggestions || [],
      ok: res.ok,
      simpler,
    }])
    setAsking(false)
    setQuestion('')
  }

  const addToPlan = () => {
    if (!chapter) return
    addAssignment({
      title: `Read: ${chapter.title}`,
      course: chapter.subject,
      courseName: chapter.subject,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      status: 'pending', priority: 'medium', completed: false,
      createdAt: new Date().toISOString(),
    })
    addToast({ type: 'success', message: 'Added to your plan (Assignments)' })
  }

  // ── Quiz Me drawer session ───────────────────────────────────
  const startDrawerQuiz = async () => {
    if (!chapter) return
    setQuizLoading(true)
    const state = learner.getChapterState(chapter.subject, chapter.id)
    const weak = Object.entries(state?.concepts || {})
      .filter(([, c]) => c.status === 'needs_attention' || c.luckyGuess)
      .map(([name]) => name)
    let qs = []
    if (hasClientKey()) {
      try {
        const res = await generateQuizMeQuestions({
          chapterTitle: chapter.title, pageText, concepts: chapter.concepts || [], weakConcepts: weak, count: 3,
        })
        if (res.ok) qs = res.questions
      } catch {}
    }
    if (qs.length === 0) qs = pickFromBank(chapter.id, weak, 3)
    setQuizState({ questions: qs, idx: 0, selected: null, confidence: null, attempt: null, done: false })
    setQuizLoading(false)
  }

  const submitDrawerAnswer = () => {
    const st = quizState
    if (!st || st.selected === null || !st.confidence || st.attempt) return
    const q = st.questions[st.idx]
    const correct = st.selected === q.correctIndex
    const res = learner.recordQuizAttempt({
      subject: chapter.subject, chapterId: chapter.id,
      chapterTitle: `${chapter.classLevel} · ${chapter.subject} · ${chapter.title}`,
      conceptName: q.conceptName || chapter.concepts?.[0] || chapter.title,
      correct, confidence: st.confidence,
      questionText: q.question,
      chosenAnswer: q.options[st.selected],
      correctAnswer: q.options[q.correctIndex],
    })
    setQuizState({ ...st, attempt: { correct, before: res.before, after: res.after } })
  }

  const nextDrawerQuestion = () => {
    const st = quizState
    if (st.idx + 1 < st.questions.length) {
      setQuizState({ ...st, idx: st.idx + 1, selected: null, confidence: null, attempt: null })
    } else {
      try { useXPStore.getState().addXP(st.questions.filter((q, i) => true).length ? 10 : 0) } catch {}
      setQuizState({ ...st, done: true })
    }
  }

  // ── Notes drawer ─────────────────────────────────────────────
  const makeNotes = async () => {
    if (!chapter) return
    setNoteLoading(true)
    const highlightTexts = getHighlights(chapterKey).map((h) => h.text)
    const res = await generateChapterNotes({
      chapterTitle: chapter.title, pageText, highlights: highlightTexts, format: noteFormat,
    })
    setNoteData(res.ok ? res : { ok: false, format: noteFormat, data: null, error: res.error })
    setNoteLoading(false)
  }

  const saveNotesToStore = () => {
    if (!noteData?.ok || !chapter) return
    addNote({
      title: `${chapter.title} — ${NOTE_FORMATS.find((f) => f.id === noteFormat)?.label || 'Notes'}`,
      content: JSON.stringify(noteData, null, 2),
      color: '#EDEDED',
    })
    addToast({ type: 'success', message: 'Saved to Notes' })
    setTab(null)
  }

  // ── PYQ ask ──────────────────────────────────────────────────
  const [pyqAnswer, setPyqAnswer] = useState(null) // { pyq, loading, data, error }
  const askPyq = async (pyq) => {
    setPyqAnswer({ pyq, loading: true })
    const res = await solveBoardPYQ({
      pyqQuestion: pyq.question, marks: pyq.marks, year: pyq.year,
      subject: chapter?.subject || pyq.subject, chapterTitle: chapter?.title,
    })
    setPyqAnswer({ pyq, loading: false, ...res })
  }

  // ── Idle drawer: What StudyPulse has noticed ─────────────────
  const chapterState = chapter ? learner.getChapterState(chapter.subject, chapter.id) : null
  const weakConcepts = useMemo(() => {
    if (!chapterState) return []
    return Object.entries(chapterState.concepts)
      .filter(([, c]) => c.status === 'needs_attention' || c.status === 'developing' || c.luckyGuess)
      .sort((a, b) => (a[1].status === 'needs_attention' ? -1 : 0))
  }, [chapterState])
  const chapterMisconceptions = useMemo(() =>
    learner.getNoticed().filter((m) => m.chapterId === chapter?.id).slice(0, 3),
  [learner.noticedMisconceptions, chapterId]) // eslint-disable-line

  if (!chapter) {
    return (
      <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 560, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: C.textMuted }}>Chapter not found.</p>
        <button onClick={() => navigate('/library')} style={{ ...btnPrimary, marginTop: 14 }}>Back to Library</button>
      </div>
    )
  }

  const TABS = [
    { id: 'explain', label: 'Explain', icon: ChatCircleText },
    { id: 'why', label: 'Why this?', icon: Sparkle },
    { id: 'pyq', label: 'PYQ', icon: GraduationCap },
    { id: 'quiz', label: 'Quiz Me', icon: NotePencil },
    { id: 'notes', label: 'My Notes', icon: NotePencil },
  ]

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 1240, margin: '0 auto' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, flexWrap: 'wrap', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button onClick={() => navigate('/library')} style={{
            fontFamily: fonts.mono, fontSize: 10.5, color: C.textMuted,
            background: 'none', border: 'none', cursor: 'pointer',
          }}>
            ← {chapter.subject} · {chapter.classLevel}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="metric-label" style={{ padding: 0 }}>page {pageIndex + 1} / {chapter.pages.length}</span>
          <button onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={pageIndex === 0} style={{
            padding: '4px 8px', borderRadius: 3, background: 'transparent',
            border: `1px solid ${C.borderSoft}`, color: pageIndex === 0 ? C.textFaint : C.text,
            cursor: pageIndex === 0 ? 'default' : 'pointer', display: 'flex',
          }}><CaretLeft size={12} /></button>
          <button onClick={() => setPageIndex((p) => Math.min(chapter.pages.length - 1, p + 1))} disabled={pageIndex >= chapter.pages.length - 1} style={{
            padding: '4px 8px', borderRadius: 3, background: 'transparent',
            border: `1px solid ${C.borderSoft}`, color: pageIndex >= chapter.pages.length - 1 ? C.textFaint : C.text,
            cursor: pageIndex >= chapter.pages.length - 1 ? 'default' : 'pointer', display: 'flex',
          }}><CaretRight size={12} /></button>
          <button onClick={addToPlan} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 3,
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.text, cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5, fontWeight: 500,
          }}>
            <Plus size={12} weight="bold" /> Add to my plan
          </button>
          <button onClick={() => setSelectMode((s) => !s)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 3,
            background: selectMode ? C.cardHover : 'transparent',
            border: `1px solid ${selectMode ? C.borderStrong : C.border}`,
            color: selectMode ? C.warning : C.text, cursor: 'pointer',
            fontFamily: fonts.body, fontSize: 11.5, fontWeight: 500,
          }}>
            <Crosshair size={12} /> {selectMode ? 'Selecting…' : 'Select area'}
          </button>
          <button onClick={() => setReaderMode((r) => !r)} title="Reader mode" style={{
            padding: '5px 9px', borderRadius: 3, background: 'transparent',
            border: `1px solid ${C.border}`, color: C.text, cursor: 'pointer', display: 'flex',
          }}><ArrowsOutSimple size={12} /></button>
        </div>
      </div>

      <div className="reader-grid" style={{ display: 'grid', gridTemplateColumns: readerMode ? '1fr' : '1fr 320px', gap: 16, alignItems: 'start' }}>
        {/* Page canvas */}
        <div style={{ position: 'relative' }}>
          <div
            ref={pageRef}
            onMouseDown={startDrag}
            onMouseMove={onDrag}
            onMouseUp={() => { if (selectMode) { endDrag() } else { onMouseUpPage() } }}
            className="paper paper-spine"
            style={{
              border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '36px 44px', minHeight: 520,
              cursor: selectMode ? 'crosshair' : 'text',
              userSelect: selectMode ? 'none' : 'text',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(30,25,15,0.4)',
            }}
          >
            <div style={{
              fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.08em',
              color: '#8A8578', textTransform: 'uppercase', marginBottom: 4,
            }}>
              NCERT textbook · {chapter.subject} {chapter.number ? `· Ch ${chapter.number}` : ''}
            </div>
            <h2 style={{ fontFamily: fonts.body, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#1C1B18', margin: '0 0 16px' }}>
              {page?.heading || chapter.title}
            </h2>
            {(page?.blocks || []).map((b, i) => {
              if (b.type === 'figure') {
                return (
                  <div key={i} data-figure="1" style={{
                    margin: '18px 0', padding: '18px 20px',
                    background: '#FFFFFF', border: '1px solid #D8D2C2', borderRadius: 4,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      minHeight: 90, border: '1px dashed #C9C2AE', borderRadius: 3,
                      padding: 14, color: '#5C5647', textAlign: 'center', fontSize: 13, lineHeight: 1.55,
                    }}>
                      {b.description}
                    </div>
                    <div style={{
                      marginTop: 8, fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
                      color: '#6B6455', textAlign: 'center',
                    }}>{b.caption}</div>
                  </div>
                )
              }
              return (
                <p key={i} style={{
                  fontSize: 14.5, lineHeight: 1.75, color: '#26241E',
                  margin: '0 0 14px', fontFamily: fonts.body,
                }}>
                  <HighlightedText text={b.text} highlights={highlights} />
                </p>
              )
            })}
            <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: '#A39C8A' }}>{chapter.subject} · {chapter.classLevel}</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: '#A39C8A' }}>{pageIndex + 1}</span>
            </div>

            {/* Glowing emerald select-area overlay */}
            {selectMode && dragRect && (
              <>
                <div style={{
                  position: 'absolute',
                  left: Math.min(dragRect.x0, dragRect.x1),
                  top: Math.min(dragRect.y0, dragRect.y1),
                  width: Math.abs(dragRect.x1 - dragRect.x0),
                  height: Math.abs(dragRect.y1 - dragRect.y0),
                  border: '2px solid #10B981',
                  background: 'rgba(16,185,129,0.15)',
                  boxShadow: '0 0 25px rgba(16,185,129,0.4)',
                  pointerEvents: 'none',
                }} />
                {/* Corner handles */}
                {[[-5, -5, 'nw'], [null, -5, 'ne'], [-5, null, 'sw'], [null, null, 'se']].map(([dx, dy, key], i) => (
                  <span key={key} style={{
                    position: 'absolute', width: 9, height: 9,
                    left: dx !== null ? Math.min(dragRect.x0, dragRect.x1) + dx : Math.max(dragRect.x0, dragRect.x1) - 4,
                    top: dy !== null ? Math.min(dragRect.y0, dragRect.y1) + dy : Math.max(dragRect.y0, dragRect.y1) - 4,
                    background: '#10B981', border: '1.5px solid #06251A',
                    borderRadius: 2, boxShadow: '0 0 8px rgba(16,185,129,0.7)',
                    pointerEvents: 'none',
                  }} />
                ))}
                {/* Floating dark-glass pill */}
                <div style={{
                  position: 'absolute',
                  left: Math.min(dragRect.x0, dragRect.x1),
                  top: Math.min(dragRect.y0, dragRect.y1) - 30,
                  padding: '3px 12px', borderRadius: 999,
                  background: 'rgba(18,29,24,0.92)', border: '1px solid rgba(212,195,163,0.4)',
                  color: '#6EE7B7', fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                  pointerEvents: 'none', whiteSpace: 'nowrap',
                }}>
                  Select Area to Ask
                </div>
              </>
            )}
          </div>

          {/* Crop prompt box */}
          {crop && (
            <div style={{
              position: 'absolute', right: 18, bottom: 18, width: 300,
              background: C.card, border: `1px solid ${C.borderStrong}`, borderRadius: 4,
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 30,
            }}>
              <div className="metric-label" style={{ padding: '8px 12px 6px', borderBottom: `1px solid ${C.borderSoft}` }}>
                From an area on page {pageIndex + 1}
              </div>
              <img src={crop.thumb} alt="Selected region" style={{ width: '100%', display: 'block', borderBottom: `1px solid ${C.borderSoft}`, maxHeight: 140, objectFit: 'contain', background: '#fff' }} />
              <div style={{ padding: 10 }}>
                <textarea
                  value={cropQuestion}
                  onChange={(e) => setCropQuestion(e.target.value)}
                  placeholder="Ask about this part in English, Hindi or Hinglish…"
                  rows={2}
                  style={{
                    width: '100%', background: C.bgSoft, border: `1px solid ${C.border}`,
                    borderRadius: 4, color: C.text, fontFamily: fonts.body, fontSize: 12,
                    padding: '8px 10px', resize: 'none', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button onClick={() => setCrop(null)} style={{
                    padding: '5px 12px', borderRadius: 3, background: 'transparent',
                    border: `1px solid ${C.border}`, color: C.textMuted,
                    cursor: 'pointer', fontFamily: fonts.body, fontSize: 12,
                  }}>Cancel</button>
                  <button onClick={askCrop} disabled={!cropQuestion.trim()} style={{
                    ...btnPrimary, padding: '5px 12px', fontSize: 12,
                    opacity: cropQuestion.trim() ? 1 : 0.45,
                  }}>
                    <Sparkle size={12} weight="duotone" /> Ask StudyPulse
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selection popover */}
          {selection && !selectMode && (
            <div style={{
              position: 'fixed', left: selection.x, top: Math.max(8, selection.y),
              zIndex: 60, display: 'flex', gap: 6,
              background: C.card, border: `1px solid ${C.borderStrong}`, borderRadius: 4,
              padding: 5, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              <button onClick={askSelection} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 9px', borderRadius: 3, background: C.cardHover,
                border: `1px solid ${C.border}`, color: C.text,
                cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5, fontWeight: 500,
              }}>
                <Sparkle size={11} /> Ask StudyPulse
              </button>
              <button onClick={noteSelection} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 9px', borderRadius: 3, background: 'transparent',
                border: `1px solid ${C.borderSoft}`, color: C.textMuted,
                cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5,
              }}>
                <Plus size={11} weight="bold" /> Add to Notes
              </button>
              <button onClick={() => setSelection(null)} style={{
                padding: '4px 6px', borderRadius: 3, background: 'transparent',
                border: 'none', color: C.textFaint, cursor: 'pointer', display: 'flex',
              }}><X size={11} /></button>
            </div>
          )}
        </div>

        {/* Companion drawer */}
        {!readerMode && (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
            display: 'flex', flexDirection: 'column', minHeight: 520,
            position: 'sticky', top: 56,
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: 6, borderBottom: `1px solid ${C.borderSoft}` }}>
              {TABS.map((t) => {
                const active = tab === t.id
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => setTab(tab === t.id ? null : t.id)} style={{
                    flex: '1 1 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '6px 8px', borderRadius: 3, border: 'none',
                    background: active ? C.cardHover : 'transparent',
                    color: active ? C.text : C.textFaint,
                    cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5, fontWeight: active ? 600 : 400,
                  }}>
                    <Icon size={12} /> {t.label}
                  </button>
                )
              })}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 12, maxHeight: 'calc(100vh - 200px)' }}>
              {/* Idle: What StudyPulse has noticed */}
              {!tab && (
                <div>
                  <span className="metric-label" style={{ display: 'block', marginBottom: 10, padding: 0 }}>
                    What StudyPulse has noticed
                  </span>
                  {chapterMisconceptions.length === 0 && weakConcepts.length === 0 ? (
                    <p style={{ fontSize: 12, color: C.textFaint, lineHeight: 1.6 }}>
                      Nothing yet. Take a Quiz Me on this chapter — slips and weak ideas will appear here with one-click practice.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {chapterMisconceptions.map((m) => (
                        <div key={m.id} style={{ padding: '9px 10px', borderRadius: 4, background: C.bgSoft, border: `1px solid ${C.borderSoft}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span className="dot dot-error" />
                            <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textMuted }}>{m.conceptName}</span>
                          </div>
                          <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{m.correctiveRule}</p>
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            <button onClick={() => setTab('quiz')} style={{
                              padding: '3px 10px', borderRadius: 3, background: C.cardHover,
                              border: `1px solid ${C.border}`, color: C.text,
                              cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5, fontWeight: 600,
                            }}>Practise this</button>
                            <button onClick={() => learner.dismissMisconception(m.id)} style={{
                              padding: '3px 8px', borderRadius: 3, background: 'transparent',
                              border: `1px solid ${C.borderSoft}`, color: C.textFaint,
                              cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5,
                            }}>This isn't right</button>
                          </div>
                        </div>
                      ))}
                      {weakConcepts.map(([name, c]) => (
                        <div key={name} style={{ padding: '9px 10px', borderRadius: 4, background: C.bgSoft, border: `1px solid ${C.borderSoft}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span className={`dot dot-${STATUS_META[c.status]?.dot}`} />
                            <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textMuted }}>
                              {name} · {statusLabel(c.status)} · {c.attempts} att.
                            </span>
                          </div>
                          <button onClick={() => setTab('quiz')} style={{
                            padding: '3px 10px', borderRadius: 3, background: C.cardHover,
                            border: `1px solid ${C.border}`, color: C.text,
                            cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5, fontWeight: 600,
                          }}>Practise this</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Explain / Why chat */}
              {(tab === 'explain' || tab === 'why') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 380 }}>
                  <span className="metric-label" style={{ padding: 0 }}>
                    {tab === 'why' ? 'First principles · how CBSE tests it' : 'Grounded in your page'} — EN / हिंदी / Hinglish
                  </span>
                  {thread.filter((m) => m.role === 'you' && (m.mode || 'explain') === tab).length === 0 &&
                    thread.filter((m) => m.role === 'ai').length === 0 && (
                    <p style={{ fontSize: 12, color: C.textFaint, lineHeight: 1.6 }}>
                      Select a sentence on the page, crop a diagram with Select area, or type below. Answers cite the exact section.
                    </p>
                  )}
                  {thread.map((m, i) => (
                    <div key={i} style={m.role === 'you' ? {
                      alignSelf: 'flex-end', maxWidth: '88%',
                      padding: '7px 10px', borderRadius: 4,
                      background: C.cardHover, border: `1px solid ${C.border}`,
                      fontSize: 12.5, lineHeight: 1.5,
                    } : {
                      alignSelf: 'stretch',
                      padding: '0 0 0 10px', borderLeft: `2px solid ${C.borderStrong}`,
                    }}>
                      {m.role === 'ai' ? (
                        <>
                          <MarkdownContent content={m.text} />
                          {m.bullets?.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              {m.bullets.map((b, j) => (
                                <div key={j} style={{ display: 'flex', gap: 6, fontSize: 12, color: C.textMuted, margin: '3px 0' }}>
                                  <span className="dot dot-neutral" style={{ marginTop: 6 }} />{b}
                                </div>
                              ))}
                            </div>
                          )}
                          {m.citation && (
                            <div style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, marginTop: 8 }}>
                              SOURCE · {m.citation} · p.{pageIndex + 1}
                            </div>
                          )}
                          {m.followUps?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                              {m.followUps.map((f, j) => (
                                <button key={j} onClick={() => runAsk(f)} style={{
                                  padding: '3px 8px', borderRadius: 3, background: 'transparent',
                                  border: `1px solid ${C.borderSoft}`, color: C.textMuted,
                                  cursor: 'pointer', fontFamily: fonts.body, fontSize: 10.5, textAlign: 'left',
                                }}>{f}</button>
                              ))}
                            </div>
                          )}
                          {m.ok && (
                            <button onClick={() => runAsk(m.role === 'ai' ? thread[i - 1]?.text || 'explain again' : '', null, { simpler: true })} style={{
                              marginTop: 8, padding: '3px 9px', borderRadius: 3,
                              background: 'transparent', border: `1px solid ${C.borderSoft}`,
                              color: C.textMuted, cursor: 'pointer', fontFamily: fonts.mono, fontSize: 10,
                            }}>
                              Say it simpler
                            </button>
                          )}
                        </>
                      ) : (
                        <span>{m.text}</span>
                      )}
                    </div>
                  ))}
                  {asking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10 }}>
                      <CircleNotch size={12} className="spin" style={{ color: C.textFaint }} />
                      <span className="metric-label" style={{ padding: 0 }}>grounded tutor…</span>
                    </div>
                  )}
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runAsk(question) }
                      }}
                      placeholder="Ask about this page… (English, Hindi or Hinglish)"
                      rows={2}
                      style={{
                        width: '100%', background: C.bgSoft, border: `1px solid ${C.border}`,
                        borderRadius: 4, color: C.text, fontFamily: fonts.body, fontSize: 12.5,
                        padding: '8px 10px', resize: 'none', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                      <button onClick={() => runAsk(question)} disabled={!question.trim() || asking} style={{
                        ...btnPrimary, padding: '6px 14px', fontSize: 12,
                        opacity: question.trim() && !asking ? 1 : 0.4,
                      }}>
                        <Sparkle size={12} weight="duotone" /> Ask
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PYQ tab */}
              {tab === 'pyq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="metric-label" style={{ padding: 0 }}>
                    Official board questions · {chapterPYQs.length} for this chapter
                  </span>
                  {chapterPYQs.length === 0 && (
                    <p style={{ fontSize: 12, color: C.textFaint }}>No PYQs mapped to this chapter yet — see the full vault under PYQ.</p>
                  )}
                  {chapterPYQs.map((p) => {
                    const open = pyqAnswer?.pyq?.id === p.id
                    return (
                      <div key={p.id} style={{ padding: '9px 10px', borderRadius: 4, background: C.bgSoft, border: `1px solid ${C.borderSoft}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span className="metric-label" style={{ padding: 0 }}>{p.year} · {p.marks}M · {p.type}</span>
                          <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>{p.setCode}</span>
                        </div>
                        <p style={{ fontSize: 12.5, color: C.text, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>{p.question}</p>
                        {p.options && (
                          <div style={{ marginTop: 6, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                            {p.options.map((o, i) => <div key={i}>({String.fromCharCode(65 + i)}) {o}</div>)}
                          </div>
                        )}
                        <button onClick={() => askPyq(p)} style={{
                          marginTop: 8, padding: '3px 10px', borderRadius: 3,
                          background: C.cardHover, border: `1px solid ${C.border}`,
                          color: C.text, cursor: 'pointer',
                          fontFamily: fonts.body, fontSize: 11.5, fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}>
                          <Sparkle size={11} /> Ask StudyPulse
                        </button>
                        {open && (
                          <div style={{ marginTop: 10, paddingLeft: 10, borderLeft: `2px solid ${C.borderStrong}` }}>
                            {pyqAnswer.loading && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <CircleNotch size={12} className="spin" style={{ color: C.textFaint }} />
                                <span className="metric-label" style={{ padding: 0 }}>marking scheme…</span>
                              </div>
                            )}
                            {pyqAnswer.ok && (
                              <>
                                {pyqAnswer.gradingOfDraft && (
                                  <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 8px' }}>{pyqAnswer.gradingOfDraft}</p>
                                )}
                                {pyqAnswer.valuePoints.map((v, i) => (
                                  <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0' }}>
                                    <span style={{
                                      fontFamily: fonts.mono, fontSize: 10, color: C.success,
                                      flexShrink: 0, width: 26,
                                    }}>{v.marks}M</span>
                                    <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                                      <strong style={{ fontWeight: 600 }}>{v.step}</strong>
                                      {v.detail ? ` — ${v.detail}` : ''}
                                    </span>
                                  </div>
                                ))}
                                {pyqAnswer.modelAnswer && (
                                  <div style={{ marginTop: 10 }}>
                                    <span className="metric-label" style={{ display: 'block', marginBottom: 6, padding: 0 }}>Model answer</span>
                                    <MarkdownContent content={pyqAnswer.modelAnswer} />
                                  </div>
                                )}
                                {pyqAnswer.examinerTip && (
                                  <p style={{
                                    marginTop: 10, fontSize: 11.5, color: C.warning, lineHeight: 1.5,
                                    fontFamily: fonts.mono,
                                  }}>TRAP · {pyqAnswer.examinerTip}</p>
                                )}
                              </>
                            )}
                            {!pyqAnswer.loading && !pyqAnswer.ok && pyqAnswer.error && (
                              <p style={{ fontSize: 12, color: C.error, fontFamily: fonts.mono }}>
                                {pyqAnswer.error === 'no_key' ? 'Add an API key in Settings for the walkthrough.' : `Engine error: ${pyqAnswer.error}`}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Quiz Me tab */}
              {tab === 'quiz' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {!quizState ? (
                    <>
                      <span className="metric-label" style={{ padding: 0 }}>A quick Quiz Me after reading</span>
                      <p style={{ fontSize: 12, color: C.textFaint, lineHeight: 1.6 }}>
                        3 questions on this chapter, aimed at your weak concepts. Declare how sure you are — a lucky guess never counts.
                      </p>
                      <button onClick={startDrawerQuiz} disabled={quizLoading} style={btnPrimary}>
                        {quizLoading ? <CircleNotch size={13} className="spin" /> : <Sparkle size={13} weight="duotone" />}
                        Quiz me
                      </button>
                    </>
                  ) : quizState.done ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="dot dot-success" />
                        <span style={{ fontFamily: fonts.mono, fontSize: 11, color: C.text }}>Session complete · +10 XP</span>
                      </div>
                      <button onClick={() => setQuizState(null)} style={{ ...btnGhost, alignSelf: 'flex-start' }}>
                        Another round
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="metric-label" style={{ padding: 0 }}>
                        Question {quizState.idx + 1} of {quizState.questions.length} · {quizState.questions[quizState.idx].conceptName}
                      </span>
                      <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                        {quizState.questions[quizState.idx].question}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {quizState.questions[quizState.idx].options.map((opt, i) => {
                          const q = quizState.questions[quizState.idx]
                          let bg = 'transparent', border = C.borderSoft, color = C.text
                          if (quizState.attempt) {
                            if (i === q.correctIndex) { bg = 'rgba(16,185,129,0.10)'; border = 'rgba(16,185,129,0.45)'; color = C.success }
                            else if (i === quizState.selected) { bg = 'rgba(239,68,68,0.10)'; border = 'rgba(239,68,68,0.45)'; color = C.error }
                          } else if (i === quizState.selected) { bg = C.cardHover; border = C.borderStrong }
                          return (
                            <button key={i} onClick={() => !quizState.attempt && setQuizState({ ...quizState, selected: i })} style={{
                              textAlign: 'left', padding: '7px 10px', borderRadius: 3,
                              background: bg, border: `1px solid ${border}`, color,
                              cursor: quizState.attempt ? 'default' : 'pointer',
                              fontFamily: fonts.body, fontSize: 12, lineHeight: 1.45,
                            }}>
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                      {!quizState.attempt ? (
                        <>
                          <div>
                            <span className="metric-label" style={{ display: 'block', marginBottom: 5, padding: 0 }}>How sure are you?</span>
                            <ConfidenceBar value={quizState.confidence} onChange={(id) => setQuizState({ ...quizState, confidence: id })} />
                          </div>
                          <button
                            onClick={submitDrawerAnswer}
                            disabled={quizState.selected === null || !quizState.confidence}
                            style={{ ...btnPrimary, opacity: quizState.selected !== null && quizState.confidence ? 1 : 0.4 }}
                          >
                            Submit answer
                          </button>
                        </>
                      ) : (
                        <div style={{
                          padding: '9px 11px', borderRadius: 4,
                          background: quizState.attempt.correct ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.06)',
                          border: `1px solid ${quizState.attempt.correct ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                            <span className={`dot dot-${quizState.attempt.correct ? 'success' : 'error'}`} />
                            <span style={{
                              fontFamily: fonts.mono, fontSize: 10.5,
                              color: quizState.attempt.correct ? C.success : C.error,
                            }}>
                              {quizState.attempt.correct ? 'CORRECT' : 'NOT QUITE'} · STATE UPDATED
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: C.text, margin: 0, lineHeight: 1.5 }}>
                            {quizState.attempt.correct
                              ? `${statusScore(quizState.attempt.before.status)}% ${statusLabel(quizState.attempt.before.status)} → ${statusScore(quizState.attempt.after.status)}% ${statusLabel(quizState.attempt.after.status)}${quizState.attempt.after.luckyGuess ? ' · lucky guess — +24h review' : ''}`
                              : `${quizState.questions[quizState.idx].conceptName} marked ${statusLabel(quizState.attempt.after.status)}`}
                          </p>
                          {quizState.questions[quizState.idx].trapNote && (
                            <p style={{ fontSize: 11, color: C.warning, fontFamily: fonts.mono, margin: '6px 0 0', lineHeight: 1.5 }}>
                              TRAP · {quizState.questions[quizState.idx].trapNote}
                            </p>
                          )}
                          <button onClick={nextDrawerQuestion} style={{ ...btnPrimary, marginTop: 8 }}>
                            {quizState.idx + 1 < quizState.questions.length ? 'Next' : 'Finish'}
                          </button>
                        </div>
                      )}
                      {/* Mini learner state */}
                      {chapterState && (
                        <div style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 8 }}>
                          <span className="metric-label" style={{ display: 'block', marginBottom: 6, padding: 0 }}>Chapter learner state</span>
                          {Object.entries(chapterState.concepts).map(([name, c]) => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '3px 0' }}>
                              <span className={`dot dot-${STATUS_META[c.status]?.dot}`} />
                              <span style={{ flex: 1, fontSize: 11.5, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                              <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>{statusLabel(c.status)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Notes tab */}
              {tab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span className="metric-label" style={{ padding: 0 }}>
                    Notes from your chapter + highlights ({getHighlights(chapterKey).length})
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {NOTE_FORMATS.map((f) => (
                      <button key={f.id} onClick={() => setNoteFormat(f.id)} style={{
                        padding: '4px 10px', borderRadius: 3,
                        background: noteFormat === f.id ? C.cardHover : 'transparent',
                        border: `1px solid ${noteFormat === f.id ? C.borderStrong : C.borderSoft}`,
                        color: noteFormat === f.id ? C.text : C.textMuted,
                        cursor: 'pointer', fontFamily: fonts.body, fontSize: 11.5,
                      }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={makeNotes} disabled={noteLoading || !hasClientKey()} style={{
                    ...btnPrimary, opacity: noteLoading || !hasClientKey() ? 0.5 : 1,
                  }}>
                    {noteLoading ? <CircleNotch size={13} className="spin" /> : <Sparkle size={13} weight="duotone" />}
                    {noteLoading ? 'Building notes…' : hasClientKey() ? 'Make notes' : 'Needs API key'}
                  </button>
                  {noteData?.ok && noteData.data && (
                    <div style={{ paddingLeft: 10, borderLeft: `2px solid ${C.borderStrong}` }}>
                      <NoteRenderer data={noteData.data} format={noteFormat} />
                      <button onClick={saveNotesToStore} style={{ ...btnGhost, marginTop: 12 }}>
                        <Plus size={12} weight="bold" /> Save to Notes
                      </button>
                    </div>
                  )}
                  {noteData && !noteData.ok && (
                    <p style={{ fontFamily: fonts.mono, fontSize: 11, color: C.error }}>
                      {noteData.error === 'no_key' ? 'Add an API key in Settings.' : `Generation failed: ${noteData.error}`}
                    </p>
                  )}
                  {getHighlights(chapterKey).length > 0 && (
                    <div style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 8 }}>
                      <span className="metric-label" style={{ display: 'block', marginBottom: 6, padding: 0 }}>Your highlights</span>
                      {getHighlights(chapterKey).slice(-5).reverse().map((h) => (
                        <div key={h.ts} style={{ fontSize: 11.5, color: C.textMuted, margin: '4px 0', lineHeight: 1.5 }}>
                          <span style={{ color: C.textFaint, fontFamily: fonts.mono, fontSize: 9.5 }}>p.{h.page} — </span>
                          {h.text.slice(0, 90)}{h.text.length > 90 ? '…' : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .reader-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ── Structured notes renderer (all 6 formats) ─────────────────

function NoteRenderer({ data, format }) {
  const d = data
  if (!d) return null

  if (format === 'all_topics' && Array.isArray(d.sections)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {d.sections.map((s, i) => (
          <div key={i}>
            <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{s.title}</div>
            {(s.points || []).map((p, j) => (
              <div key={j} style={{ display: 'flex', gap: 6, fontSize: 12.5, color: C.textMuted, margin: '3px 0', lineHeight: 1.55 }}>
                <span className="dot dot-neutral" style={{ marginTop: 7 }} />{p}
              </div>
            ))}
            {s.examTip && (
              <p style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.warning, marginTop: 4 }}>TIP · {s.examTip}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (format === 'mind_map' && d.root) {
    const renderNode = (node, depth) => (
      <div key={node.label + depth} style={{ paddingLeft: depth * 14, marginTop: 4 }}>
        <div style={{
          display: 'inline-block', padding: '3px 9px', borderRadius: 3, fontSize: 12,
          background: depth === 0 ? C.cardHover : C.bgSoft,
          border: `1px solid ${depth === 0 ? C.borderStrong : C.borderSoft}`,
          color: C.text, fontWeight: depth === 0 ? 600 : 400,
        }}>{node.label}</div>
        {(node.children || []).map((c) => renderNode(c, depth + 1))}
      </div>
    )
    return <div>{renderNode({ label: d.root, children: d.children }, 0)}</div>
  }

  if (format === 'flow_chart' && Array.isArray(d.nodes)) {
    const nodeById = Object.fromEntries(d.nodes.map((n) => [n.id, n]))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        {d.nodes.map((n, i) => (
          <div key={n.id}>
            <div style={{ padding: '6px 12px', borderRadius: 4, background: C.bgSoft, border: `1px solid ${C.border}`, fontSize: 12.5, color: C.text }}>
              {n.label}
            </div>
            {n.note && <div style={{ fontSize: 11, color: C.textFaint, margin: '2px 0 0 12px' }}>{n.note}</div>}
            {d.edges?.filter((e) => e.from === n.id).map((e, j) => (
              <div key={j} style={{ marginLeft: 14, fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>
                ↓ {e.label || ''} → {nodeById[e.to]?.label || e.to}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (format === 'timeline' && Array.isArray(d.events)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {d.events.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.borderSoft}` }}>
            <span style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textFaint, width: 86, flexShrink: 0 }}>{e.when}</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{e.label}</div>
              {e.description && <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>{e.description}</div>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (format === 'mnemonics' && Array.isArray(d.items)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {d.items.map((m, i) => (
          <div key={i} style={{ padding: '8px 10px', borderRadius: 4, background: C.bgSoft, border: `1px solid ${C.borderSoft}` }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 600, color: C.text }}>{m.mnemonic}</div>
            <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 3 }}>{m.meaning}{m.topic ? ` · ${m.topic}` : ''}</div>
          </div>
        ))}
      </div>
    )
  }

  if (format === 'formula_sheet' && Array.isArray(d.groups)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {d.groups.map((g, i) => (
          <div key={i}>
            <div className="metric-label" style={{ marginBottom: 5, padding: 0 }}>{g.topic}</div>
            {(g.formulas || []).map((f, j) => (
              <div key={j} style={{ padding: '6px 10px', borderRadius: 3, background: C.bgSoft, border: `1px solid ${C.borderSoft}`, margin: '3px 0' }}>
                <code style={{ fontFamily: fonts.mono, fontSize: 12.5, color: C.text }}>{f.latex}</code>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                  {f.name}{f.note ? ` — ${f.note}` : ''}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return <MarkdownContent content={JSON.stringify(d, null, 1)} />
}
