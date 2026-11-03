// SQL Pulse — dual-layer query grader.
// Layer 1: result-set verification (columns, row order per ORDER BY, values).
// Layer 2: AST/keyword verification — the required CBSE concept must actually
// appear in the query, so hardcoded output is rejected, and classic board
// traps ( = NULL, aggregates in WHERE, COUNT(*) vs COUNT(col), DDL/DML
// mixups ) are caught with targeted feedback.

import { cellsEqual } from './sqlEngine'

// ── Concept patterns auto-derived from the reference solution ──

const CONCEPT_PATTERNS = [
  { re: /\bGROUP\s+BY\b/i, label: 'GROUP BY' },
  { re: /\bHAVING\b/i, label: 'HAVING' },
  { re: /\bDISTINCT\b/i, label: 'DISTINCT' },
  { re: /\bLIKE\b/i, label: 'LIKE' },
  { re: /\bBETWEEN\b/i, label: 'BETWEEN' },
  { re: /\bIN\s*\(/i, label: 'IN' },
  { re: /\bIS\s+NULL\b/i, label: 'IS NULL' },
  { re: /\bIS\s+NOT\s+NULL\b/i, label: 'IS NOT NULL' },
  { re: /\bORDER\s+BY\b/i, label: 'ORDER BY' },
  { re: /\bINNER\s+JOIN\b/i, label: 'INNER JOIN' },
  { re: /\bNATURAL\s+JOIN\b/i, label: 'NATURAL JOIN' },
  { re: /\bCROSS\s+JOIN\b/i, label: 'CROSS JOIN' },
  { re: /\bJOIN\b/i, label: 'JOIN' },
  { re: /\bCREATE\s+TABLE\b/i, label: 'CREATE TABLE' },
  { re: /\bALTER\s+TABLE\b/i, label: 'ALTER TABLE' },
  { re: /\bDROP\s+TABLE\b/i, label: 'DROP TABLE' },
  { re: /\bPRIMARY\s+KEY\b/i, label: 'PRIMARY KEY' },
  { re: /\bFOREIGN\s+KEY\b/i, label: 'FOREIGN KEY' },
  { re: /\bREFERENCES\b/i, label: 'REFERENCES' },
  { re: /\bNOT\s+NULL\b/i, label: 'NOT NULL' },
  { re: /\bUNIQUE\b/i, label: 'UNIQUE' },
  { re: /\bDEFAULT\b/i, label: 'DEFAULT' },
  { re: /\bMODIFY\b/i, label: 'MODIFY' },
  // DROP COLUMN / ADD COLUMN: MySQL allows omitting the COLUMN keyword —
  // accept both spellings but never confuse them with DROP PRIMARY KEY.
  { re: /\bDROP\s+(?:COLUMN\s+)?(?!PRIMARY\b|KEY\b|INDEX\b|FOREIGN\b|CONSTRAINT\b|CHECK\b)[A-Za-z_]/i, label: 'DROP COLUMN' },
  { re: /\bINSERT\s+INTO\b/i, label: 'INSERT INTO' },
  { re: /\bVALUES\b/i, label: 'VALUES' },
  { re: /\bUPDATE\b/i, label: 'UPDATE' },
  { re: /\bDELETE\s+FROM\b/i, label: 'DELETE' },
  { re: /\bSHOW\s+TABLES\b/i, label: 'SHOW TABLES' },
  { re: /\b(DESC|DESCRIBE)\s+\w+/i, label: 'DESC' },
  { re: /\bCOUNT\s*\(/i, label: 'COUNT()' },
  { re: /\bSUM\s*\(/i, label: 'SUM()' },
  { re: /\bAVG\s*\(/i, label: 'AVG()' },
  { re: /\bMAX\s*\(/i, label: 'MAX()' },
  { re: /\bMIN\s*\(/i, label: 'MIN()' },
  { re: /\bROUND\s*\(/i, label: 'ROUND()' },
  { re: /\bTRUNCATE\s*\(/i, label: 'TRUNCATE()' },
  { re: /\bPOW(?:ER)?\s*\(/i, label: 'POW()' },
  { re: /\bMOD\s*\(/i, label: 'MOD()' },
  { re: /\bUCASE\s*\(|\bUPPER\s*\(/i, label: 'UCASE()' },
  { re: /\bLCASE\s*\(|\bLOWER\s*\(/i, label: 'LCASE()' },
  { re: /\bMID\s*\(|\bSUBSTR(?:ING)?\s*\(/i, label: 'MID()/SUBSTR()' },
  { re: /\bINSTR\s*\(/i, label: 'INSTR()' },
  { re: /\bLENGTH\s*\(/i, label: 'LENGTH()' },
  { re: /\bLTRIM\s*\(/i, label: 'LTRIM()' },
  { re: /\bRTRIM\s*\(/i, label: 'RTRIM()' },
  { re: /\bTRIM\s*\(/i, label: 'TRIM()' },
  { re: /\bYEAR\s*\(/i, label: 'YEAR()' },
  { re: /\bMONTH\s*\(/i, label: 'MONTH()' },
  { re: /\bMONTHNAME\s*\(/i, label: 'MONTHNAME()' },
  { re: /\bDAYNAME\s*\(/i, label: 'DAYNAME()' },
  { re: /\bDAY\s*\(/i, label: 'DAY()' },
  { re: /\bNOW\s*\(/i, label: 'NOW()' },
  { re: /\bCURDATE\s*\(/i, label: 'CURDATE()' },
]

const AGG_RE = /\b(COUNT|SUM|AVG|MAX|MIN)\s*\(/i
const NULL_EQ_RE = /(!=|<>|==|=)\s*NULL\b/i
const ORDER_BY_RE = /\bORDER\s+BY\b/i

export function deriveRequiredConcepts(solutionSql) {
  if (!solutionSql) return []
  return CONCEPT_PATTERNS.filter((p) => p.re.test(solutionSql))
}

// ── CBSE board traps ──────────────────────────────────────────

function extractWhereSegment(sql) {
  // WHERE ... up to GROUP BY / HAVING / ORDER BY / LIMIT / end (no subquery awareness — CBSE level)
  const m = sql.match(/\bWHERE\b([\s\S]*)$/i)
  if (!m) return null
  const rest = m[1]
  const cut = rest.search(/\b(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
  return cut >= 0 ? rest.slice(0, cut) : rest
}

export function checkTraps(sqlText, mission) {
  const traps = []
  const sql = sqlText || ''

  // Trap 1: = NULL / != NULL instead of IS [NOT] NULL
  if (NULL_EQ_RE.test(sql)) {
    traps.push({
      id: 'null-eq',
      trap: 'Trap 1',
      title: 'NULL comparison',
      message: 'You compared with = NULL or != NULL. NULL is an unknown — no comparison operator ever matches it. Use IS NULL to find missing values and IS NOT NULL to find present ones.',
    })
  }

  // Trap 2: aggregate function inside WHERE
  const whereSeg = extractWhereSegment(sql)
  if (whereSeg && AGG_RE.test(whereSeg)) {
    traps.push({
      id: 'agg-in-where',
      trap: 'Trap 2',
      title: 'Aggregate in WHERE',
      message: 'Aggregate functions (COUNT / SUM / AVG / MAX / MIN) cannot be used in WHERE — WHERE filters rows before grouping. Filter groups with HAVING, placed after GROUP BY.',
    })
  }

  // Trap 4: DDL vs DML mixup, scoped to the mission's category
  const kind = mission?.kind
  if (kind === 'ddl' && /\b(UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i.test(sql)) {
    traps.push({
      id: 'ddl-dml',
      trap: 'Trap 4',
      title: 'DML on a DDL mission',
      message: 'UPDATE and DELETE change DATA (DML). This mission changes the TABLE STRUCTURE — that requires ALTER TABLE / DROP TABLE (DDL).',
    })
  }
  if (kind === 'dml' && /\b(ALTER\s+TABLE|DROP\s+(TABLE|PRIMARY))/i.test(sql)) {
    traps.push({
      id: 'dml-ddl',
      trap: 'Trap 4',
      title: 'DDL on a DML mission',
      message: 'ALTER TABLE and DROP change the SCHEMA (DDL). This mission changes the DATA stored in rows — that requires INSERT / UPDATE / DELETE (DML).',
    })
  }

  // Mission-specific trap regexes (e.g. COUNT(*) policy)
  for (const t of mission?.trapChecks || []) {
    if (t.re && new RegExp(t.re.source, t.re.flags || 'i').test(sql)) {
      traps.push({ id: t.id || 'custom', trap: t.trap || 'Trap', title: t.title || 'Concept misuse', message: t.message })
    }
  }

  return traps
}

// ── Result-set comparison ─────────────────────────────────────

function canonRow(row) {
  return JSON.stringify(row.map((c) => {
    const n = c === null || c === undefined ? null : (typeof c === 'number' ? { n: c } : String(c).trim())
    return n
  }))
}

function compareHeaders(your, expected) {
  const y = (your.columns || []).map((c) => String(c).trim().toLowerCase())
  const e = (expected.columns || []).map((c) => String(c).trim().toLowerCase())
  const missing = e.filter((c) => !y.includes(c))
  const extra = y.filter((c) => !e.includes(c))
  return { ok: missing.length === 0 && extra.length === 0, missing, extra }
}

/**
 * Align rows for display/diff. If the reference solution uses ORDER BY the
 * comparison is order-sensitive; otherwise rows are compared as multisets
 * (sorted canonically) because SQL output order is unspecified without it.
 */
function alignRows(your, expected, orderSensitive) {
  let yVals = your.values.map((r) => [...r])
  let eVals = expected.values.map((r) => [...r])

  if (!orderSensitive) {
    const withIdx = (rows) => rows.map((r, i) => ({ i, key: canonRow(r), r })).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : a.i - b.i))
    yVals = withIdx(yVals).map((x) => x.r)
    eVals = withIdx(eVals).map((x) => x.r)
  }

  const cellMismatches = []
  const sampleDiffs = []
  const n = Math.min(yVals.length, eVals.length)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < eVals[r].length; c++) {
      const ok = cellsEqual(yVals[r]?.[c], eVals[r][c])
      if (!ok) {
        cellMismatches.push([r, c])
        if (sampleDiffs.length < 3) {
          sampleDiffs.push({
            row: r + 1,
            col: expected.columns?.[c] || `col ${c + 1}`,
            yours: yVals[r]?.[c] === null || yVals[r]?.[c] === undefined ? 'NULL' : String(yVals[r]?.[c]),
            expected: eVals[r][c] === null || eVals[r][c] === undefined ? 'NULL' : String(eVals[r][c]),
          })
        }
      }
    }
  }
  return { yVals, eVals, cellMismatches, sampleDiffs, orderSensitive }
}

// ── Grader entry point ────────────────────────────────────────

/**
 * @param {object} args
 *   mission      — mission config (kind, required, trapChecks…)
 *   sqlText      — raw student query
 *   your         — last result set from the student run (or null)
 *   expected     — reference result set (or null)
 *   execError    — engine error string (or null)
 */
export function gradeSubmission({ mission, sqlText, your, expected, execError }) {
  const fail = (message, detail = {}) => ({ passed: false, message, ...detail })

  // 0. Engine-level failure
  if (execError) {
    return fail(execError, { level: 'error', trapWarnings: checkTraps(sqlText, mission) })
  }

  // 1. Board traps short-circuit with targeted teaching feedback
  const trapWarnings = checkTraps(sqlText, mission)
  if (trapWarnings.length > 0) {
    return fail(trapWarnings[0].message, { level: 'trap', trap: trapWarnings[0], trapWarnings })
  }

  if (!your || !your.columns) {
    return fail('Query executed but returned no result set to grade. End your script with a SELECT (or DESC) that produces the expected output.', { level: 'no-result' })
  }

  // 2. Layer 1 — result-set verification
  const hdr = compareHeaders(your, expected || { columns: [], values: [] })
  if (expected && !hdr.ok) {
    const bits = []
    if (hdr.missing.length) bits.push(`missing column(s): ${hdr.missing.join(', ')}`)
    if (hdr.extra.length) bits.push(`unexpected column(s): ${hdr.extra.join(', ')}`)
    return fail(`Output columns do not match the target table — ${bits.join('; ')}. Check your SELECT list and column aliases (AS).`, { level: 'columns', header: hdr })
  }

  if (!expected || !expected.values) {
    return fail('No expected output available for this mission.', { level: 'internal' })
  }

  if (your.values.length !== expected.values.length) {
    return fail(
      `Row count mismatch — your query returned ${your.values.length} row(s), the target has ${expected.values.length}. ${your.values.length > expected.values.length ? 'Check your WHERE filter.' : 'Check for rows you are not selecting.'}`,
      { level: 'rows' }
    )
  }

  const orderSensitive = ORDER_BY_RE.test(mission.solution || '')
  const cmp = alignRows(your, expected, orderSensitive)
  if (cmp.cellMismatches.length > 0) {
    const first = cmp.sampleDiffs[0]
    return fail(
      `Cell mismatch${cmp.cellMismatches.length > 1 ? ` (${cmp.cellMismatches.length} cells)` : ''} — row ${first.row}, column "${first.col}": you produced ${first.yours}, target is ${first.expected}.`,
      { level: 'cells', diff: { yVals: cmp.yVals, eVals: cmp.eVals, cellMismatches: cmp.cellMismatches } }
    )
  }

  // 3. Layer 2 — concept / keyword verification (anti-hardcode)
  const required = [...(mission.required || []), ...deriveRequiredConcepts(mission.solution)]
  const sql = sqlText || ''
  const missingConcepts = required.filter((p) => !(p.re instanceof RegExp ? p.re : new RegExp(p.re, 'i')).test(sql))
  if (missingConcepts.length > 0) {
    return fail(
      `Result matches, but the required CBSE concept was not used: ${missingConcepts.map((m) => m.label).join(', ')}. Hardcoded output is rejected — solve it with the real construct.`,
      { level: 'concept', missingConcepts }
    )
  }

  return {
    passed: true,
    message: 'Verified — result set matches and required concepts demonstrated.',
    diff: { yVals: cmp.yVals, eVals: cmp.eVals, cellMismatches: [] },
    orderSensitive,
  }
}
