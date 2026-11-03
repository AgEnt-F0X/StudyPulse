// SQL Pulse — result tables. Monospace, hairline grid, NULL rendered
// distinctly. `mismatchCells` (array of [row, col]) paints subtle red/green
// diffs for the grader's comparison view.

import { useMemo } from 'react'
import { C, fonts } from '../utils/theme'

const cellStyle = (mismatch, isNull, isExpectedPane) => {
  const base = {
    padding: '3px 10px',
    borderBottom: `1px solid ${C.borderSoft}`,
    fontFamily: fonts.mono,
    fontSize: 11,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    color: isNull ? C.textFaint : C.text,
    fontStyle: isNull ? 'italic' : 'normal',
    borderRight: `1px solid ${C.borderSoft}`,
  }
  if (mismatch) {
    return { ...base, background: isExpectedPane ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.12)', color: isExpectedPane ? C.success : C.error }
  }
  return base
}

export default function SqlResultTable({ columns, values, mismatchCells, expectedPane = false, maxRows = 60, emptyLabel = 'No rows' }) {
  const mismatchSet = useMemo(() => {
    const s = new Set()
    for (const [r, c] of mismatchCells || []) s.add(`${r}:${c}`)
    return s
  }, [mismatchCells])

  if (!columns || columns.length === 0) {
    return (
      <div style={{ padding: '14px 12px', fontFamily: fonts.mono, fontSize: 11, color: C.textFaint }}>
        {emptyLabel}
      </div>
    )
  }

  const rows = (values || []).slice(0, maxRows)
  const truncated = (values || []).length - rows.length

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: '4px 10px',
                borderBottom: `1px solid ${C.border}`,
                borderRight: i < columns.length - 1 ? `1px solid ${C.borderSoft}` : 'none',
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: C.textMuted,
                textAlign: 'left',
                background: 'var(--surface-low, #0C0C0E)',
                whiteSpace: 'nowrap',
              }}>
                {String(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{
                padding: '10px 12px',
                fontFamily: fonts.mono, fontSize: 11, color: C.textFaint, fontStyle: 'italic',
              }}>
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row, r) => (
              <tr key={r}>
                {columns.map((_, c) => {
                  const v = row[c]
                  const isNull = v === null || v === undefined
                  return (
                    <td key={c} style={cellStyle(mismatchSet.has(`${r}:${c}`), isNull, expectedPane)}>
                      {isNull ? 'NULL' : String(v)}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {truncated > 0 && (
        <div style={{ padding: '5px 10px', fontFamily: fonts.mono, fontSize: 10, color: C.textFaint }}>
          …{truncated} more row(s) truncated from display (grader still compares all)
        </div>
      )}
    </div>
  )
}
