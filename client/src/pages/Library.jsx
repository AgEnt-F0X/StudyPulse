import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleNotch, UploadSimple, ArrowClockwise, CaretRight } from '@phosphor-icons/react'
import { C, fonts, btnPrimary, btnGhost } from '../utils/theme'
import { PageHeader } from '../components/ui'
import Book3D, { SUBJECT_ART } from '../components/Book3D'
import { listLibrary, addCustomBook } from '../data/ncertLibrary'
import { extractTextFromPDF } from '../utils/pdfParser'
import { useUIStore, useLearnerStore } from '../stores'

const READING_KEY = 'studypulse-reading-progress'

function getReadingProgress() {
  try { return JSON.parse(localStorage.getItem(READING_KEY) || '{}') } catch { return {} }
}

export function saveReadingProgress(chapterId, page) {
  try {
    const p = getReadingProgress()
    p[chapterId] = { page, ts: Date.now() }
    localStorage.setItem(READING_KEY, JSON.stringify(p))
  } catch {}
}

export function getLastRead() {
  const p = getReadingProgress()
  let best = null
  for (const [chapterId, v] of Object.entries(p)) {
    if (!best || v.ts > best.ts) best = { chapterId, page: v.page, ts: v.ts }
  }
  return best
}

// ── 3D spine for the shelf stage ──────────────────────────────

function Spine3D({ book, active, onClick }) {
  const art = SUBJECT_ART[book.artKey] || SUBJECT_ART.science
  const [hover, setHover] = useState(false)
  const w = 26, h = 148, t = 34
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        perspective: 900, width: w + t, height: h + 10,
        cursor: 'pointer', flexShrink: 0, position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute', left: t / 2, top: 5,
        width: w, height: h,
        transformStyle: 'preserve-3d',
        transform: `rotateY(${hover ? -14 : 0}deg) translateZ(${hover ? 26 : 0}px) translateX(${hover ? 8 : 0}px)`,
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Spine front (the visible narrow face) */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '3px 2px 2px 3px',
          background: `linear-gradient(90deg, ${art.dark}, ${art.base} 60%, ${art.dark})`,
          boxShadow: `inset 0 0 6px rgba(0,0,0,0.45), 0 14px 24px rgba(30,25,15,0.35)`,
          border: active ? '1px solid color-mix(in srgb, var(--md-primary) 55%, transparent)' : '1px solid rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 0',
          overflow: 'hidden',
        }}>
          <div style={{
            writingMode: 'vertical-rl',
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 11.5, color: art.ink, letterSpacing: '0.05em',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: h - 42,
          }}>
            {book.subject}
          </div>
          <div style={{
            writingMode: 'vertical-rl',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 6.5, letterSpacing: '0.2em', color: `${art.ink}99`,
          }}>
            {book.classLevel}
          </div>
        </div>
        {/* Page edge (right of spine) */}
        <div style={{
          position: 'absolute', top: 3, bottom: 3, right: -w + 8, width: t - 8,
          transform: 'rotateY(90deg)',
          transformOrigin: 'left center',
          background: 'repeating-linear-gradient(90deg, #EFE6D4 0 2px, #D9CDB4 2px 3px)',
        }} />
      </div>
    </div>
  )
}

// ── Left-rail tick mark scroll indicator ──────────────────────

function TickRail({ index, total, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: 'center', paddingTop: 8, flexShrink: 0,
    }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          width: i === index ? 18 : 10, height: 2, borderRadius: 1,
          background: i === index ? color : 'rgba(255,255,255,0.25)',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function Library() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const learner = useLearnerStore()
  const [tick, setTick] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [classFilter, setClassFilter] = useState(() => localStorage.getItem('studypulse-class') || 'All')
  const [activeSubject, setActiveSubject] = useState(null)
  const fileRef = useRef(null)

  // Sync with the dock's Class selector
  useEffect(() => {
    const onClass = (e) => setClassFilter(e.detail || 'All')
    window.addEventListener('studypulse-class-change', onClass)
    return () => window.removeEventListener('studypulse-class-change', onClass)
  }, [])

  const books = useMemo(() => {
    void tick
    return listLibrary()
  }, [tick])

  const lastRead = useMemo(() => {
    const lr = getLastRead()
    if (!lr) return null
    const chapter = books.find((c) => c.id === lr.chapterId)
    return chapter ? { ...lr, chapter } : null
  }, [tick, books])

  // Group into subject bands with an art key
  const bands = useMemo(() => {
    void classFilter
    const ART_KEYS = {
      Physics: 'physics', Chemistry: 'chemistry', Mathematics: 'maths',
      'Computer Science': 'cs', Science: 'science', English: 'english',
    }
    const map = new Map()
    for (const b of books) {
      if (classFilter !== 'All' && b.classLevel !== classFilter) continue
      if (b.custom) continue
      const key = b.subject
      if (!map.has(key)) {
        map.set(key, {
          subject: key,
          artKey: ART_KEYS[key] || 'custom',
          chapters: [],
        })
      }
      map.get(key).chapters.push(b)
    }
    const out = [...map.values()]
    const custom = books.filter((b) => b.custom)
    if (custom.length) {
      out.push({ subject: 'My PDFs', artKey: 'custom', chapters: custom })
    }
    // Order: shelf = alphabetical-ish with CS last for editorial rhythm
    const order = { Science: 0, Mathematics: 1, Physics: 2, Chemistry: 3, English: 4, 'Computer Science': 5, 'My PDFs': 6 }
    out.sort((a, b) => (order[a.subject] ?? 9) - (order[b.subject] ?? 9))
    return out
  }, [books, classFilter, tick])

  const weakCount = (chapter) => {
    const st = learner.getChapterState(chapter.subject, chapter.id)
    if (!st) return 0
    return Object.values(st.concepts).filter((c) => c.status === 'needs_attention' || c.luckyGuess).length
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      addToast({ type: 'error', message: 'Upload a .pdf chapter file' })
      return
    }
    setUploading(true)
    try {
      const text = await extractTextFromPDF(file)
      const pageChunks = String(text).split(/---\s*Page\s*\d+\s*---/)
      const pages = pageChunks
        .map((chunk, i) => ({
          pageNumber: i + 1,
          heading: i === 0 ? (file.name.replace(/\.pdf$/i, '') || 'Page 1') : `Page ${i + 1}`,
          blocks: [{ type: 'text', text: chunk.trim() }].filter((b) => b.text.length > 0),
        }))
        .filter((p) => p.blocks.length > 0)
      if (pages.length === 0) throw new Error('No readable text found in this PDF')
      const mod = await import('../data/ncertLibrary')
      const book = mod.addCustomBook({
        title: file.name.replace(/\.pdf$/i, ''),
        subject: 'Custom PDF',
        classLevel: 'My PDFs',
        pages,
      })
      addToast({ type: 'success', message: `"${book.title}" shelved — ${pages.length} page(s)` })
      setTick((t) => t + 1)
    } catch (err) {
      addToast({ type: 'error', message: err?.message || 'PDF parsing failed' })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const bandRefs = useRef([])
  const scrollToBand = (i) => {
    bandRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text }}>
      <PageHeader
        title="The Library"
        subtitle="Every NCERT chapter as a physical book — pick a spine, open a cover"
        status={{ kind: 'success', label: `${books.length} volumes` }}
        actions={
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...btnPrimary, opacity: uploading ? 0.6 : 1 }}>
            {uploading ? <CircleNotch size={14} className="spin" /> : <UploadSimple size={14} weight="bold" />}
            {uploading ? 'Parsing…' : 'Shelve a PDF'}
          </button>
        }
      />
      <input
        ref={fileRef} type="file" accept="application/pdf,.pdf"
        onChange={handleUpload} style={{ display: 'none' }}
      />

      {/* Resume banner */}
      {lastRead && (
        <button
          onClick={() => navigate(`/read/${lastRead.chapter.id}?page=${lastRead.page}`)}
          className="hover-lift"
          style={{
            width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
            background: 'rgba(20,32,27,0.6)', border: `1px solid ${C.border}`, color: C.text,
            marginBottom: 20,
          }}
        >
          <span className="dot dot-success" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="metric-label" style={{ padding: 0 }}>Continue reading</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>
              {lastRead.chapter.title}
              <span style={{ fontFamily: fonts.mono, fontSize: 10.5, color: C.textFaint, marginLeft: 8 }}>
                {lastRead.chapter.subject} · page {lastRead.page}
              </span>
            </div>
          </div>
          <ArrowClockwise size={14} style={{ color: C.textMuted, flexShrink: 0 }} />
        </button>
      )}

      {/* ── Top Shelf Stage: 3D spines on an architectural pedestal ── */}
      <div style={{
        position: 'relative',
        borderRadius: 20,
        background: 'linear-gradient(180deg, rgba(16,26,21,0.85), rgba(12,20,16,0.95))',
        border: `1px solid ${C.border}`,
        padding: '26px 22px 0',
        marginBottom: 24,
        boxShadow: '0 20px 50px rgba(30,25,15,0.35), inset 0 1px 0 rgba(244,240,234,0.06)',
        overflow: 'hidden',
      }}>
        <div className="metric-label" style={{ padding: 0, marginBottom: 14 }}>
          The shelf — {classFilter === 'All' ? 'full collection' : classFilter} · hover a spine to pull it out
        </div>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 4,
          overflowX: 'auto', paddingBottom: 0, scrollbarWidth: 'none',
        }}>
          {bands.map((b, i) => (
            <Spine3D
              key={b.subject}
              book={{ subject: b.subject, classLevel: b.chapters[0]?.classLevel || '', artKey: b.artKey }}
              active={activeSubject === b.subject}
              onClick={() => { setActiveSubject(b.subject); scrollToBand(i) }}
            />
          ))}
          {/* Shelf pedestal */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 12,
            background: 'linear-gradient(180deg, #3A3226, #262016)',
            borderTop: '1px solid rgba(212,195,163,0.35)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          }} />
        </div>
        <div style={{ height: 14 }} />
      </div>

      {/* ── Full-bleed editorial subject bands ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {bands.map((band, bi) => {
          const art = SUBJECT_ART[band.artKey] || SUBJECT_ART.custom
          const bandStyle = {
            physics: { bg: 'linear-gradient(140deg, #C77B2B, #8A5215)', tick: '#E8A85C' },
            chemistry: { bg: 'linear-gradient(140deg, #0F7A5C, #084C38)', tick: '#2FB489' },
            maths: { bg: 'linear-gradient(140deg, #B45438, #7A3421)', tick: '#D97E5F' },
            cs: { bg: 'linear-gradient(140deg, #1C2622, #101814)', tick: 'var(--md-primary)' },
            science: { bg: 'linear-gradient(140deg, #157F5B, #0B4E36)', tick: '#3AAE85' },
            english: { bg: 'linear-gradient(140deg, #9C5F5F, #6B3B3B)', tick: '#C08383' },
            custom: { bg: 'linear-gradient(140deg, #6E6455, #453E32)', tick: '#978B77' },
          }[band.artKey] || { bg: 'linear-gradient(140deg, #3A3226, #262016)', tick: '#D4C3A3' }

          return (
            <section
              key={band.subject}
              ref={(el) => { bandRefs.current[bi] = el }}
              style={{
                position: 'relative',
                borderRadius: 20,
                background: bandStyle.bg,
                border: '1px solid rgba(212,195,163,0.2)',
                boxShadow: '0 24px 60px rgba(30,25,15,0.4)',
                padding: '26px 28px',
                display: 'flex', gap: 24, flexWrap: 'wrap',
                color: art.ink,
                overflow: 'hidden',
              }}
            >
              {/* Left rail tick marks */}
              <div style={{ position: 'absolute', left: 10, top: 24, bottom: 24, display: 'flex', alignItems: 'flex-start' }}>
                <TickRail index={bi % 5} total={5} color={bandStyle.tick} />
              </div>

              {/* Interactive Book3D */}
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20 }}>
                <Book3D
                  title={`${band.subject}`}
                  subject={band.subject}
                  subjectKey={band.artKey}
                  classLevel={band.chapters[0]?.classLevel || 'CBSE'}
                  size="lg"
                  flat={false}
                  onOpen={() => navigate(`/read/${band.chapters[0].id}`)}
                />
              </div>

              {/* Chapter list */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 26, lineHeight: 1.1, marginBottom: 2,
                  textShadow: '0 1px 0 rgba(0,0,0,0.25)',
                }}>
                  {band.subject}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: `${art.ink}B0`, marginBottom: 14,
                }}>
                  {band.chapters.length} chapter{band.chapters.length > 1 ? 's' : ''} · NCERT · CBSE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {band.chapters.map((ch) => {
                    const weak = weakCount(ch)
                    return (
                      <button
                        key={ch.id}
                        onClick={() => navigate(`/read/${ch.id}`)}
                        className="hover-row"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 10, textAlign: 'left',
                          background: 'rgba(0,0,0,0.18)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer', width: '100%',
                        }}
                      >
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10, fontWeight: 600,
                          color: `${art.ink}B0`,
                          width: 26, flexShrink: 0,
                        }}>
                          {ch.number ? `CH ${ch.number}` : 'PDF'}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{
                            display: 'block', fontSize: 13.5, fontWeight: 600, color: art.ink,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {ch.title}
                          </span>
                          <span style={{ display: 'block', fontFamily: fonts.mono, fontSize: 9.5, color: `${art.ink}90`, marginTop: 1 }}>
                            {ch.pages?.length || 0} pages · {ch.concepts?.length || 0} concepts
                          </span>
                        </span>
                        {weak > 0 && (
                          <span className="badge3d needs_attention" style={{ fontSize: 10, padding: '3px 9px' }}>
                            {weak} to revisit
                          </span>
                        )}
                        <CaretRight size={13} style={{ color: `${art.ink}90`, flexShrink: 0 }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
