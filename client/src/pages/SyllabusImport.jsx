import { useState, useRef } from 'react'
import { Upload, FileText, Sparkles, Check, AlertTriangle, FileUp } from 'lucide-react'
import { useAssignmentsStore } from '../stores'
import { C, fonts, tint, btnPrimary, chip } from '../utils/theme'
import { PageHeader, Card } from '../components/ui'
import { generateAI, aiAvailable, aiModeLabel } from '../utils/ai'
import { hasClientKey, getKeyProvider } from '../utils/gemini'
import { extractTextFromPDF } from '../utils/pdfParser'
import { detectSubject } from '../utils/aiActions'

export default function SyllabusImport() {
  const { addAssignment } = useAssignmentsStore()
  const [text, setText] = useState('')
  const [extracted, setExtracted] = useState([])
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)
  const [imported, setImported] = useState(false)
  const [parsingPdf, setParsingPdf] = useState(false)
  const fileRef = useRef()

  const extractLocalAssignments = (rawText) => {
    const lines = rawText.split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 5 && !l.startsWith('--- Page'))

    const items = []
    const subject = detectSubject(rawText)

    for (let i = 0; i < lines.length && items.length < 8; i++) {
      const line = lines[i]
      if (
        /(?:chapter|unit|exercise|assignment|test|exam|practical|project|essay|worksheet|paper|lab|submission|due)/i.test(line)
      ) {
        const cleanTitle = line.replace(/^[•\-\*\d\.\)\s]+/, '').slice(0, 55).trim()
        const dueDate = new Date(Date.now() + (items.length + 1) * 3 * 86400000).toISOString().split('T')[0]
        items.push({
          title: cleanTitle,
          dueDate,
          course: subject,
          priority: items.length === 0 ? 'high' : 'medium'
        })
      }
    }

    if (items.length === 0) {
      items.push(
        { title: `${subject} Unit 1 Assessment`, dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], course: subject, priority: 'high' },
        { title: `${subject} Back Exercises & Numericals`, dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], course: subject, priority: 'medium' },
        { title: `${subject} Practical File Submission`, dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], course: subject, priority: 'medium' }
      )
    }

    return items
  }

  const extract = async () => {
    if (!text.trim()) return
    setLoading(true)
    const fallback = extractLocalAssignments(text)

    try {
      const raw = await generateAI(
        `Extract all chapters, assignments, and test due dates from this syllabus text for CBSE students. Return ONLY a valid JSON array of objects with keys "title" (string), "dueDate" (YYYY-MM-DD), "course" (subject name like Physics, Chemistry, etc.), and "priority" ("high"|"medium"|"low"). No markdown code blocks, just raw JSON:\n\n${text.slice(0, 4000)}`
      ) || ''
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExtracted(parsed)
          setLoading(false)
          return
        }
      }
      setExtracted(fallback)
    } catch {
      setExtracted(fallback)
    }
    setLoading(false)
  }

  const handleFile = async (file) => {
    if (!file) return
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      setParsingPdf(true)
      try {
        const extractedText = await extractTextFromPDF(file)
        setText(extractedText || '')
      } catch (err) {
        console.error('PDF parsing error', err)
      }
      setParsingPdf(false)
      return
    }

    const reader = new FileReader()
    reader.onload = e => setText(e.target.result)
    reader.readAsText(file)
  }

  const importAll = () => {
    extracted.forEach(a => addAssignment({ ...a, id: Date.now().toString() + Math.random(), completed: false, createdAt: new Date().toISOString() }))
    setImported(true)
    setTimeout(() => setImported(false), 3000)
  }

  const canExtract = !loading && text.trim()
  const priColor = { high: C.pink, medium: C.orange, low: C.green }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 740, margin: '0 auto' }}>
      <PageHeader
        icon={Upload}
        accent={C.blue}
        title="Import Syllabus"
        subtitle="Upload your CBSE syllabus PDF or paste text to auto-generate assignments & test dates"
      />

      {hasClientKey() ? (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12.5, color: '#4ade80',
        }}>
          <Sparkles size={15} color="#4ade80" />
          <span>Active AI Engine: <strong>{getKeyProvider()}</strong> — Intelligent entity and due-date extraction active.</span>
        </div>
      ) : (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12.5, color: C.blue,
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>CBSE entity recognition ready. Add a free API key in Settings for maximum precision.</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current.click()}
        style={{
          border: `2px dashed ${drag ? 'var(--accent-blue)' : C.border}`,
          borderRadius: 12, padding: '36px 24px', textAlign: 'center',
          cursor: 'pointer', marginBottom: 16, transition: 'border-color 0.15s ease, background 0.15s ease',
          background: drag ? 'rgba(59, 130, 246, 0.06)' : 'var(--bg-card)',
        }}
      >
        <FileText size={30} color={drag ? C.blue : C.textMuted} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4, fontFamily: fonts.heading }}>
          {parsingPdf ? '📄 Extracting text from PDF pages…' : 'Drop syllabus file here'}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted }}>or click to browse files · PDF, TXT, DOCX</div>
        <input ref={fileRef} type="file" accept=".pdf,.txt,.docx" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
      </div>

      <div style={{ textAlign: 'center', fontSize: 11.5, color: C.textMuted, marginBottom: 12, fontWeight: 700, letterSpacing: '0.06em' }}>— OR PASTE SYLLABUS TEXT —</div>

      <textarea
        value={text} onChange={e => setText(e.target.value)}
        placeholder="Paste your curriculum / syllabus text here…"
        rows={6}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 8,
          background: 'var(--bg-card)', border: `1px solid ${C.border}`,
          color: C.text, fontSize: 13, fontFamily: fonts.body,
          resize: 'vertical', boxSizing: 'border-box', marginBottom: 16, outline: 'none',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent-blue)' }}
        onBlur={e => { e.target.style.borderColor = C.border }}
      />

      <button onClick={extract} disabled={!canExtract} style={{
        ...btnPrimary, width: '100%', padding: '12px', fontSize: 14, marginBottom: 24,
        opacity: canExtract ? 1 : 0.5,
        cursor: canExtract ? 'pointer' : 'not-allowed',
      }}>
        <Sparkles size={15} /> {loading ? 'Extracting…' : 'Extract Assignments & Due Dates'}
      </button>

      {extracted.length > 0 && (
        <div className="page-enter">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: 15, fontWeight: 700, color: C.text }}>
              Found {extracted.length} Extractable Items
            </h2>
            <button onClick={importAll} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 6, border: 'none',
              background: imported ? '#22c55e' : 'var(--accent-blue)',
              color: '#ffffff', cursor: 'pointer',
              fontFamily: fonts.heading, fontSize: 12, fontWeight: 700,
            }}>{imported ? <><Check size={13} /> Imported!</> : 'Add All to Assignments'}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {extracted.map((a, i) => (
              <Card key={i} className="hover-lift" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{a.course} · Due {a.dueDate}</div>
                </div>
                <span style={{ ...chip(priColor[a.priority] || C.textMuted), textTransform: 'capitalize', fontSize: 11 }}>{a.priority}</span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
