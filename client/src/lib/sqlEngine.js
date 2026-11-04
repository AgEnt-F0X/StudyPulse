// SQL Pulse execution engine — sql.js (SQLite WASM) behind a MySQL
// compatibility layer. Deterministic: every mission's expected output is
// computed by running the reference solution through THIS engine, so the
// grader and the student always see the same semantics.
//
// MySQL → SQLite translations handled here:
//   SHOW TABLES / DESC[RIBE] t     → sqlite_master / PRAGMA table_info
//                                    (rendered as MySQL Field|Type|Null|Key|Default|Extra)
//   AUTO_INCREMENT                 → INTEGER PRIMARY KEY AUTOINCREMENT / stripped
//   ALTER TABLE ... ADD <col>      → ADD COLUMN
//   ALTER TABLE ... MODIFY COLUMN  → table rebuild with new type/constraints
//   ALTER TABLE ... ADD/DROP PRIMARY KEY → table rebuild with pk flags
//   LIMIT x, y                     → LIMIT y OFFSET x
//   backticks / double-quoted strings → bare identifiers / single quotes
//   CBSE functions (UCASE, MID, INSTR, MOD, POW, TRUNCATE, DAYNAME,
//   MONTHNAME, NOW, CURDATE, ...)  → registered scalar functions

import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

let SQLLib = null
let activeDb = null
let initPromise = null

// ── Custom scalar functions (MySQL semantics, 1-based strings, ISO dates) ──

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Extract a {y, m, d} triple from any value carrying a leading YYYY-MM-DD.
function parseIsoDate(v) {
  if (v == null) return null
  const m = String(v).match(/^\s*(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const y = +m[1], mo = +m[2], d = +m[3]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return { y, m: mo, d }
}

function mysqlMid(s, pos, len) {
  if (s == null || pos == null) return null
  const str = String(s)
  const start = Math.floor(pos) - 1 // MySQL is 1-based; negative pos = from end
  if (start < 0) {
    // MySQL: negative position counts from the end of the string
    const fromEnd = Math.abs(Math.floor(pos))
    if (len == null) return fromEnd === 0 ? null : str.slice(str.length - fromEnd)
    return str.slice(Math.max(0, str.length - fromEnd), Math.max(0, str.length - fromEnd + Math.floor(len)))
  }
  if (len == null) return str.slice(start)
  if (Math.floor(len) < 0) return null
  return str.slice(start, start + Math.floor(len))
}

function mysqlTruncate(x, d) {
  if (x == null || d == null) return null
  const factor = Math.pow(10, Math.floor(d))
  const val = Math.trunc(Number(x) * factor) / factor
  // Guard against float artifacts (e.g. 88.5 * 10 = 884.999...)
  return Number(val.toFixed(Math.max(0, Math.floor(d) + 6)))
}

const CUSTOM_FUNCTIONS = {
  // String
  UCASE: (s) => (s == null ? null : String(s).toUpperCase()),
  LCASE: (s) => (s == null ? null : String(s).toLowerCase()),
  MID: mysqlMid,
  // MySQL SUBSTRING(s, pos) = MID; SQLite substr already 1-based — register for parity
  // INSTR exists natively in SQLite with identical semantics.
  LEFT: (s, n) => (s == null || n == null ? null : String(s).slice(0, Math.floor(n))),
  RIGHT: (s, n) => {
    if (s == null || n == null) return null
    const k = Math.floor(n)
    return k <= 0 ? '' : String(s).slice(-k)
  },
  // Numeric
  MOD: (a, b) => (a == null || b == null || Number(b) === 0 ? null : Number(a) % Number(b)),
  POW: (a, b) => (a == null || b == null ? null : Math.pow(Number(a), Number(b))),
  TRUNCATE: mysqlTruncate,
  // Concat (SQLite 3.44+ has CONCAT but register anyway — harmless override guard below)
  CONCAT: (...args) => (args.some((a) => a == null) ? null : args.map((a) => String(a)).join('')),
  // Date/time (datasets use ISO 'YYYY-MM-DD' text)
  YEAR: (v) => { const p = parseIsoDate(v); return p ? p.y : null },
  MONTH: (v) => { const p = parseIsoDate(v); return p ? p.m : null },
  DAY: (v) => { const p = parseIsoDate(v); return p ? p.d : null },
  MONTHNAME: (v) => { const p = parseIsoDate(v); return p ? MONTHS[p.m - 1] : null },
  DAYNAME: (v) => {
    const p = parseIsoDate(v)
    if (!p) return null
    const wd = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()
    return WEEKDAYS[wd]
  },
  NOW: () => {
    const d = new Date()
    const p = (n, w = 2) => String(n).padStart(w, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  },
  CURDATE: () => {
    const d = new Date()
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  },
  SYSDATE: () => CUSTOM_FUNCTIONS.NOW(),
}

function registerFunctions(db) {
  for (const [name, fn] of Object.entries(CUSTOM_FUNCTIONS)) {
    try { db.create_function(name, fn) } catch { /* native override unsupported — SQLite 3.44+ builtin covers it */ }
  }
}

// ── Engine lifecycle ──────────────────────────────────────────

export async function initEngine() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const initSqlJs = (await import('sql.js')).default
    SQLLib = await initSqlJs({ locateFile: () => wasmUrl })
    return true
  })()
  return initPromise
}

export function engineReady() {
  return !!SQLLib
}

export function createDatabase() {
  if (!SQLLib) throw new Error('SQL engine not initialised')
  const db = new SQLLib.Database()
  registerFunctions(db)
  return db
}

export function setActiveDatabase(db) {
  if (activeDb && activeDb !== db) {
    try { activeDb.close() } catch {}
  }
  activeDb = db
}

export function getActiveDatabase() {
  return activeDb
}

export function closeActiveDatabase() {
  if (activeDb) {
    try { activeDb.close() } catch {}
    activeDb = null
  }
}

// ── Pre-processing ────────────────────────────────────────────

export function preprocess(sqlText) {
  let s = sqlText
  // Strip comments (-- line and /* block */)
  s = s.replace(/--[^\n]*/g, ' ')
  s = s.replace(/\/\*[\s\S]*?\*\//g, ' ')
  // Backtick identifiers → bare (CBSE table/column names are simple words)
  s = s.replace(/`/g, '')
  // Double-quoted string literals → single quotes (MySQL default semantics)
  s = s.replace(/"([^"]*)"/g, "'$1'")
  // AUTO_INCREMENT → SQLite form (column-level PK form first, then strip rest)
  s = s.replace(/\bINT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
  s = s.replace(/\bINT\s+AUTO_INCREMENT\b/gi, 'INT')
  s = s.replace(/\bAUTO_INCREMENT\s*=\s*\d+/gi, '')
  s = s.replace(/\bAUTO_INCREMENT\b/gi, '')
  // ALTER ... ADD <col> → ADD COLUMN (but not ADD PRIMARY/UNIQUE/FOREIGN/CONSTRAINT/INDEX/KEY)
  s = s.replace(/\b(ALTER\s+TABLE\s+"?\w+"?\s+ADD)\s+(?!COLUMN\b|PRIMARY\b|UNIQUE\b|FOREIGN\b|CONSTRAINT\b|INDEX\b|KEY\b|FULLTEXT\b|SPATIAL\b)/gi, '$1 COLUMN ')
  // ALTER ... DROP <col> → DROP COLUMN (same exclusions — DROP PRIMARY KEY is a rebuild op)
  s = s.replace(/\b(ALTER\s+TABLE\s+"?\w+"?\s+DROP)\s+(?!COLUMN\b|PRIMARY\b|FOREIGN\b|CONSTRAINT\b|INDEX\b|KEY\b|CHECK\b)/gi, '$1 COLUMN ')
  // MySQL LIMIT offset, count → LIMIT count OFFSET offset
  s = s.replace(/\bLIMIT\s+(\d+)\s*,\s*(\d+)\b/gi, 'LIMIT $2 OFFSET $1')
  return s
}

// Split on semicolons outside single-quoted strings ('' escape aware).
export function splitStatements(sqlText) {
  const out = []
  let cur = ''
  let inString = false
  for (let i = 0; i < sqlText.length; i++) {
    const c = sqlText[i]
    if (c === "'") {
      if (inString && sqlText[i + 1] === "'") { cur += "''"; i++; continue }
      inString = !inString
      cur += c
      continue
    }
    if (c === ';' && !inString) {
      if (cur.trim()) out.push(cur.trim())
      cur = ''
      continue
    }
    cur += c
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

// ── Result plumbing ───────────────────────────────────────────
// A result set is { columns: [...], values: [[...], ...] }

function normalizeResultSet(res) {
  if (!res) return null
  return { columns: res.columns, values: res.values }
}

export function describeTable(db, table) {
  const name = table.replace(/["'`]/g, '').trim()
  const info = db.exec(`PRAGMA table_info("${name}")`)
  if (!info.length || !info[0].values.length) {
    throw new Error(`Table '${name}' doesn't exist`)
  }
  const rows = info[0].values.map((r) => {
    // PRAGMA table_info row: cid, name, type, notnull, dflt_value, pk
    const [, field, type, notnull, dflt, pk] = r
    return [
      field,
      type || 'TEXT',
      notnull ? 'NO' : 'YES',
      pk ? 'PRI' : '',
      dflt == null ? 'NULL' : String(dflt),
      '', // Extra
    ]
  })
  return { columns: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'], values: rows }
}

function showTables(db) {
  const res = db.exec(
    "SELECT name AS Tables_in_cbse FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  )
  return normalizeResultSet(res[0]) || { columns: ['Tables_in_cbse'], values: [] }
}

// Rebuild a table (for MODIFY COLUMN / ADD-DROP PRIMARY KEY — SQLite cannot
// ALTER these in place). Preserves column order, types, NOT NULL, defaults.
function rebuildTable(db, table, { dropPk = false, setPk = null, modify = null } = {}) {
  const info = db.exec(`PRAGMA table_info("${table}")`)
  if (!info.length || !info[0].values.length) throw new Error(`Table '${table}' doesn't exist`)
  const cols = info[0].values.map((r) => ({
    cid: r[0], name: r[1], type: r[2] || 'TEXT',
    notnull: !!r[3], dflt: r[4], pk: !!r[5],
  }))

  const mapped = cols.map((c) => {
    if (modify && c.name.toLowerCase() === modify.column.toLowerCase()) {
      return { ...c, type: modify.type || c.type, notnull: modify.notnull ?? c.notnull, dflt: modify.dflt ?? c.dflt }
    }
    return c
  })

  const defs = mapped.map((c) => {
    const isPk = dropPk ? false : (setPk ? setPk.some((p) => p.toLowerCase() === c.name.toLowerCase()) : c.pk)
    let d = `"${c.name}" ${c.type}`
    if (isPk) d += ' PRIMARY KEY'
    else if (c.notnull) d += ' NOT NULL'
    if (c.dflt != null) d += ` DEFAULT ${c.dflt}`
    return d
  })

  const tmp = `__rebuild_${table}_${Date.now()}`
  const colList = mapped.map((c) => `"${c.name}"`).join(', ')
  db.run(`CREATE TABLE "${tmp}" (${defs.join(', ')})`)
  db.run(`INSERT INTO "${tmp}" (${colList}) SELECT ${colList} FROM "${table}"`)
  db.run(`DROP TABLE "${table}"`)
  db.run(`ALTER TABLE "${tmp}" RENAME TO "${table}"`)
}

// ALTER TABLE variants SQLite can't do natively.
function tryAlterSpecial(db, stmt) {
  let m

  m = stmt.match(/^ALTER\s+TABLE\s+"?(\w+)"?\s+MODIFY(?:\s+COLUMN)?\s+"?(\w+)"?\s+([\s\S]+)$/i)
  if (m) {
    const [, table, column, def] = m
    let rest = def.trim()
    let notnull = false
    let dflt = null
    const nn = rest.match(/\bNOT\s+NULL\b/i)
    if (nn) { notnull = true; rest = rest.replace(/\bNOT\s+NULL\b/i, '') }
    const dm = rest.match(/\bDEFAULT\s+('[^']*'|NULL|\d+(?:\.\d+)?)/i)
    if (dm) { dflt = dm[1]; rest = rest.replace(/\bDEFAULT\s+('[^']*'|NULL|\d+(?:\.\d+)?)\s*/i, '') }
    const type = rest.trim().replace(/\s+/g, ' ')
    if (!type) throw new Error('MODIFY requires a data type')
    rebuildTable(db, table, { modify: { column, type, notnull, dflt } })
    return true
  }

  m = stmt.match(/^ALTER\s+TABLE\s+"?(\w+)"?\s+ADD\s+PRIMARY\s+KEY\s*\(([^)]+)\)$/i)
  if (m) {
    const [, table, cols] = m
    rebuildTable(db, table, { setPk: cols.split(',').map((c) => c.trim()) })
    return true
  }

  m = stmt.match(/^ALTER\s+TABLE\s+"?(\w+)"?\s+DROP\s+PRIMARY\s+KEY$/i)
  if (m) {
    rebuildTable(db, m[1], { dropPk: true })
    return true
  }

  return false
}

// Execute one preprocessed statement on a db. Returns a result set or null.
function execStatement(db, rawStmt) {
  let stmt = preprocess(rawStmt)

  // SHOW TABLES
  if (/^SHOW\s+(TABLES|FULL\s+TABLES)/i.test(stmt)) {
    stmt = stmt.replace(/^SHOW\s+(?:FULL\s+)?TABLES(?:\s+LIKE\s+'[^']*')?/i, '')
    if (/LIKE/i.test(stmt)) throw new Error('SHOW TABLES LIKE is not supported — list and filter visually')
    return showTables(db)
  }

  // DESC / DESCRIBE / EXPLAIN <table>
  let m = stmt.match(/^(?:DESC|DESCRIBE|EXPLAIN)\s+["'`]*(\w+)["'`]*\s*$/i)
  if (m) return describeTable(db, m[1])

  // USE <db> — no-op in a single-database session
  if (/^USE\s+\w+$/i.test(stmt)) return null

  // ALTER special forms
  if (/^ALTER\s+TABLE/i.test(stmt) && tryAlterSpecial(db, stmt)) return null

  // Everything else: db.exec captures rows for SELECT/PRAGMA and returns []
  // for mutations — one path, no discarded result sets.
  const res = db.exec(stmt)
  return res.length ? normalizeResultSet(res[0]) : null
}

/**
 * Run a full script (one or more ;-separated statements) on a database.
 * Returns { results: [resultSet...], error: null } on success, or
 * { results: [...partial], error: 'message' } on the first failing statement.
 * The LAST result set is the one graded / displayed.
 */
export function execOnDb(db, sqlText) {
  const results = []
  try {
    for (const stmt of splitStatements(sqlText)) {
      const rs = execStatement(db, stmt)
      if (rs) results.push(rs)
    }
    return { results, error: null }
  } catch (e) {
    return { results, error: e?.message || String(e) }
  }
}

/** Run on the active student database. */
export function runQuery(sqlText) {
  if (!activeDb) throw new Error('No active database — select a mission first')
  return execOnDb(activeDb, sqlText)
}

/** Seed a fresh database from a script and make it active. Returns the db. */
export function resetToSeed(seedSql) {
  const db = createDatabase()
  try {
    for (const stmt of splitStatements(seedSql)) {
      const rs = execStatement(db, stmt)
      void rs
    }
  } catch (e) {
    try { db.close() } catch {}
    throw e
  }
  setActiveDatabase(db)
  return db
}

/**
 * Compute a mission's expected output in an ISOLATED database so the
 * student's working database is never disturbed.
 */
export function computeExpected(seedSql, solutionSql) {
  const db = createDatabase()
  try {
    for (const stmt of splitStatements(seedSql)) execStatement(db, stmt)
    const { results, error } = execOnDb(db, solutionSql)
    const last = results.length ? results[results.length - 1] : null
    return { expected: last, error }
  } finally {
    try { db.close() } catch {}
  }
}

/** Live schema info for the inspector: columns + degree + cardinality. */
export function inspectTable(db, table) {
  let desc
  try { desc = describeTable(db, table) } catch { return null }
  const countRes = db.exec(`SELECT COUNT(*) FROM "${table}"`)
  const cardinality = countRes.length ? Number(countRes[0].values[0][0]) : 0
  return {
    name: table,
    fields: desc.values.map((r) => ({
      name: r[0], type: r[1], nullable: r[2] === 'YES',
      key: r[3], dflt: r[4],
    })),
    degree: desc.values.length,
    cardinality,
  }
}

/**
 * Dump a table's rows ordered by rowid — index i in the result is exactly
 * rowid i+1, which is what the 3D stage uses to map WHERE/join hits back
 * to physical tile positions.
 */
export function getTableRows(db, table, limit = 60) {
  try {
    const res = db.exec(`SELECT * FROM "${table}" ORDER BY rowid LIMIT ${limit}`)
    return res.length
      ? { columns: res[0].columns, values: res[0].values }
      : { columns: [], values: [] }
  } catch {
    return { columns: [], values: [] }
  }
}

// ── Value normalisation (shared by the grader) ────────────────

export function normalizeCell(v) {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return { t: 'n', v }
  const s = String(v).trim()
  if (/^-?\d+(\.\d+)?$/.test(s)) return { t: 'n', v: Number(s) }
  return { t: 's', v: s }
}

export function cellsEqual(a, b) {
  const na = normalizeCell(a)
  const nb = normalizeCell(b)
  if (na === null || nb === null) return na === null && nb === null
  if (na.t !== nb.t) {
    // numeric strings vs numbers already unified; only string/number mismatch
    // remains when e.g. 'A1001' vs 5 — not equal
    return false
  }
  if (na.t === 'n') {
    const diff = Math.abs(na.v - nb.v)
    const scale = Math.max(1, Math.abs(na.v), Math.abs(nb.v))
    return diff <= 1e-6 * scale
  }
  return na.v === nb.v
}
