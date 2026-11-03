import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MagnifyingGlass, Notebook, Lightning, Timer, PlusCircle, Sparkle } from '@phosphor-icons/react'
import { useNotesStore } from '../stores'
import { C, fonts } from '../utils/theme'

const PAGES = [
  { label: 'Home', path: '/home', hint: 'Overview' },
  { label: 'Assignments', path: '/assignments', hint: 'Tasks' },
  { label: 'Calendar', path: '/calendar', hint: 'Schedule' },
  { label: 'Grades', path: '/grades', hint: 'GPA & Marks' },
  { label: 'Notes', path: '/notes', hint: 'Notebook' },
  { label: 'Flashcards', path: '/flashcards', hint: 'Decks' },
  { label: 'Quiz', path: '/quiz', hint: 'Practice' },
  { label: 'SQL Pulse', path: '/sql', hint: 'MySQL Missions' },
  { label: 'Library', path: '/library', hint: 'NCERT Reader' },
  { label: 'PYQ Vault', path: '/pyq', hint: 'Board Questions' },
  { label: 'Study Plans', path: '/study-plans', hint: 'Roadmap' },
  { label: 'Focus Mode', path: '/focus', hint: 'Pomodoro' },
  { label: 'Habits', path: '/habits', hint: 'Routines' },
  { label: 'Analytics', path: '/analytics', hint: 'Progress' },
  { label: 'Leaderboard', path: '/leaderboard', hint: 'Rankings' },
  { label: 'Import Syllabus', path: '/import', hint: 'Classroom' },
  { label: 'AI Study Assistant', path: '/assistant', hint: 'AI' },
  { label: 'Settings', path: '/settings', hint: 'Preferences' },
  { label: 'Profile', path: '/profile', hint: 'Account' },
]

const QUICK_ACTIONS = [
  { label: 'Start 25m Focus', path: '/focus', icon: Timer },
  { label: 'New Note', path: '/notes', icon: PlusCircle },
  { label: 'Generate Practice Quiz', path: '/quiz', icon: Sparkle },
]

const CommandPalette = () => {
  const navigate = useNavigate()
  const notes = useNotesStore((s) => s.notes || [])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery('')
        setIndex(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => { setOpen(true); setQuery(''); setIndex(0) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
  }, [open ])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pageHits = PAGES.filter((p) => !q || p.label.toLowerCase().includes(q)).map((p) => ({
      type: 'page', label: p.label, path: p.path, hint: p.hint,
    }))
    const noteHits = (!q ? notes.slice(0, 3) : notes.filter((n) =>
      (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
    ).slice(0, 5)).map((n) => ({
      type: 'note', label: n.title || 'Untitled note', path: '/notes', hint: n.subject || 'Note',
    }))
    const actionHits = QUICK_ACTIONS.filter((a) => !q || a.label.toLowerCase().includes(q)).map((a) => ({
      type: 'action', label: a.label, path: a.path, hint: 'Action', icon: a.icon,
    }))
    return [...actionHits, ...pageHits, ...noteHits].slice(0, 12)
  }, [query, notes])

  useEffect(() => setIndex(0), [query])

  const go = (r) => {
    if (!r) return
    setOpen(false)
    navigate(r.path)
  }

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') go(results[index])
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(4,10,8,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', paddingTop: '12vh', paddingInline: 16,
          }}
        >
          <motion.div
            initial={{ y: 12, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(560px, 100%)', height: 'fit-content', maxHeight: '60vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              background: 'var(--bg-card, #101c17)',
              border: '1px solid var(--border-color, rgba(52,211,153,0.14))',
              borderRadius: 16,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${C.borderSoft}` }}>
              <MagnifyingGlass size={16} color={C.textFaint} weight="duotone" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search pages, notes, actions…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: C.text, fontSize: 14, fontFamily: fonts.body,
                }}
              />
              <kbd style={{
                fontFamily: fonts.body, fontSize: 10, fontWeight: 700,
                padding: '2px 6px', borderRadius: 4,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderSoft}`,
                color: C.textMuted,
              }}>esc</kbd>
            </div>
            <div style={{ overflowY: 'auto', padding: 8 }}>
              {results.length === 0 && (
                <div style={{ padding: '20px 14px', color: C.textFaint, fontSize: 13, fontFamily: fonts.body }}>
                  No matches. Try a page name or note title.
                </div>
              )}
              {results.map((r, i) => {
                const Icon = r.type === 'note' ? Notebook : r.type === 'action' ? (r.icon || Lightning) : MagnifyingGlass
                const selected = i === index
                return (
                  <button
                    key={`${r.type}-${r.label}-${i}`}
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => go(r)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: selected ? 'var(--accent-blue-soft, rgba(16,185,129,0.12))' : 'transparent',
                      color: C.text, textAlign: 'left',
                    }}
                  >
                    <Icon size={16} weight="duotone" color={selected ? C.primary : C.textFaint} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: selected ? 700 : 500, fontFamily: fonts.body }}>{r.label}</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, fontFamily: fonts.body,
                      color: C.textFaint, background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${C.borderSoft}`, borderRadius: 4, padding: '1px 6px',
                    }}>{r.hint || r.type}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette
