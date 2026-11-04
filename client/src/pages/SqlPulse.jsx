import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowCounterClockwise, Sparkle, CaretDown, CaretRight, CircleNotch, CheckCircle, Warning, Lock } from '@phosphor-icons/react'
import { PageHeader } from '../components/ui'
import SqlResultTable from '../components/SqlResultTable'
import { C, fonts } from '../utils/theme'
import { useUIStore } from '../stores'
import {
  initEngine, resetToSeed, runQuery, computeExpected, inspectTable,
  getTableRows, execOnDb, getActiveDatabase,
} from '../lib/sqlEngine'
import SqlStage3D from '../components/SqlStage3D'
import { gradeSubmission } from '../lib/sqlGrader'
import { MISSIONS, WORLDS, getMission, getWorldMissions } from '../data/sqlMissions'
import { getBundle } from '../data/sqlDatasets'
import { useSqlPulseStore, worldMastery, campaignProgress } from '../stores/sqlPulse'
import { CONFIDENCE_LEVELS } from '../utils/learnerEngine'

// ── SQL editor ────────────────────────────────────────────────

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'ALTER', 'ADD', 'MODIFY', 'DROP', 'COLUMN', 'PRIMARY', 'KEY', 'FOREIGN',
  'REFERENCES', 'NOT', 'NULL', 'UNIQUE', 'DEFAULT', 'DISTINCT', 'AS', 'AND',
  'OR', 'IN', 'BETWEEN', 'LIKE', 'IS', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
  'OUTER', 'CROSS', 'NATURAL', 'ON', 'SHOW', 'TABLES', 'USE', 'LIMIT',
  'OFFSET', 'CHECK', 'EXISTS',
])
const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'ROUND', 'TRUNCATE', 'POW', 'POWER',
  'MOD', 'UCASE', 'LCASE', 'UPPER', 'LOWER', 'MID', 'SUBSTR', 'SUBSTRING',
  'INSTR', 'LENGTH', 'LTRIM', 'RTRIM', 'TRIM', 'YEAR', 'MONTH', 'DAY',
  'MONTHNAME', 'DAYNAME', 'NOW', 'CURDATE', 'SYSDATE', 'CONCAT', 'IFNULL',
  'COALESCE',
])

function tokenizeSql(text) {
  const tokens = []
  const re = /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([^\sA-Za-z0-9_']+)|(\s+)/g
  let last = 0
  let m
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ text: text.slice(last, m.index), kind: 'plain' })
    const [full, comment, str, num, word, op, ws] = m
    if (comment) tokens.push({ text: full, kind: 'comment' })
    else if (str) tokens.push({ text: full, kind: 'string' })
    else if (num) tokens.push({ text: full, kind: 'number' })
    else if (word) {
      const U = word.toUpperCase()
      if (SQL_KEYWORDS.has(U)) tokens.push({ text: full, kind: 'keyword' })
      else if (SQL_FUNCTIONS.has(U)) tokens.push({ text: full, kind: 'function' })
      else tokens.push({ text: full, kind: 'plain' })
    } else if (op) tokens.push({ text: full, kind: 'plain' })
    else if (ws) tokens.push({ text: full, kind: 'plain' })
    last = m.index + full.length
    k++
    if (k > 20000) break
  }
  if (last < text.length) tokens.push({ text: text.slice(last), kind: 'plain' })
  return tokens
}

const TOKEN_STYLE = {
  comment: { color: C.textFaint, fontStyle: 'italic' },
  string: { color: 'var(--md-primary)' },
  number: { color: '#F59E0B' },
  keyword: { color: C.text, fontWeight: 500 },
  function: { color: '#A1A1AA' },
  plain: { color: C.text },
}

function SqlEditor({ value, onChange, onExecute }) {
  const taRef = useRef(null)
  const preRef = useRef(null)
  const gutRef = useRef(null)

  const tokens = useMemo(() => tokenizeSql(value), [value])
  const lineCount = useMemo(() => value.split('\n').length, [value])

  const syncScroll = useCallback(() => {
    const ta = taRef.current
    if (!ta) return
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop
      preRef.current.scrollLeft = ta.scrollLeft
    }
    if (gutRef.current) gutRef.current.scrollTop = ta.scrollTop
  }, [])

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onExecute()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = taRef.current
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = value.slice(0, start) + '  ' + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  const shared = {
    margin: 0,
    padding: '10px 12px',
    fontFamily: fonts.mono,
    fontSize: 12.5,
    lineHeight: 1.65,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'pre',
    wordWrap: 'off',
    tabSize: 2,
  }

  return (
    <div style={{
      display: 'flex', height: 190, background: '#101014', overflow: 'hidden',
      borderRadius: 12, border: '1px solid color-mix(in srgb, var(--md-primary) 28%, transparent)',
      boxShadow: '0 0 0 1px color-mix(in srgb, var(--md-primary) 12%, transparent), 0 0 32px color-mix(in srgb, var(--md-primary) 18%, transparent), inset 0 1px 0 color-mix(in srgb, var(--md-primary) 8%, transparent)',
    }}>
      {/* Line-number gutter */}
      <div
        ref={gutRef}
        style={{
          width: 40, flexShrink: 0, overflow: 'hidden',
          padding: '10px 6px 10px 0', textAlign: 'right',
          borderRight: '1px solid color-mix(in srgb, var(--md-primary) 18%, transparent)',
          background: 'rgba(8, 16, 12, 0.9)',
          fontFamily: fonts.mono, fontSize: 11, lineHeight: 1.65,
          color: 'color-mix(in srgb, var(--md-primary) 45%, transparent)', fontVariantNumeric: 'tabular-nums',
          userSelect: 'none',
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      {/* Overlay + textarea */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <pre ref={preRef} aria-hidden="true" style={{
          ...shared,
          position: 'absolute', inset: 0,
          overflow: 'hidden', pointerEvents: 'none', color: C.text,
        }}>
          {tokens.map((t, i) => (
            <span key={i} style={TOKEN_STYLE[t.kind] || TOKEN_STYLE.plain}>{t.text}</span>
          ))}
          {'\n'}
        </pre>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="SQL editor"
          style={{
            ...shared,
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            background: 'transparent', border: 'none', outline: 'none',
            color: 'transparent', caretColor: C.text,
            overflow: 'auto', resize: 'none', display: 'block', boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}

// ── Shared bits ───────────────────────────────────────────────

const Mono = ({ children, color = C.textMuted, size = 10.5, style }) => (
  <span style={{
    fontFamily: fonts.mono, fontSize: size, color,
    fontVariantNumeric: 'tabular-nums', ...style,
  }}>
    {children}
  </span>
)

function PaneCard({ title, right, children, style }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
      ...style,
    }}>
      {(title || right) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderBottom: `1px solid ${C.borderSoft}`,
        }}>
          <span className="metric-label">{title}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

function SchemaTable({ info, expanded, onToggle }) {
  const Icon = expanded ? CaretDown : CaretRight
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const cardRef = useRef(null)
  const pkFields = info.fields.filter((f) => f.key === 'PRI')

  const onMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setTilt({
      ry: ((e.clientX - rect.left) / rect.width - 0.5) * 10,
      rx: -((e.clientY - rect.top) / rect.height - 0.5) * 8,
    })
  }

  return (
    <div style={{ perspective: 800, marginBottom: 8 }}>
      <div
        ref={cardRef}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.12s ease-out',
          borderRadius: 12,
          background: 'linear-gradient(155deg, rgba(30,53,43,0.65), rgba(14,24,19,0.85))',
          border: `1px solid ${C.border}`,
          boxShadow: '0 12px 28px rgba(30,25,15,0.3), inset 0 1px 0 rgba(244,240,234,0.06)',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={onToggle}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 13px', background: 'transparent',
            border: 'none', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <Icon size={12} style={{ color: C.primaryBright, flexShrink: 0 }} />
          <span style={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 600, color: C.text, flex: 1, letterSpacing: '0.04em' }}>
            {info.name}
          </span>
          <span className="badge3d not_checked" style={{ fontSize: 9, padding: '2px 8px' }}>
            D{info.degree} · C{info.cardinality}
          </span>
        </button>
        {/* Keys strip */}
        <div style={{
          display: 'flex', gap: 5, flexWrap: 'wrap',
          padding: '0 13px 9px', alignItems: 'center',
        }}>
          {pkFields.length > 0 ? (
            pkFields.map((f) => (
              <span key={f.name} className="badge3d mastered" style={{ fontSize: 9, padding: '2px 8px' }}>
                PK · {f.name}
              </span>
            ))
          ) : (
            <span style={{ fontFamily: fonts.mono, fontSize: 9, color: C.textFaint }}>no primary key</span>
          )}
          <span style={{ fontFamily: fonts.mono, fontSize: 9, color: C.textFaint, marginLeft: 'auto' }}>
            {info.fields.length} fields
          </span>
        </div>
        {expanded && (
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: `1px solid ${C.borderSoft}` }}>
            <tbody>
              {info.fields.map((f, i) => (
                <tr key={i}>
                  <td style={{
                    padding: '4px 6px 4px 13px', fontFamily: fonts.mono, fontSize: 10.5,
                    color: C.text, borderBottom: `1px solid ${C.borderSoft}`, whiteSpace: 'nowrap',
                  }}>{f.name}</td>
                  <td style={{
                    padding: '4px 6px', fontFamily: fonts.mono, fontSize: 10.5,
                    color: C.textMuted, borderBottom: `1px solid ${C.borderSoft}`, whiteSpace: 'nowrap',
                  }}>{f.type}</td>
                  <td style={{
                    padding: '4px 13px 4px 6px', fontFamily: fonts.mono, fontSize: 9.5,
                    color: f.key === 'PRI' ? C.success : f.nullable ? C.textFaint : C.warning,
                    borderBottom: `1px solid ${C.borderSoft}`, whiteSpace: 'nowrap', textAlign: 'right',
                  }}>
                    {f.key === 'PRI' ? 'PK' : f.nullable ? 'NULL' : 'NOT NULL'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function SqlPulse() {
  const navigate = useNavigate()
  const { addToast, aiChatOpen, toggleAIChat } = useUIStore()
  const { completed, attempts, recordAttempt, completeMission, resetProgress, logSqlOutcome } = useSqlPulseStore()

  const [engineOn, setEngineOn] = useState(false)
  const [engineError, setEngineError] = useState(null)

  // First incomplete mission overall = initial selection
  const firstOpen = useMemo(
    () => (MISSIONS.find((m) => !completed[m.id]?.completedAt) || MISSIONS[0]),
    [] // eslint-disable-line
  )
  const [missionId, setMissionId] = useState(firstOpen.id)
  const mission = getMission(missionId)
  const world = WORLDS.find((w) => w.id === mission.world)
  const bundle = getBundle(mission.bundle)

  const [sqlText, setSqlText] = useState('')
  const [confidence, setConfidence] = useState('fairly_sure')
  const [stageTables, setStageTables] = useState([])
  const [stage, setStage] = useState({ highlights: {}, joinLinks: null, groupBuckets: null, aggLabel: 'COUNT', note: '' })
  const [your, setYour] = useState(null)       // last result set from the student db
  const [expected, setExpected] = useState(null)
  const [grade, setGrade] = useState(null)
  const [execError, setExecError] = useState(null)
  const [dbTables, setDbTables] = useState([])
  const [openTable, setOpenTable] = useState(0)
  const [busy, setBusy] = useState(false)
  const [hintsShown, setHintsShown] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizChecked, setQuizChecked] = useState(false)

  const expectedCache = useRef(new Map())
  const sessionStart = useRef(Date.now())

  // Engine boot
  useEffect(() => {
    let alive = true
    initEngine()
      .then(() => { if (alive) setEngineOn(true) })
      .catch((e) => { if (alive) setEngineError(e?.message || 'Failed to load SQL engine') })
    return () => { alive = false }
  }, [])

  // Load mission: seed db, compute expected, inspect schema, dump stage rows
  const loadMission = useCallback((m) => {
    const b = getBundle(m.bundle)
    const db = resetToSeed(b.seed)
    setStage({ highlights: {}, joinLinks: null, groupBuckets: null, aggLabel: 'COUNT', note: '' })
    setDbTables(b.tables.map((t) => inspectTable(db, t)).filter(Boolean))
    setStageTables(b.tables.map((t) => {
      const insp = inspectTable(db, t)
      const rows = getTableRows(db, t).values
      return { name: t, fields: insp?.fields || [], rows }
    }))
    setStage({ highlights: {}, joinLinks: null, groupBuckets: null, aggLabel: 'COUNT', note: '' })
    setOpenTable(0)
    setSqlText('')
    setYour(null)
    setGrade(null)
    setExecError(null)
    setHintsShown(0)
    setQuizAnswers({})
    setQuizChecked(false)
    if (!expectedCache.current.has(m.id)) {
      const { expected: exp, error } = computeExpected(b.seed, m.solution)
      expectedCache.current.set(m.id, { exp, error })
    }
    const cached = expectedCache.current.get(m.id)
    setExpected(cached?.exp || null)
    if (cached?.error) console.warn(`[SQL Pulse] reference solution error in ${m.id}:`, cached.error)
  }, [])

  // Engine-ready initial load
  useEffect(() => {
    if (!engineOn) return
    loadMission(mission)
    sessionStart.current = Date.now()
  }, [engineOn]) // eslint-disable-line

  // Mission switch
  const selectMission = (id) => {
    if (!engineOn) return
    const m = getMission(id)
    setMissionId(id)
    loadMission(m)
    sessionStart.current = Date.now()
  }

  const selectWorld = (wid) => {
    const ms = getWorldMissions(wid)
    const next = ms.find((m) => !completed[m.id]?.completedAt) || ms[0]
    selectMission(next.id)
  }

  // Reset DB
  const handleReset = () => {
    if (!engineOn) return
    const b = getBundle(mission.bundle)
    try {
      const db = resetToSeed(b.seed)
      setDbTables(b.tables.map((t) => inspectTable(db, t)).filter(Boolean))
      setYour(null)
      setGrade(null)
      setExecError(null)
      addToast({ type: 'success', message: 'Database reset to mission seed' })
    } catch (e) {
      addToast({ type: 'error', message: e?.message || 'Reset failed' })
    }
  }

  // ── 3D stage analysis — WHERE hits, JOIN beams, GROUP BY buckets ──
  const computeStage = (sql, result) => {
    const db = getActiveDatabase()
    if (!db) return
    const bundleTables = getBundle(mission.bundle).tables
    const mentioned = bundleTables.filter((t) => new RegExp(`\\b${t}\\b`, 'i').test(sql))
    const hasJoin = /\bjoin\b/i.test(sql) || (mentioned.length >= 2 && /,\s*\w+/.test(sql.match(/\bfrom\b([\s\S]*)/i)?.[1] || '') && mentioned.length >= 2)
    const hasGroup = /\bgroup\s+by\b/i.test(sql)
    const hasWhere = /\bwhere\b/i.test(sql)

    let highlights = {}
    let joinLinks = null
    let groupBuckets = null
    let aggLabel = 'COUNT'
    let note = ''

    const safeQuery = (q) => {
      const r = execOnDb(db, q)
      return r.error ? null : r.results[0] || null
    }

    if (hasJoin && mentioned.length >= 2) {
      // Two-table query — draw PK→FK beams between matched rowid pairs
      const [t1, t2] = mentioned.slice(0, 2)
      let cond = null
      const eq = sql.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/)
      if (eq) {
        cond = `${eq[1]}.${eq[2]} = ${eq[3]}.${eq[4]}`
      } else if (/\bnatural\s+join\b/i.test(sql)) {
        // shared column name between the two tables
        const f1 = new Set((stageTables.find((t) => t.name === t1)?.fields || []).map((f) => f.name.toLowerCase()))
        const shared = (stageTables.find((t) => t.name === t2)?.fields || []).find((f) => f1.has(f.name.toLowerCase()))
        if (shared) cond = `${t1}.${shared.name} = ${t2}.${shared.name}`
      }
      if (cond) {
        const rs = safeQuery(`SELECT ${t1}.rowid AS ra, ${t2}.rowid AS rb FROM ${t1}, ${t2} WHERE ${cond}`)
        if (rs) {
          joinLinks = rs.values.map((r) => ({ a: r[0] - 1, b: r[1] - 1 }))
          highlights = {
            [t1]: new Set(joinLinks.map((l) => l.a)),
            [t2]: new Set(joinLinks.map((l) => l.b)),
          }
        }
      }
      if (result) {
        const d1 = stageTables.find((t) => t.name === t1)?.fields.length || 0
        const d2 = stageTables.find((t) => t.name === t2)?.fields.length || 0
        const c1 = stageTables.find((t) => t.name === t1)?.rows.length || 0
        const c2 = stageTables.find((t) => t.name === t2)?.rows.length || 0
        note = `Degree = D1+D2 = ${d1}+${d2} = ${result.columns.length} · Cardinality = C1×C2 = ${c1}×${c2} = ${c1 * c2} → matched rows: ${result.values.length}`
      }
    } else if (hasWhere && mentioned.length >= 1) {
      // Single-table WHERE — evaluate the condition per row via rowid
      const t = mentioned[0]
      const m = sql.match(/\bwhere\b([\s\S]*)/i)
      let seg = m ? m[1] : ''
      const cut = seg.search(/\b(group\s+by|having|order\s+by|limit)\b/i)
      if (cut >= 0) seg = seg.slice(0, cut)
      seg = seg.replace(/;\s*$/, '').trim()
      if (seg) {
        const rs = safeQuery(`SELECT rowid FROM "${t}" WHERE ${seg}`)
        if (rs) {
          highlights = { [t]: new Set(rs.values.map((r) => r[0] - 1)) }
          if (result) {
            note = `Degree ${result.columns.length} · Cardinality ${result.values.length} — ${highlights[t].size} row(s) satisfy the WHERE clause`
          }
        }
      }
    } else if (hasGroup && result && result.values.length > 0) {
      // GROUP BY — stack aggregate buckets straight from the result set
      const cols = result.columns || []
      let vIdx = -1
      for (let i = cols.length - 1; i >= 0; i--) {
        if (result.values.some((r) => typeof r[i] === 'number' || /^-?\d+(\.\d+)?$/.test(String(r[i])))) { vIdx = i; break }
      }
      if (vIdx >= 0) {
        aggLabel = String(cols[vIdx]).toUpperCase()
        groupBuckets = result.values.slice(0, 8).map((r) => ({ key: String(r[0]), value: Number(r[vIdx]) || 0 }))
        note = `Degree ${result.columns.length} · Cardinality ${result.values.length} — tiles stack into ${groupBuckets.length} group bucket(s)`
      }
    } else if (result) {
      note = `Degree ${result.columns.length} · Cardinality ${result.values.length}`
    }

    setStage({ highlights, joinLinks, groupBuckets, aggLabel, note })
  }

  // ── Visual clause builder — tactile chips scaffold the query ──
  const CLAUSE_CHIPS = [
    ['SELECT', 'SELECT '],
    ['DISTINCT', 'DISTINCT '],
    ['FROM', ' FROM '],
    ['WHERE', ' WHERE '],
    ['GROUP BY', ' GROUP BY  '],
    ['HAVING', ' HAVING  '],
    ['ORDER BY', ' ORDER BY  DESC'],
    ['IS NULL', ' IS NULL'],
    ['BETWEEN', " BETWEEN '' AND ''"],
    ["LIKE '%_'", " LIKE '%'"],
  ]
  const insertClause = (tpl) => {
    setSqlText((t) => (t.endsWith(' ') || t === '' ? t + tpl : t + tpl))
  }

  // Execute + grade
  const handleExecute = () => {
    if (!engineOn || busy || !sqlText.trim()) return
    setBusy(true)
    recordAttempt(mission.id)

    let res = null
    try {
      res = runQuery(sqlText)
    } catch (e) {
      res = { results: [], error: e?.message || String(e) }
    }

    const last = res.results.length ? res.results[res.results.length - 1] : null
    setYour(last)
    setExecError(res.error)

    const result = gradeSubmission({
      mission,
      sqlText,
      your: last,
      expected,
      execError: res.error,
    })
    setGrade(result)

    // Feed the attempt (with declared certainty) into Learner Memory —
    // grader traps become "What StudyPulse noticed" misconceptions.
    logSqlOutcome({ mission, grade: result, confidence })

    // Drive the 3D relational stage from the executed query
    computeStage(sqlText, last)

    if (result.passed && mission.kind !== 'quiz') {
      const { already, xp } = completeMission(mission.id, mission.xp)
      flushFocusMinutes()
      addToast({
        type: 'success',
        message: already ? 'Mission already complete' : `Mission complete — +${xp} XP`,
      })
    }
    setBusy(false)
  }

  // Quiz grading
  const checkQuiz = () => {
    setQuizChecked(true)
    const allCorrect = mission.questions.every((q, i) => quizAnswers[i] === q.answer)
    if (allCorrect) {
      const { already, xp } = completeMission(mission.id, mission.xp)
      flushFocusMinutes()
      addToast({ type: 'success', message: already ? 'Mission already complete' : `Mission complete — +${xp} XP` })
    }
  }

  // Focus-time telemetry: flush elapsed minutes to the main dashboard log
  const flushFocusMinutes = () => {
    const elapsedMs = Date.now() - sessionStart.current
    const mins = Math.floor(elapsedMs / 60000)
    if (mins > 0) {
      useSqlPulseStore.getState().logFocusMinutes(mins)
      sessionStart.current = Date.now()
    }
  }
  useEffect(() => {
    const iv = setInterval(flushFocusMinutes, 60000)
    return () => {
      clearInterval(iv)
      flushFocusMinutes()
    }
  }, [missionId]) // eslint-disable-line

  // Ask AI Tutor — schema + query + error → Diagnostic Hint Mode prefill
  const askTutor = () => {
    const schemaLines = dbTables.map((t) =>
      `${t.name}(${t.fields.map((f) => `${f.name} ${f.type}${f.key === 'PRI' ? ' PK' : ''}`).join(', ')}) — degree ${t.degree}, cardinality ${t.cardinality}`
    )
    const text = [
      `SQL Pulse — World ${world.id}: ${world.title}`,
      `Mission: ${mission.title} (${mission.concept})`,
      'SCHEMA:',
      ...schemaLines,
      'MY QUERY:',
      sqlText.trim() || '(nothing written yet)',
      execError
        ? `ENGINE ERROR: ${execError}`
        : grade
          ? `GRADER: ${grade.message}`
          : 'Not executed yet.',
      'Respond in Diagnostic Hint Mode: name the exact flaw and ask ONE guiding question. Do not reveal the full answer.',
    ].join('\n')
    window.dispatchEvent(new CustomEvent('studypulse-ai-prefill', { detail: { text } }))
    if (!aiChatOpen) toggleAIChat()
  }

  const nextMission = useMemo(() => {
    const idx = MISSIONS.findIndex((m) => m.id === missionId)
    return MISSIONS[idx + 1] || null
  }, [missionId])

  const missionDone = !!completed[mission.id]?.completedAt
  const worldMs = (wid) => worldMastery(completed, wid)

  // ── Render ──────────────────────────────────────────────────

  if (engineError) {
    return (
      <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 720, margin: '0 auto' }}>
        <PageHeader title="SQL Pulse" subtitle="Mission-based CBSE MySQL trainer" status={{ kind: 'error', label: 'engine error' }} />
        <PaneCard title="Engine">
          <div style={{ padding: 16 }}>
            <Mono color={C.error}>{engineError}</Mono>
          </div>
        </PaneCard>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, width: '100%' }}>
      <PageHeader
        title="SQL Pulse"
        subtitle="CBSE Class 11-12 (083 / 065) MySQL campaign — 6 worlds · 24 missions · in-browser execution"
        status={engineOn
          ? { kind: 'success', label: `${campaignProgress(completed)}% campaign` }
          : { kind: 'warning', label: 'loading engine' }}
        actions={
          <button
            onClick={() => {
              if (confirm('Reset all SQL Pulse progress? XP already earned stays in your profile.')) {
                resetProgress()
                expectedCache.current.clear()
                selectMission(firstOpen.id)
              }
            }}
            style={{
              padding: '5px 12px', borderRadius: 4, background: 'transparent',
              border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer',
              fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '0.06em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.cardHover }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = 'transparent' }}
          >
            RESET PROGRESS
          </button>
        }
      />

      {/* World tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {WORLDS.map((w) => {
          const active = w.id === world.id
          const pct = worldMs(w.id)
          return (
            <button
              key={w.id}
              onClick={() => engineOn && selectWorld(w.id)}
              disabled={!engineOn}
              title={w.title}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 4,
                background: active ? C.cardHover : 'transparent',
                border: `1px solid ${active ? C.borderStrong : C.borderSoft}`,
                color: active ? C.text : C.textMuted,
                cursor: engineOn ? 'pointer' : 'default',
                fontFamily: fonts.body, fontSize: 12, fontWeight: active ? 600 : 400,
                letterSpacing: '-0.01em',
              }}
            >
              <span className={`dot ${pct === 100 ? 'dot-success' : pct > 0 ? 'dot-warning' : 'dot-neutral'}`} />
              W{w.id} · {w.title.split(' ')[0]}
              <Mono color={C.textFaint} size={10}>{pct}%</Mono>
            </button>
          )
        })}
      </div>

      {!engineOn ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '60px 0', justifyContent: 'center' }}>
          <CircleNotch size={18} className="spin" style={{ color: C.textFaint }} />
          <Mono>initialising SQL engine (WASM)…</Mono>
        </div>
      ) : (
        <div className="sql-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
          {/* ── Left pane: brief + schema ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PaneCard
              title={`World ${world.id} · Mission ${getWorldMissions(world.id).findIndex((m) => m.id === mission.id) + 1}/4`}
              right={
                missionDone
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="dot dot-success" /><Mono color={C.success} size={10}>COMPLETE</Mono></span>
                  : <Mono color={C.textFaint} size={10}>+{mission.xp} XP</Mono>
              }
            >
              <div style={{ padding: '12px 12px 14px' }}>
                <h2 style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>
                  {mission.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: fonts.mono, fontSize: 9.5, color: C.textMuted,
                    border: `1px solid ${C.border}`, borderRadius: 3, padding: '1px 6px',
                  }}>
                    {mission.concept}
                  </span>
                  <Mono color={C.textFaint} size={9.5}>{world.tag}</Mono>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mission.brief.map((b, i) => (
                    <p key={i} style={{ fontSize: 12.5, lineHeight: 1.6, color: C.textMuted, margin: 0 }}>{b}</p>
                  ))}
                </div>

                {/* Mission list for this world */}
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.borderSoft}`, paddingTop: 8 }}>
                  {getWorldMissions(world.id).map((m, i) => {
                    const done = !!completed[m.id]?.completedAt
                    const activeSel = m.id === mission.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => selectMission(m.id)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '5px 8px', borderRadius: 3, border: 'none',
                          background: activeSel ? C.cardHover : 'transparent',
                          color: activeSel ? C.text : C.textMuted,
                          cursor: 'pointer', textAlign: 'left',
                          fontFamily: fonts.body, fontSize: 12,
                        }}
                      >
                        <span className={`dot ${done ? 'dot-success' : activeSel ? 'dot-warning' : 'dot-neutral'}`} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {i + 1}. {m.title}
                        </span>
                        {attempts[m.id] > 0 && !done && (
                          <Mono color={C.textFaint} size={9}>{attempts[m.id]}×</Mono>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </PaneCard>

            {/* Schema inspector */}
            <PaneCard title="Schema inspector" right={<Mono color={C.textFaint} size={9.5}>{bundle.label}</Mono>}>
              <div>
                {dbTables.map((t, i) => (
                  <SchemaTable
                    key={t.name}
                    info={t}
                    expanded={openTable === i}
                    onToggle={() => setOpenTable(openTable === i ? -1 : i)}
                  />
                ))}
              </div>
              <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.borderSoft}` }}>
                <Mono color={C.textFaint} size={9.5}>D = degree (columns) · C = cardinality (rows) · PK = primary key</Mono>
              </div>
            </PaneCard>

            {/* Hints */}
            {mission.hints.length > 0 && (
              <PaneCard title="Hints">
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mission.hints.map((h, i) => (
                    <div key={i}>
                      {i < hintsShown ? (
                        <div style={{
                          padding: '7px 10px', borderRadius: 3,
                          background: C.bgSoft, border: `1px solid ${C.borderSoft}`,
                          fontSize: 12, color: C.textMuted, lineHeight: 1.55,
                        }}>
                          <Mono color={C.textFaint} size={9}>HINT {i + 1} — </Mono>{h}
                        </div>
                      ) : i === hintsShown ? (
                        <button
                          onClick={() => setHintsShown(i + 1)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '5px 10px', borderRadius: 3,
                            background: 'transparent', border: `1px solid ${C.border}`,
                            color: C.textMuted, cursor: 'pointer',
                            fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.06em',
                          }}
                        >
                          <Lock size={11} /> REVEAL HINT {i + 1}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </PaneCard>
            )}
          </div>

          {/* ── Right column: editor + results ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            {mission.kind === 'quiz' ? (
              /* Quiz mission */
              <PaneCard title="Interactive checks" right={<Mono color={C.textFaint} size={10}>{mission.questions.length} questions</Mono>}>
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {mission.questions.map((q, qi) => (
                    <div key={qi}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.text, margin: '0 0 8px' }}>
                        {qi + 1}. {q.q}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {q.options.map((opt, oi) => {
                          const chosen = quizAnswers[qi] === oi
                          const correct = quizChecked && oi === q.answer
                          const wrong = quizChecked && chosen && oi !== q.answer
                          return (
                            <button
                              key={oi}
                              onClick={() => !quizChecked && setQuizAnswers((s) => ({ ...s, [qi]: oi }))}
                              style={{
                                textAlign: 'left', padding: '7px 10px', borderRadius: 3,
                                fontFamily: fonts.body, fontSize: 12,
                                background: correct ? 'color-mix(in srgb, var(--md-primary) 10%, transparent)' : wrong ? 'rgba(239,68,68,0.10)' : chosen ? C.cardHover : 'transparent',
                                border: `1px solid ${correct ? 'color-mix(in srgb, var(--md-primary) 40%, transparent)' : wrong ? 'rgba(239,68,68,0.4)' : chosen ? C.borderStrong : C.borderSoft}`,
                                color: correct ? C.success : wrong ? C.error : C.text,
                                cursor: quizChecked ? 'default' : 'pointer',
                              }}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                      {quizChecked && (
                        <p style={{ fontSize: 11.5, color: C.textFaint, margin: '6px 0 0' }}>{q.explain}</p>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {!quizChecked ? (
                      <button
                        onClick={checkQuiz}
                        disabled={Object.keys(quizAnswers).length < mission.questions.length}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 7,
                          padding: '7px 16px', borderRadius: 4, border: 'none',
                          background: Object.keys(quizAnswers).length < mission.questions.length ? C.cardSoft : C.fill,
                          color: Object.keys(quizAnswers).length < mission.questions.length ? C.textFaint : C.fillText,
                          cursor: Object.keys(quizAnswers).length < mission.questions.length ? 'default' : 'pointer',
                          fontFamily: fonts.body, fontSize: 12.5, fontWeight: 600,
                        }}
                      >
                        <CheckCircle size={14} /> Submit answers
                      </button>
                    ) : (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                          <span className={`dot ${mission.questions.every((q, i) => quizAnswers[i] === q.answer) ? 'dot-success' : 'dot-error'}`} />
                          <Mono color={C.textMuted}>
                            {mission.questions.filter((q, i) => quizAnswers[i] === q.answer).length}/{mission.questions.length} correct
                          </Mono>
                        </span>
                        <button
                          onClick={() => { setQuizChecked(false); setQuizAnswers({}); recordAttempt(mission.id) }}
                          style={{
                            padding: '5px 12px', borderRadius: 3,
                            background: 'transparent', border: `1px solid ${C.border}`,
                            color: C.textMuted, cursor: 'pointer',
                            fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.06em',
                          }}
                        >
                          RETRY
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </PaneCard>
            ) : (
              /* SQL editor mission */
              <>
                {/* 3D relational stage */}
                {stageTables.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <SqlStage3D
                      tables={stageTables}
                      highlights={stage.highlights}
                      joinLinks={stage.joinLinks}
                      groupBuckets={stage.groupBuckets}
                      aggLabel={stage.aggLabel}
                      note={stage.note}
                    />
                  </div>
                )}
                <PaneCard
                  title="SQL terminal"
                  right={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <Mono color={C.textFaint} size={9.5}>Ctrl+↵ execute · Tab indents</Mono>
                    </span>
                  }
                >
                  {/* Visual clause builder */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center',
                    padding: '8px 12px', borderBottom: `1px solid ${C.borderSoft}`,
                  }}>
                    <span className="metric-label" style={{ padding: 0, marginRight: 6 }}>Clause builder</span>
                    {CLAUSE_CHIPS.map(([label, tpl]) => (
                      <button key={label} onClick={() => insertClause(tpl)} className="motion-spring" style={{
                        padding: '3px 10px', borderRadius: 999,
                        background: 'color-mix(in srgb, var(--md-primary) 8%, transparent)', border: `1px solid ${C.borderSoft}`,
                        color: C.primaryBright, cursor: 'pointer',
                        fontFamily: fonts.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                      }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <SqlEditor value={sqlText} onChange={setSqlText} onExecute={handleExecute} />
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderTop: `1px solid ${C.borderSoft}`, gap: 8, flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={handleExecute}
                        disabled={busy || !sqlText.trim()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 7,
                          padding: '6px 16px', borderRadius: 4, border: 'none',
                          background: busy || !sqlText.trim() ? C.cardSoft : C.fill,
                          color: busy || !sqlText.trim() ? C.textFaint : C.fillText,
                          cursor: busy || !sqlText.trim() ? 'default' : 'pointer',
                          fontFamily: fonts.body, fontSize: 12.5, fontWeight: 600,
                        }}
                      >
                        {busy ? <CircleNotch size={13} className="spin" /> : <Play size={13} weight="fill" />}
                        Execute
                      </button>
                      <button
                        onClick={handleReset}
                        title="Restore the mission's seed data"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 4,
                          background: 'transparent', border: `1px solid ${C.border}`,
                          color: C.textMuted, cursor: 'pointer',
                          fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '0.06em',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.cardHover }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = 'transparent' }}
                      >
                        <ArrowCounterClockwise size={12} /> RESET DB
                      </button>
                    </div>
                    {/* Certainty bar — "a lucky guess never counts" */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mono color={C.textFaint} size={9}>HOW SURE?</Mono>
                      <div style={{ display: 'flex', gap: 2, padding: 2, border: `1px solid ${C.borderSoft}`, borderRadius: 4, background: C.bgSoft }}>
                        {CONFIDENCE_LEVELS.map((c) => {
                          const active = confidence === c.id
                          return (
                            <button
                              key={c.id}
                              onClick={() => setConfidence(c.id)}
                              style={{
                                padding: '3px 8px', borderRadius: 3, border: 'none',
                                background: active ? C.cardHover : 'transparent',
                                color: active ? C.text : C.textFaint,
                                cursor: 'pointer',
                                fontFamily: fonts.body, fontSize: 10.5, fontWeight: active ? 600 : 400,
                              }}
                            >
                              {c.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <button
                      onClick={askTutor}
                      title="Send schema + query + error to the AI tutor (Diagnostic Hint Mode)"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 4,
                        background: 'transparent', border: `1px solid ${C.border}`,
                        color: C.text, cursor: 'pointer',
                        fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '0.06em',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <Sparkle size={12} /> ASK AI TUTOR
                    </button>
                  </div>
                </PaneCard>

                {/* Grade callout */}
                {grade && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px', borderRadius: 4,
                    background: grade.passed ? 'color-mix(in srgb, var(--md-primary) 7%, transparent)' : C.bgSoft,
                    border: `1px solid ${grade.passed ? 'color-mix(in srgb, var(--md-primary) 35%, transparent)' : C.border}`,
                    borderLeft: `2px solid ${grade.passed ? C.success : grade.level === 'trap' ? C.warning : C.error}`,
                  }}>
                    <span className={`dot ${grade.passed ? 'dot-success' : grade.level === 'trap' ? 'dot-warning' : 'dot-error'}`} style={{ marginTop: 5 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <Mono color={grade.passed ? C.success : C.text} size={10.5} style={{ letterSpacing: '0.06em' }}>
                          {grade.passed ? 'PASS' : grade.level === 'trap' ? 'CBSE BOARD TRAP' : 'FAIL'}
                        </Mono>
                        {grade.passed && missionDone && (
                          <Mono color={C.success} size={10}>+{completed[mission.id]?.xp || mission.xp} XP earned</Mono>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: C.textMuted, margin: 0 }}>
                        {grade.message}
                      </p>
                      {grade.passed && nextMission && (
                        <button
                          onClick={() => selectMission(nextMission.id)}
                          style={{
                            marginTop: 8, padding: '5px 12px', borderRadius: 3,
                            background: C.fill, color: C.fillText, border: 'none',
                            cursor: 'pointer', fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
                          }}
                        >
                          Next mission: {nextMission.title} →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Trap warnings beyond the first */}
                {(grade?.trapWarnings || []).slice(1).map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '8px 12px', borderRadius: 4,
                    background: C.bgSoft, border: `1px solid ${C.border}`,
                  }}>
                    <Warning size={13} style={{ color: C.warning, marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <Mono color={C.warning} size={10}>{t.trap} — {t.title}</Mono>
                      <p style={{ fontSize: 12, color: C.textMuted, margin: '2px 0 0', lineHeight: 1.5 }}>{t.message}</p>
                    </div>
                  </div>
                ))}

                {/* Result diff */}
                {(your || execError) && (
                  <PaneCard
                    title="Result diff — your output vs target"
                    right={
                      your
                        ? <Mono color={C.textFaint} size={9.5}>{your.values.length} rows × {your.columns.length} cols</Mono>
                        : null
                    }
                  >
                    {execError && (
                      <div style={{
                        padding: '8px 12px', borderBottom: `1px solid ${C.borderSoft}`,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span className="dot dot-error" />
                        <Mono color={C.error} size={11}>{execError}</Mono>
                      </div>
                    )}
                    <div className="sql-diff" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      <div style={{ borderRight: `1px solid ${C.border}` }}>
                        <div style={{
                          padding: '5px 12px', borderBottom: `1px solid ${C.borderSoft}`,
                          display: 'flex', alignItems: 'center', gap: 7,
                        }}>
                          <span className={`dot ${grade?.passed ? 'dot-success' : grade?.level === 'cells' ? 'dot-error' : 'dot-neutral'}`} />
                          <Mono color={C.textMuted} size={10}>YOUR QUERY OUTPUT</Mono>
                        </div>
                        <SqlResultTable
                          columns={your?.columns}
                          values={grade?.diff?.yVals || your?.values}
                          mismatchCells={grade?.diff?.cellMismatches}
                        />
                      </div>
                      <div>
                        <div style={{
                          padding: '5px 12px', borderBottom: `1px solid ${C.borderSoft}`,
                          display: 'flex', alignItems: 'center', gap: 7,
                        }}>
                          <span className="dot dot-success" />
                          <Mono color={C.textMuted} size={10}>EXPECTED TARGET OUTPUT</Mono>
                        </div>
                        <SqlResultTable
                          columns={expected?.columns}
                          values={grade?.diff?.eVals || expected?.values}
                          mismatchCells={grade?.diff?.cellMismatches}
                          expectedPane
                          emptyLabel="Reference output"
                        />
                      </div>
                    </div>
                    {!grade?.passed && !grade?.diff && grade?.level === 'columns' && (
                      <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.borderSoft}` }}>
                        <Mono color={C.textFaint} size={10}>Column names must match the target — check your aliases (AS).</Mono>
                      </div>
                    )}
                    {grade && !grade.orderSensitive && (grade?.diff?.cellMismatches?.length || 0) > 0 && (
                      <div style={{ padding: '6px 12px', borderTop: `1px solid ${C.borderSoft}` }}>
                        <Mono color={C.textFaint} size={9.5}>Rows sorted for cell comparison (solution has no ORDER BY — row order is not graded).</Mono>
                      </div>
                    )}
                  </PaneCard>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1000px) {
          .sql-grid { grid-template-columns: 1fr !important; }
          .sql-diff { grid-template-columns: 1fr !important; }
          .sql-diff > div:first-child { border-right: none !important; border-bottom: 1px solid ${C.border}; }
        }
      `}</style>
    </div>
  )
}
