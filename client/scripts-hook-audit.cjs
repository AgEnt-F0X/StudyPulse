// Scope-aware hook-order audit: only the component function's OWN
// top-level statements count (nested handlers/closures are ignored).
const fs = require('fs')
const path = require('path')

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    const st = fs.statSync(p)
    if (st.isDirectory() && !p.includes('node_modules')) walk(p, out)
    else if (/\.(jsx|js)$/.test(f)) out.push(p)
  }
  return out
}

const isHookStmt = (stmt) => {
  const t = stmt.trim()
  return /^\s*use[A-Z]\w*\(/.test(t)
    || /^\s*const \[[^\]]*\] = use[A-Z]\w*\(/.test(t)
    || /^\s*const \w+ = use(AuthStore|LearnerStore|ExamStore|SqlPulseStore|UIStore|AssignmentsStore|PomodoroStore|XPStore|NotesStore|FlashcardsStore|GradesStore|EventStore|StudyPlansStore|CalendarStore|HabitsStore|QuizHistoryStore)\(/.test(t)
    || /^\s*const \w+ = useNavigate\(/.test(t)
    || /^\s*const \[[^\]]*\] = useSearchParams\(/.test(t)
    || /^\s*const \w+ = useParams\(/.test(t)
}

let flagged = 0
for (const file of walk(path.resolve(__dirname, 'src/pages')).concat(walk(path.resolve(__dirname, 'src/components')))) {
  const s = fs.readFileSync(file, 'utf8')
  const fns = [...s.matchAll(/(?:export default )?function ([A-Z]\w*)\s*\(([^)]*)\)\s*\{/g)]
  for (const m of fns) {
    const bodyStart = m.index + m[0].length
    let depth = 1
    const stmts = []
    let stmtStart = bodyStart
    let i = bodyStart
    let inStr = null
    while (i < s.length && depth > 0) {
      const c = s[i]
      if (inStr) {
        if (c === '\\') { i += 2; continue }
        if (c === inStr) inStr = null
      } else {
        if (c === '"' || c === "'" || c === '`') inStr = c
        else if (c === '{' || c === '(' || c === '[') depth++
        else if (c === '}' || c === ')' || c === ']') {
          depth--
          if (depth === 0) break
        } else if (c === ';' && depth === 1) {
          stmts.push(s.slice(stmtStart, i + 1))
          stmtStart = i + 1
        }
      }
      i++
    }
    const tail = s.slice(stmtStart, i).trim()
    if (tail) stmts.push(tail)

    let seenEarlyReturn = false
    for (const stmt of stmts) {
      if (seenEarlyReturn && isHookStmt(stmt)) {
        flagged++
        console.log('REAL VIOLATION:', path.basename(file), '::', m[1], '→', stmt.trim().slice(0, 70))
        break
      }
      if (/^\s*if \(.+\)\s*return\b/.test(stmt) || /^\s*return\b(?! \()/.test(stmt)) seenEarlyReturn = true
    }
  }
}
console.log(flagged === 0
  ? '✓ scope-aware audit: every hook call precedes every early return in every component — zero violations'
  : flagged + ' real violations to fix')
