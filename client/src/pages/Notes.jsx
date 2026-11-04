import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Notebook, Plus, MagnifyingGlass, Eye, PencilSimple,
  Trash, Sparkle, MagicWand, SpinnerGap, BookOpenText, MathOperations,
  Cards, Brain
} from '@phosphor-icons/react'
import katex from 'katex'
import { useNotesStore, useUIStore, useFlashcardsStore, useLearnerStore } from '../stores'
import { C, fonts, tint, btnPrimary } from '../utils/theme'
import { callGeminiClient, hasClientKey, generateChapterNotes, NOTE_FORMATS } from '../utils/gemini'
import { getLearnerChapters } from '../utils/cbseSubjects'

const HIGHLIGHTS_KEY = 'studypulse-highlights'
function getSavedHighlights() {
  try {
    const all = JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '{}')
    return Object.values(all).flat()
  } catch { return [] }
}

function renderInlineTokens(text) {
  if (!text) return null
  const regex = /(\$[^$]+\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  const parts = text.split(regex)

  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const math = part.slice(1, -1)
      try {
        const html = katex.renderToString(math, { displayMode: false, throwOnError: false })
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
      } catch {
        return <code key={i} style={{ color: C.amber }}>{part}</code>
      }
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i} style={{ color: C.text, fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} style={{ color: C.text }}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} style={{
        background: 'color-mix(in srgb, var(--md-primary) 12%, transparent)',
        color: C.primary,
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: '0.9em',
        fontFamily: 'monospace',
      }}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

function stripMarkdown(str) {
  if (!str) return ''
  return str
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function renderFormattedNotes(content) {
  if (!content) return null
  const lines = content.split('\n')
  return lines.map((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed) {
      return <div key={idx} style={{ height: 10 }} />
    }

    if (trimmed === '---') {
      return <hr key={idx} style={{ border: 'none', borderTop: `1px solid ${C.borderSoft}`, margin: '14px 0' }} />
    }

    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      const math = trimmed.slice(2, -2).trim()
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false })
        return <div key={idx} style={{ margin: '14px 0', overflowX: 'auto', textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: html }} />
      } catch {
        return <pre key={idx} style={{ color: C.amber }}>{trimmed}</pre>
      }
    }

    if (line.startsWith('### ')) {
      return <h4 key={idx} style={{ fontFamily: fonts.heading, fontSize: 15, fontWeight: 700, color: C.text, margin: '14px 0 6px' }}>{renderInlineTokens(line.slice(4))}</h4>
    }
    if (line.startsWith('## ')) {
      return <h3 key={idx} style={{ fontFamily: fonts.heading, fontSize: 17, fontWeight: 700, color: C.primary, margin: '18px 0 8px', letterSpacing: '-0.01em' }}>{renderInlineTokens(line.slice(3))}</h3>
    }
    if (line.startsWith('# ')) {
      return <h2 key={idx} style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.text, margin: '20px 0 10px', letterSpacing: '-0.01em' }}>{renderInlineTokens(line.slice(2))}</h2>
    }

    if (line.startsWith('> ')) {
      return (
        <blockquote key={idx} style={{
          borderLeft: `3px solid var(--primary)`,
          background: 'color-mix(in srgb, var(--md-primary) 6%, transparent)',
          padding: '8px 14px',
          margin: '8px 0',
          borderRadius: '0 8px 8px 0',
          color: C.textMuted,
          fontSize: 13.5,
        }}>
          {renderInlineTokens(line.slice(2))}
        </blockquote>
      )
    }

    if (line.startsWith('- [x] ') || line.startsWith('- [ ] ')) {
      const checked = line.startsWith('- [x] ')
      return (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0', paddingLeft: 6 }}>
          <input type="checkbox" readOnly checked={checked} style={{ accentColor: 'var(--primary)' }} />
          <span style={{ textDecoration: checked ? 'line-through' : 'none', color: checked ? C.textFaint : C.text }}>
            {renderInlineTokens(line.slice(6))}
          </span>
        </div>
      )
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={idx} style={{ display: 'flex', gap: 8, margin: '4px 0', paddingLeft: 8 }}>
          <span style={{ color: C.primary, fontWeight: 700 }}>•</span>
          <span>{renderInlineTokens(line.slice(2))}</span>
        </div>
      )
    }

    const numMatch = line.match(/^(\d+)\.\s+(.*)$/)
    if (numMatch) {
      return (
        <div key={idx} style={{ display: 'flex', gap: 8, margin: '4px 0', paddingLeft: 8 }}>
          <span style={{ color: C.primary, fontWeight: 700, minWidth: 16 }}>{numMatch[1]}.</span>
          <span>{renderInlineTokens(numMatch[2])}</span>
        </div>
      )
    }

    return (
      <p key={idx} style={{ margin: '4px 0', lineHeight: 1.7 }}>
        {renderInlineTokens(line)}
      </p>
    )
  })
}

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useNotesStore()
  const { addToast } = useUIStore()
  const [selected, setSelected] = useState(() => notes?.[0]?.id || null)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('All')
  const [preview, setPreview] = useState(false)
  const [aiMenu, setAiMenu] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const aiMenuRef = useRef(null)
  const textareaRef = useRef(null)

  const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology']

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = textareaRef.current
    if (!textarea || !active) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = active.content || ''
    const selected = content.substring(start, end)
    const replacement = `${prefix}${selected || 'text'}${suffix}`
    const nextContent = content.substring(0, start) + replacement + content.substring(end)
    updateNote(active.id, { content: nextContent })
    touchSaved()
    setTimeout(() => {
      textarea.focus()
      if (selected) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + 4)
      }
    }, 0)
  }

  const insertLinePrefix = (prefix) => {
    const textarea = textareaRef.current
    if (!textarea || !active) return
    const start = textarea.selectionStart
    const content = active.content || ''
    const lastNewline = content.lastIndexOf('\n', start - 1)
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1
    const nextContent = content.substring(0, lineStart) + prefix + content.substring(lineStart)
    updateNote(active.id, { content: nextContent })
    touchSaved()
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  const handleTextareaKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        insertMarkdown('**', '**')
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        insertMarkdown('*', '*')
      }
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target)) {
        setAiMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!selected && notes && notes.length > 0) {
      setSelected(notes[0].id)
    }
  }, [notes, selected])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (notes || []).filter(n => {
      const matchesQ = (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
      const matchesS = subject === 'All' || (n.subject || '').toLowerCase() === subject.toLowerCase() ||
        (n.title || '').toLowerCase().includes(subject.toLowerCase()) ||
        (n.content || '').toLowerCase().includes(subject.toLowerCase())
      return matchesQ && matchesS
    })
  }, [notes, search, subject])

  const active = selected ? (notes || []).find(n => n.id === selected) : null

  const touchSaved = () => setSavedAt(new Date())

  const handleNew = () => {
    const n = { id: Date.now().toString(), title: 'Untitled Note', content: '', subject: subject === 'All' ? '' : subject, createdAt: new Date().toISOString() }
    addNote(n)
    setSelected(n.id)
    setPreview(false)
    touchSaved()
  }

  // ── Revision notes generator (6 Vedmi formats) ──
  const [genOpen, setGenOpen] = useState(false)
  const [genFormat, setGenFormat] = useState('all_topics')
  const [genChapterId, setGenChapterId] = useState('')
  const [genHandwritten, setGenHandwritten] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [genResult, setGenResult] = useState(null)
  const [genError, setGenError] = useState(null)
  const LEARNER_CHAPTERS = getLearnerChapters()

  const runGenerator = async () => {
    const ch = LEARNER_CHAPTERS.find((c) => c.id === genChapterId)
    if (!ch) { setGenError('Pick a chapter first'); return }
    setGenLoading(true)
    setGenError(null)
    const highlights = getSavedHighlights()
      .filter((h) => h.chapterTitle?.includes(ch.title) || h.subject === ch.subject)
      .map((h) => h.text)
    const pageText = ch.pages.map((p) => `${p.heading}\n${p.blocks.map((b) => b.text || b.description || '').join('\n')}`).join('\n\n')
    const res = await generateChapterNotes({
      chapterTitle: `${ch.classLevel} ${ch.subject} · ${ch.title}`,
      pageText, highlights, format: genFormat,
    })
    if (res.ok) setGenResult(res)
    else setGenError(res.error === 'no_key' ? 'Add an API key in Settings first.' : `Generation failed: ${res.error}`)
    setGenLoading(false)
  }

  const resultToMarkdown = (result) => {
    const d = result?.data
    if (!d) return ''
    if (result.format === 'all_topics' && Array.isArray(d.sections)) {
      return d.sections.map((s) => `## ${s.title}\n${(s.points || []).map((p) => `- ${p}`).join('\n')}${s.examTip ? `\n> Board tip: ${s.examTip}` : ''}`).join('\n\n')
    }
    if (result.format === 'mind_map' && d.root) {
      const line = (n, depth) => `${'  '.repeat(depth)}- ${n.label}\n${(n.children || []).map((c) => line(c, depth + 1)).join('')}`
      return `# ${d.root}\n${(d.children || []).map((c) => line(c, 1)).join('')}`
    }
    if (result.format === 'flow_chart' && Array.isArray(d.nodes)) {
      return d.nodes.map((n) => `- **${n.label}**${n.note ? ` — ${n.note}` : ''}`).join('\n') +
        (d.edges || []).map((e) => `\n- *${e.from} → ${e.to}*${e.label ? ` (${e.label})` : ''}`).join('')
    }
    if (result.format === 'timeline' && Array.isArray(d.events)) {
      return d.events.map((e) => `- **${e.when}** — ${e.label}${e.description ? `: ${e.description}` : ''}`).join('\n')
    }
    if (result.format === 'mnemonics' && Array.isArray(d.items)) {
      return d.items.map((m) => `- **${m.mnemonic}** — ${m.meaning}${m.topic ? ` (${m.topic})` : ''}`).join('\n')
    }
    if (result.format === 'formula_sheet' && Array.isArray(d.groups)) {
      return d.groups.map((g) => `## ${g.topic}\n${(g.formulas || []).map((f) => `- \`${f.latex}\` — ${f.name}${f.note ? ` (${f.note})` : ''}`).join('\n')}`).join('\n\n')
    }
    return JSON.stringify(d, null, 1)
  }

  const exportResultPDF = async () => {
    if (!genResult) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const chapter = LEARNER_CHAPTERS.find((c) => c.id === genChapterId)
      const label = NOTE_FORMATS.find((f) => f.id === genFormat)?.label || 'Notes'
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(`${chapter?.title || 'Revision'} — ${label}`, 40, 50)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const lines = doc.splitTextToSize(resultToMarkdown(genResult).replace(/[#*`>]/g, ''), 515)
      let y = 80
      for (const line of lines) {
        if (y > 780) { doc.addPage(); y = 50 }
        doc.text(line, 40, y)
        y += 14
      }
      doc.save(`${chapter?.title || 'notes'}-${genFormat}.pdf`)
      addToast({ type: 'success', message: 'PDF exported' })
    } catch (e) {
      addToast({ type: 'error', message: 'PDF export failed' })
    }
  }

  const saveResultAsNote = () => {
    if (!genResult) return
    const ch = LEARNER_CHAPTERS.find((c) => c.id === genChapterId)
    const label = NOTE_FORMATS.find((f) => f.id === genFormat)?.label || 'Notes'
    addNote({
      title: `${ch?.title || 'Revision'} — ${label}`,
      content: resultToMarkdown(genResult),
      subject: ch?.subject || '',
      color: '#EDEDED',
    })
    addToast({ type: 'success', message: 'Saved to your notes' })
  }

  const handleQuizMe = () => {
    if (!active) return
    navigate(`/quiz?noteId=${active.id}`)
  }

  const handleMakeCards = () => {
    if (!active) return
    const lines = (active.content || '').split('\n').map(l => l.trim()).filter(Boolean)
    const cards = []

    for (const line of lines) {
      if (line.includes(':')) {
        const [q, ...rest] = line.split(':')
        const ans = rest.join(':').trim()
        if (q.trim() && ans) {
          cards.push({ front: stripMarkdown(q), back: stripMarkdown(ans) })
        }
      } else if (line.includes('—') || line.includes(' - ')) {
        const sep = line.includes('—') ? '—' : ' - '
        const [q, ...rest] = line.split(sep)
        const ans = rest.join(sep).trim()
        if (q.trim() && ans) {
          cards.push({ front: stripMarkdown(q), back: stripMarkdown(ans) })
        }
      }
      if (cards.length >= 8) break
    }

    if (cards.length === 0) {
      const chunks = lines.filter(l => !l.startsWith('#')).slice(0, 5)
      chunks.forEach((chunk, i) => {
        cards.push({
          front: `${active.title} — Key Concept #${i + 1}`,
          back: stripMarkdown(chunk),
        })
      })
    }

    const deckId = addDeck({
      name: `${active.title || 'Note'} Deck`,
      cards: cards.length > 0 ? cards : [{ front: active.title || 'Note', back: stripMarkdown(active.content || '') }],
    })
    addToast({ type: 'success', message: `Created flashcard deck from "${active.title}"!` })
    navigate('/flashcards')
  }

  const handleAI = async (action) => {
    setAiMenu(false)
    if (!active?.content?.trim()) {
      addToast({ type: 'error', message: 'Write some notes first, then enhance with AI.' })
      return
    }
    if (!hasClientKey()) {
      addToast({ type: 'error', message: 'Add an AI API key in Settings to use this feature.' })
      return
    }
    setAiLoading(true)
    try {
      let prompt = ''
      if (action === 'enhance') {
        prompt = `You are a CBSE Class 11 study notes expert. Restructure these rough class notes into clean, exam-ready study material.

Rules:
- Add clear ## headings and ### subheadings
- Bold all **key terms** and **definitions**
- Put formulas in separate lines with clear labels
- Add bullet points for lists
- Add a 3-line "## Quick Summary" at the very top
- Keep all original information, just organize it better
- Use simple language a Class 11 student would understand

Original notes:\n${active.content}`
      } else if (action === 'explain') {
        prompt = `You are a friendly CBSE teacher. Read these student notes and explain every concept mentioned in simple, easy-to-understand language. Use examples, analogies, and real-life connections. Format with clear headings.

Student's notes:\n${active.content}`
      } else if (action === 'formulas') {
        prompt = `Extract ONLY the formulas, theorems, key definitions, and important constants from these notes. Format as a clean reference sheet:

- Use ## headings to group by topic
- Each formula on its own line with a clear label
- Include SI units where applicable
- Add "Where:" explanations for each variable
- If there are no explicit formulas, derive the key formulas related to the topics mentioned

Notes:\n${active.content}`
      }
      const result = await callGeminiClient(prompt, { timeoutMs: 15000 })
      if (result) {
        if (action === 'explain' || action === 'formulas') {
          const separator = action === 'explain' ? '\n\n---\n\n## AI Explanation\n\n' : '\n\n---\n\n## Extracted Formulas & Key Points\n\n'
          updateNote(active.id, { content: active.content + separator + result })
        } else {
          updateNote(active.id, { content: result })
        }
        addToast({ type: 'success', message: action === 'enhance' ? 'Notes updated' : action === 'explain' ? 'Explanation added' : 'Formulas extracted' })
      }
    } catch (e) {
      addToast({ type: 'error', message: 'AI processing failed. Try again.' })
    } finally {
      setAiLoading(false)
    }
  }

  const panel = {
    background: 'var(--bg-card)',
    borderRadius: 16, border: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, display: 'flex', height: 'calc(100vh - 175px)', minHeight: 450 }}>
      {/* Left panel */}
      <div style={{ ...panel, width: 310, flexShrink: 0, marginRight: 16 }}>
        <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: fonts.heading, fontSize: 14.5, fontWeight: 700, color: C.text }}>
              <Notebook size={17} weight="duotone" color={C.primary} /> Study notes
            </h2>
            <button onClick={handleNew} style={{ ...btnPrimary, padding: '5px 12px', fontSize: 11.5 }}>
              <Plus size={13} weight="bold" /> New
            </button>
          </div>
          {/* Revision notes generator */}
          <div style={{
            marginBottom: 10, borderRadius: 4,
            border: `1px solid ${C.borderSoft}`, background: 'var(--surface-low, #101014)',
          }}>
            <button onClick={() => setGenOpen((o) => !o)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 10px', background: 'transparent', border: 'none',
              cursor: 'pointer', color: C.textMuted,
              fontFamily: fonts.body, fontSize: 11.5, fontWeight: 600,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MagicWand size={12} /> Revision generator
              </span>
              <span style={{ fontFamily: fonts.mono, fontSize: 10 }}>{genOpen ? '−' : '+'}</span>
            </button>
            {genOpen && (
              <div style={{ padding: '2px 10px 10px' }}>
                <select value={genChapterId} onChange={(e) => setGenChapterId(e.target.value)} style={{
                  width: '100%', marginBottom: 6, padding: '6px 8px', borderRadius: 4,
                  background: 'var(--surface-card-soft, #18181C)', border: `1px solid ${C.border}`,
                  color: C.text, fontFamily: fonts.body, fontSize: 11.5,
                }}>
                  <option value="">— Pick a chapter —</option>
                  {LEARNER_CHAPTERS.map((c) => (
                    <option key={c.id} value={c.id}>{c.subject} · {c.title}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                  {NOTE_FORMATS.map((f) => (
                    <button key={f.id} onClick={() => setGenFormat(f.id)} style={{
                      padding: '3px 8px', borderRadius: 3,
                      background: genFormat === f.id ? 'var(--surface-card-hover, #18181C)' : 'transparent',
                      border: `1px solid ${genFormat === f.id ? C.borderStrong : C.borderSoft}`,
                      color: genFormat === f.id ? C.text : C.textMuted,
                      cursor: 'pointer', fontFamily: fonts.body, fontSize: 10.5,
                    }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 4, border: `1px solid ${C.borderSoft}` }}>
                    {['Typed', 'Handwritten'].map((m) => {
                      const active = (m === 'Handwritten') === genHandwritten
                      return (
                        <button key={m} onClick={() => setGenHandwritten(m === 'Handwritten')} style={{
                          padding: '3px 9px', borderRadius: 3,
                          background: active ? 'var(--surface-card-hover, #18181C)' : 'transparent',
                          border: 'none', color: active ? C.text : C.textFaint,
                          cursor: 'pointer', fontFamily: fonts.body, fontSize: 10.5,
                        }}>{m}</button>
                      )
                    })}
                  </div>
                  <button onClick={runGenerator} disabled={genLoading || !genChapterId || !hasClientKey()} style={{
                    ...btnPrimary, padding: '4px 10px', fontSize: 11,
                    opacity: genChapterId && hasClientKey() && !genLoading ? 1 : 0.4,
                  }}>
                    {genLoading ? <SpinnerGap size={11} className="spin" /> : <Sparkle size={11} weight="duotone" />}
                    Make notes
                  </button>
                </div>
                {genError && (
                  <p style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.error, margin: '0 0 6px' }}>{genError}</p>
                )}
                {genResult?.ok && (
                  <div
                    className={genHandwritten ? 'paper paper-ruled' : ''}
                    style={{
                      borderRadius: genHandwritten ? 10 : 4,
                      border: genHandwritten ? '1px solid #D8D2C2' : `1px solid ${C.borderSoft}`,
                      background: genHandwritten ? undefined : 'var(--bg-card, #121215)',
                      padding: genHandwritten ? '14px 14px 14px 56px' : 10,
                      maxHeight: 260, overflowY: 'auto',
                      position: 'relative',
                      boxShadow: genHandwritten ? '0 10px 24px rgba(30,25,15,0.35)' : 'none',
                    }}
                  >
                    {genHandwritten && genFormat === 'mind_map' && (
                      <svg width="120" height="34" viewBox="0 0 120 34" style={{ position: 'absolute', top: 6, left: 10, opacity: 0.6 }}>
                        <path d="M4 28 C 20 10, 40 30, 58 14 S 96 4, 116 16" fill="none" stroke="#B45438" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M112 12 L117 17 L111 19" fill="none" stroke="#B45438" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    )}
                    <div style={{
                      fontFamily: genHandwritten ? "'Caveat', 'Segoe Print', cursive" : fonts.body,
                      fontSize: genHandwritten ? 17 : 11.5,
                      color: genHandwritten ? '#2C3A8C' : C.textMuted,
                      lineHeight: genHandwritten ? 1.45 : 1.6,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {resultToMarkdown(genResult).replace(/[#*`>]/g, '').split('\n').map((line, i) => (
                        <span key={i} style={genHandwritten && line.trim().startsWith('-')
                          ? { background: 'linear-gradient(180deg, transparent 52%, rgba(245,197,24,0.45) 52%)', borderRadius: 2, display: 'inline-block', width: '100%' }
                          : undefined}>
                          {line}
                          {'\n'}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      <button onClick={exportResultPDF} style={{
                        ...btnPrimary, padding: '3px 9px', fontSize: 10.5, flex: 1,
                      }}>Export PDF</button>
                      <button onClick={saveResultAsNote} style={{
                        ...btnPrimary, padding: '3px 9px', fontSize: 10.5, flex: 1,
                        background: 'var(--surface-card-hover, #18181C)', color: C.text,
                      }}>Save as note</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Subject filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
            {SUBJECTS.map(s => {
              const selectedTab = subject === s
              return (
                <button key={s} onClick={() => setSubject(s)} style={{
                  padding: '4px 10px', borderRadius: 999, border: `1px solid ${selectedTab ? 'color-mix(in srgb, var(--md-primary) 45%, transparent)' : C.borderSoft}`,
                  background: selectedTab ? 'var(--accent-blue-soft, color-mix(in srgb, var(--md-primary) 12%, transparent))' : 'transparent',
                  color: selectedTab ? C.primary : C.textMuted, cursor: 'pointer',
                  fontFamily: fonts.body, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                }}>{s}</button>
              )
            })}
          </div>
          <div style={{ position: 'relative' }}>
            <MagnifyingGlass size={14} weight="duotone" color={C.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes…"
              style={{
                width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8,
                background: 'var(--surface-low, #0d1712)', border: `1px solid ${C.border}`,
                color: C.text, fontSize: 12.5, fontFamily: fonts.body,
                boxSizing: 'border-box', outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--md-primary) 15%, transparent)' }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>
        <div className="scrollbar-dense" style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
              {search ? 'No matching notes found.' : 'No notes yet. Create your first note!'}
            </div>
          ) : filtered.map(n => (
            <div key={n.id} onClick={() => setSelected(n.id)} style={{
              padding: '12px 14px', cursor: 'pointer',
              borderBottom: `1px solid ${C.borderSoft}`,
              background: selected === n.id ? 'var(--accent-blue-soft, color-mix(in srgb, var(--md-primary) 12%, transparent))' : 'transparent',
              border: selected === n.id ? `1px solid color-mix(in srgb, var(--md-primary) 30%, transparent)` : '1px solid transparent',
              borderRadius: selected === n.id ? 10 : 0,
              transition: 'background 0.12s ease',
            }}
              onMouseEnter={e => { if (selected !== n.id) e.currentTarget.style.background = 'color-mix(in srgb, var(--md-primary) 5%, transparent)' }}
              onMouseLeave={e => { if (selected !== n.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: selected === n.id ? C.primary : C.text, marginBottom: 3 }}>
                {n.title || 'Untitled note'}
              </div>
              <div style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.4 }}>
                {stripMarkdown(n.content || '').slice(0, 50)}{stripMarkdown(n.content || '').length > 50 ? '…' : ''}
              </div>
              <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 4 }}>
                {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor panel */}
      <div style={{ ...panel, flex: 1 }}>
        {!active ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 14,
              background: 'color-mix(in srgb, var(--md-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--md-primary) 25%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary,
            }}>
              <Notebook size={24} weight="duotone" />
            </div>
            <p style={{ color: C.textMuted, fontSize: 13.5 }}>Select a note or create a new one</p>
            <button onClick={handleNew} style={btnPrimary}>
              <Plus size={14} /> New Note
            </button>
          </div>
        ) : (
          <>
            {/* Editor toolbar */}
            <div style={{
              padding: '12px 18px', borderBottom: `1px solid ${C.borderSoft}`,
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg-primary)',
            }}>
              <input
                value={active.title || ''}
                onChange={e => { updateNote(active.id, { title: e.target.value }); touchSaved() }}
                placeholder="Note title…"
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: C.text, fontSize: 16, fontWeight: 700,
                  fontFamily: fonts.heading, letterSpacing: '-0.01em',
                  outline: 'none', minWidth: 0,
                }}
              />
              {/* Live save status */}
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 700, fontFamily: fonts.body, color: C.primary,
                whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)' }} />
                {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saved'}
              </span>
              <button onClick={() => setPreview(p => !p)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 999,
                border: `1px solid ${preview ? 'color-mix(in srgb, var(--md-primary) 40%, transparent)' : C.border}`,
                background: preview ? 'var(--accent-blue-soft, color-mix(in srgb, var(--md-primary) 12%, transparent))' : 'transparent',
                color: preview ? C.primary : C.textMuted,
                cursor: 'pointer', fontSize: 11.5, fontFamily: fonts.body, fontWeight: 700,
              }}>
                {preview ? <><PencilSimple size={12} weight="duotone" /> Edit</> : <><Eye size={12} weight="duotone" /> Preview</>}
              </button>

              {/* Quiz Me Bridge */}
              <button
                onClick={handleQuizMe}
                title="Practice a quiz generated from this note"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.text,
                  cursor: 'pointer', fontSize: 11.5, fontFamily: fonts.body, fontWeight: 600,
                  transition: 'border-color 0.12s ease, background 0.12s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.background = 'var(--accent-blue-soft, color-mix(in srgb, var(--md-primary) 12%, transparent))' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent' }}
              >
                <Brain size={13} weight="duotone" color="var(--accent-blue)" />
                <span>Quiz Me</span>
              </button>

              {/* Make Cards Bridge */}
              <button
                onClick={handleMakeCards}
                title="Create a study flashcard deck from this note"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.text,
                  cursor: 'pointer', fontSize: 11.5, fontFamily: fonts.body, fontWeight: 600,
                  transition: 'border-color 0.12s ease, background 0.12s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.background = 'rgba(192,132,252,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent' }}
              >
                <Cards size={13} weight="duotone" color={C.purple} />
                <span>Make Cards</span>
              </button>

              {/* AI action pill */}
              <div style={{ position: 'relative' }} ref={aiMenuRef}>
                <button
                  onClick={() => setAiMenu(m => !m)}
                  disabled={aiLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 999,
                    border: 'none',
                    background: 'var(--grad-reward)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    color: '#1a1005',
                    cursor: aiLoading ? 'wait' : 'pointer',
                    fontSize: 11.5, fontFamily: fonts.body, fontWeight: 700,
                  }}
                >
                  {aiLoading ? <SpinnerGap size={12} className="spin" weight="bold" /> : <MagicWand size={12} weight="duotone" />} AI actions
                </button>
                {aiMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 6,
                    background: 'var(--bg-card)', border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: 6, zIndex: 50, minWidth: 230,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}>
                    {[
                      { key: 'enhance', icon: Sparkle, label: 'Summarize', desc: 'Clean up & structure', color: C.primary },
                      { key: 'explain', icon: BookOpenText, label: 'Explain concepts', desc: 'Simple breakdowns', color: C.green },
                      { key: 'formulas', icon: MathOperations, label: 'Extract formulas', desc: 'KaTeX-ready reference sheet', color: C.amber },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => handleAI(opt.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '8px 10px', borderRadius: 8,
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: C.text, fontSize: 12.5, textAlign: 'left',
                          transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--md-primary) 8%, transparent)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <opt.icon size={16} weight="duotone" color={opt.color} />
                        <div>
                          <div style={{ fontWeight: 700, fontFamily: fonts.body }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: C.textMuted }}>{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { deleteNote(active.id); setSelected(null) }} aria-label="Delete note" style={{
                padding: '6px 8px', borderRadius: 6, border: `1px solid ${C.border}`,
                background: 'transparent', color: C.textFaint, cursor: 'pointer', display: 'flex',
                transition: 'color 0.15s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                onMouseLeave={e => e.currentTarget.style.color = C.textFaint}
              ><Trash size={14} weight="duotone" /></button>
            </div>

            {!preview && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '6px 14px',
                background: 'var(--surface-low, #0d1712)',
                borderBottom: `1px solid ${C.borderSoft}`,
                flexWrap: 'wrap',
              }}>
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**')}
                  title="Bold (Ctrl+B)"
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.textMuted, cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, fontFamily: fonts.heading,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*')}
                  title="Italic (Ctrl+I)"
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.textMuted, cursor: 'pointer',
                    fontSize: 12, fontFamily: fonts.heading,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  <em>I</em>
                </button>
                <div style={{ width: 1, height: 16, background: C.borderSoft, margin: '0 4px' }} />
                <button
                  type="button"
                  onClick={() => insertLinePrefix('# ')}
                  title="Heading 1"
                  style={{
                    padding: '4px 7px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.textMuted, cursor: 'pointer',
                    fontSize: 11.5, fontWeight: 700, fontFamily: fonts.heading,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix('## ')}
                  title="Heading 2"
                  style={{
                    padding: '4px 7px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.textMuted, cursor: 'pointer',
                    fontSize: 11.5, fontWeight: 700, fontFamily: fonts.heading,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  H2
                </button>
                <div style={{ width: 1, height: 16, background: C.borderSoft, margin: '0 4px' }} />
                <button
                  type="button"
                  onClick={() => insertLinePrefix('- ')}
                  title="Bullet list"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.textMuted, cursor: 'pointer',
                    fontSize: 11.5, fontFamily: fonts.body,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1 }}>•</span>
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix('1. ')}
                  title="Numbered list"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.textMuted, cursor: 'pointer',
                    fontSize: 11.5, fontFamily: fonts.body,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700 }}>1.</span>
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix('- [ ] ')}
                  title="Task checkbox"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.textMuted, cursor: 'pointer',
                    fontSize: 11.5, fontFamily: fonts.body,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  <span>☑</span>
                  <span>Task</span>
                </button>
                <div style={{ width: 1, height: 16, background: C.borderSoft, margin: '0 4px' }} />
                <button
                  type="button"
                  onClick={() => insertMarkdown('$', '$')}
                  title="KaTeX Math Formula ($formula$)"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.amber, cursor: 'pointer',
                    fontSize: 11.5, fontFamily: fonts.body, fontWeight: 600,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.10)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontWeight: 700 }}>√x</span>
                  <span>Math</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('`', '`')}
                  title="Code snippet (`code`)"
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.textMuted, cursor: 'pointer',
                    fontSize: 11.5, fontFamily: 'monospace',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  &lt;/&gt;
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix('> ')}
                  title="Blockquote"
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: '1px solid transparent',
                    background: 'transparent', color: C.textMuted, cursor: 'pointer',
                    fontSize: 11.5, fontFamily: fonts.body,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted }}
                >
                  Quote
                </button>
              </div>
            )}

            {preview ? (
              <div style={{
                flex: 1, padding: '18px 22px', overflowY: 'auto',
                fontSize: 14, lineHeight: 1.65, color: C.text,
                fontFamily: fonts.body, maxWidth: 720,
              }}>
                {active.content ? renderFormattedNotes(active.content) : <span style={{ color: C.textMuted }}>Nothing to preview.</span>}
                <div style={{ marginTop: 24, padding: '10px 14px', borderRadius: 8, background: 'var(--surface-low, #0d1712)', border: `1px solid ${C.borderSoft}`, fontSize: 12, color: C.textMuted }}>
                  KaTeX live preview active — inline math like $E = mc^2$ or block math like $$F = ma$$.
                </div>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={active.content || ''}
                onChange={e => { updateNote(active.id, { content: e.target.value }); touchSaved() }}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Start writing notes… (Markdown supported)"
                style={{
                  flex: 1, padding: '18px 22px',
                  background: 'transparent', border: 'none',
                  color: C.text, fontSize: 14, lineHeight: 1.8,
                  fontFamily: fonts.body,
                  resize: 'none', outline: 'none',
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
