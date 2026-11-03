import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkle, CircleNotch, BookOpen } from '@phosphor-icons/react'
import { C, fonts, inputStyle, btnPrimary } from '../utils/theme'
import { PageHeader } from '../components/ui'
import { PYQ_BANK, PYQ_YEARS, PYQ_MARKS } from '../data/pyqBank'
import { solveBoardPYQ, hasClientKey } from '../utils/gemini'
import { useLearnerStore } from '../stores'
import MarkdownContent from '../components/MarkdownContent'

export default function PYQ() {
  const navigate = useNavigate()
  const learner = useLearnerStore()

  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('all')
  const [year, setYear] = useState('all')
  const [marks, setMarks] = useState('all')
  const [chapterId, setChapterId] = useState('all')
  const [open, setOpen] = useState(null) // pyq id being walked through
  const [answers, setAnswers] = useState({}) // pyqId -> { loading, ok, ...res }

  const subjects = useMemo(() => [...new Set(PYQ_BANK.map((p) => p.subject))].sort(), [])
  const chapters = useMemo(() => {
    const list = PYQ_BANK.filter((p) => subject === 'all' || p.subject === subject)
    return [...new Map(list.map((p) => [p.chapterId, p])).values()]
  }, [subject])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return PYQ_BANK.filter((p) => {
      if (subject !== 'all' && p.subject !== subject) return false
      if (year !== 'all' && p.year !== Number(year)) return false
      if (marks !== 'all' && p.marks !== Number(marks)) return false
      if (chapterId !== 'all' && p.chapterId !== chapterId) return false
      if (q && !p.question.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, subject, year, marks, chapterId])

  // Group by chapter for display
  const grouped = useMemo(() => {
    const g = new Map()
    for (const p of filtered) {
      if (!g.has(p.chapterId)) g.set(p.chapterId, { title: p.chapterTitle, subject: p.subject, items: [] })
      g.get(p.chapterId).items.push(p)
    }
    return [...g.values()]
  }, [filtered])

  const ask = async (pyq) => {
    setOpen(pyq.id)
    setAnswers((a) => ({ ...a, [pyq.id]: { loading: true } }))
    const chapterState = learner.getChapterState(pyq.subject, pyq.chapterId)
    const res = await solveBoardPYQ({
      pyqQuestion: pyq.question,
      marks: pyq.marks,
      year: pyq.year,
      subject: pyq.subject,
      chapterTitle: pyq.chapterTitle,
      studentDraft: chapterState ? '' : '',
    })
    setAnswers((a) => ({ ...a, [pyq.id]: { loading: false, ...res } }))
  }

  const selectStyle = { ...inputStyle, minWidth: 150, cursor: 'pointer' }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 900, margin: '0 auto' }}>
      <PageHeader
        title="Board PYQ Vault"
        subtitle="Official CBSE board questions 2022–2026 with step-wise marking-scheme walkthroughs"
        status={hasClientKey() ? { kind: 'success', label: 'examiner on' } : { kind: 'warning', label: 'needs API key' }}
      />

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        padding: '12px 14px', marginBottom: 18,
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
      }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words from a question…"
          style={{ ...inputStyle, flex: '1 1 220px' }}
        />
        <select value={subject} onChange={(e) => { setSubject(e.target.value); setChapterId('all') }} style={selectStyle}>
          <option value="all">All subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
          <option value="all">All years</option>
          {PYQ_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={marks} onChange={(e) => setMarks(e.target.value)} style={selectStyle}>
          <option value="all">All marks</option>
          {PYQ_MARKS.map((m) => <option key={m} value={m}>{m} mark{m > 1 ? 's' : ''}</option>)}
        </select>
        <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} style={selectStyle}>
          <option value="all">All chapters</option>
          {chapters.map((c) => <option key={c.chapterId} value={c.chapterId}>{c.title}</option>)}
        </select>
        <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint, fontVariantNumeric: 'tabular-nums' }}>
          {filtered.length} question{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Grouped results */}
      {grouped.map((g) => (
        <div key={g.title} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 14px', marginBottom: 8,
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
          }}>
            <div>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{g.title}</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 10, color: C.textFaint, marginLeft: 10 }}>
                {g.subject} · {g.items.length} question{g.items.length > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => navigate(`/read/${g.items[0].chapterId}`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 3,
                background: 'transparent', border: `1px solid ${C.borderSoft}`,
                color: C.textMuted, cursor: 'pointer',
                fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.06em',
              }}
            >
              <BookOpen size={11} /> OPEN IN CHAPTER
            </button>
          </div>

          {g.items.map((p) => {
            const isOpen = open === p.id
            const res = answers[p.id]
            return (
              <div key={p.id} style={{
                marginBottom: 8, padding: '12px 14px',
                background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: fonts.mono, fontSize: 9.5, color: C.textMuted,
                    border: `1px solid ${C.border}`, borderRadius: 3, padding: '1px 6px',
                  }}>{p.year}</span>
                  <span style={{
                    fontFamily: fonts.mono, fontSize: 9.5, color: p.marks >= 3 ? C.warning : C.textMuted,
                    border: `1px solid ${C.border}`, borderRadius: 3, padding: '1px 6px',
                  }}>{p.marks} mark{p.marks > 1 ? 's' : ''}</span>
                  <span style={{
                    fontFamily: fonts.mono, fontSize: 9.5, color: C.textMuted,
                    border: `1px solid ${C.border}`, borderRadius: 3, padding: '1px 6px',
                  }}>{p.type}</span>
                  <span style={{ fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint }}>paper {p.setCode}</span>
                </div>

                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
                  {p.question}
                </p>

                {p.options && (
                  <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 8 }}>
                    {p.options.map((o, i) => <div key={i}>({String.fromCharCode(65 + i)}) {o}</div>)}
                  </div>
                )}

                <button onClick={() => ask(p)} disabled={res?.loading} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 3,
                  background: C.cardHover, border: `1px solid ${C.border}`,
                  color: C.text, cursor: 'pointer',
                  fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
                }}>
                  {res?.loading ? <CircleNotch size={12} className="spin" /> : <Sparkle size={12} weight="duotone" />}
                  Ask StudyPulse
                </button>

                {/* Step-wise marking scheme */}
                {isOpen && res && (
                  <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: `2px solid ${C.borderStrong}` }}>
                    {res.loading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CircleNotch size={13} className="spin" style={{ color: C.textFaint }} />
                        <span className="metric-label" style={{ padding: 0 }}>Retrieving the official marking scheme…</span>
                      </div>
                    )}
                    {!res.loading && res.ok && (
                      <>
                        {res.gradingOfDraft && (
                          <p style={{ fontSize: 12.5, color: C.textMuted, margin: '0 0 10px', lineHeight: 1.55 }}>{res.gradingOfDraft}</p>
                        )}
                        <span className="metric-label" style={{ display: 'block', marginBottom: 6, padding: 0 }}>
                          Value points — how the {res.totalMarks} marks are split
                        </span>
                        {res.valuePoints.map((v, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, margin: '5px 0' }}>
                            <span style={{
                              fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 600, color: C.success,
                              flexShrink: 0, width: 34, textAlign: 'right',
                            }}>{v.marks}M</span>
                            <span style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>
                              <strong style={{ fontWeight: 600 }}>{v.step}</strong>
                              {v.detail ? <span style={{ color: C.textMuted }}> — {v.detail}</span> : null}
                            </span>
                          </div>
                        ))}
                        {res.modelAnswer && (
                          <div style={{ marginTop: 14 }}>
                            <span className="metric-label" style={{ display: 'block', marginBottom: 6, padding: 0 }}>Full-marks model answer</span>
                            <div style={{
                              padding: '12px 14px', background: C.bgSoft,
                              border: `1px solid ${C.borderSoft}`, borderRadius: 4,
                            }}>
                              <MarkdownContent content={res.modelAnswer} />
                            </div>
                          </div>
                        )}
                        {res.examinerTip && (
                          <p style={{
                            marginTop: 12, fontSize: 11.5, color: C.warning, lineHeight: 1.55, fontFamily: fonts.mono,
                          }}>
                            BOARD TRAP · {res.examinerTip}
                          </p>
                        )}
                      </>
                    )}
                    {!res.loading && !res.ok && (
                      <p style={{ fontFamily: fonts.mono, fontSize: 11.5, color: C.error }}>
                        {res.error === 'no_key'
                          ? 'Add an API key in Settings → AI Engine to unlock walkthroughs.'
                          : `Walkthrough failed: ${res.error}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.textFaint }}>
          <p style={{ fontFamily: fonts.mono, fontSize: 12 }}>No questions match these filters.</p>
          <button
            onClick={() => { setSearch(''); setSubject('all'); setYear('all'); setMarks('all'); setChapterId('all') }}
            style={{ ...btnPrimary, marginTop: 14 }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
