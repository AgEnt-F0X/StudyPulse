import { useMemo, useState } from 'react'
import katex from 'katex'
import { C, fonts } from '../utils/theme'

// ── Lightweight syntax highlighting ───────────────────────────
// Restrained palette on obsidian: no neon, no gradients. Keywords white,
// strings emerald, numbers amber, comments muted. Supports the languages
// the tutor actually emits: sql, js/ts, python, json, bash, trace.

const KEYWORDS = {
  sql: /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|AS|AND|OR|NOT|NULL|IN|BETWEEN|LIKE|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|UNION|WITH|EXISTS|PRIMARY|KEY|FOREIGN|REFERENCES)\b/gi,
  js: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|this|import|from|export|default|async|await|try|catch|finally|throw|typeof|instanceof|delete|in|of|null|undefined|true|false|yield|static|get|set)\b/g,
  python: /\b(def|return|if|elif|else|for|while|import|from|as|class|try|except|finally|raise|with|lambda|pass|break|continue|and|or|not|in|is|None|True|False|global|nonlocal|yield|async|await|assert|del)\b/g,
  json: /\b(true|false|null)\b/g,
  bash: /\b(cd|ls|npm|npx|node|git|curl|echo|export|sudo|mkdir|rm|cp|mv|cat|grep|awk|sed|chmod|pip|python|python3|docker)\b/g,
}

const KEYWORD_COLOR = '#FAFAFA'
const STRING_COLOR = '#34D399'
const NUMBER_COLOR = '#F59E0B'
const COMMENT_COLOR = '#6B7280'
const FUNCTION_COLOR = '#D4D4D8'

function tokenizeLine(line, lang) {
  if (!line) return [{ text: '' }]

  const kwRe = KEYWORDS[lang] || KEYWORDS.js
  const langTag = lang === 'py' ? 'python' : lang === 'ts' ? 'js' : lang === 'shell' || lang === 'sh' ? 'bash' : lang

  // Comment detection per language
  const commentPrefix = langTag === 'python' || langTag === 'bash' ? '#' : langTag === 'sql' ? '--' : '//'
  const commentIdx = line.indexOf(commentPrefix)

  const segments = []
  const push = (text, color, style) => {
    if (text) segments.push({ text, color, style })
  }

  // Number-ish and string-ish scanners over the plain part
  const scanPlain = (plain, baseOffset) => {
    // strings first (single, double, backtick)
    const strRe = /('[^'\n]*'|"[^"\n]*"|`[^`]*`)/g
    let last = 0
    let m
    while ((m = strRe.exec(plain)) !== null) {
      const before = plain.slice(last, m.index)
      emitTokens(before, last)
      push(m[0], STRING_COLOR)
      last = m.index + m[0].length
    }
    emitTokens(plain.slice(last), last)

    function emitTokens(chunk, offset) {
      if (!chunk) return
      // keywords
      let kLast = 0
      let k
      kwRe.lastIndex = 0
      while ((k = kwRe.exec(chunk)) !== null) {
        const gap = chunk.slice(kLast, k.index)
        emitNumbers(gap, offset + kLast)
        push(k[0], KEYWORD_COLOR, { fontWeight: 500 })
        kLast = k.index + k[0].length
      }
      emitNumbers(chunk.slice(kLast), offset + kLast)
    }

    function emitNumbers(chunk, offset) {
      if (!chunk) return
      const numRe = /(\b\d+(?:\.\d+)?\b)/g
      let nLast = 0
      let n
      while ((n = numRe.exec(chunk)) !== null) {
        const gap = chunk.slice(nLast, n.index)
        emitFns(gap, offset + nLast)
        push(n[0], NUMBER_COLOR)
        nLast = n.index + n[0].length
      }
      emitFns(chunk.slice(nLast), offset + nLast)
    }

    function emitFns(chunk, offset) {
      if (!chunk) return
      const fnRe = /([A-Za-z_][A-Za-z0-9_]*)(?=\()/g
      let fLast = 0
      let f
      while ((f = fnRe.exec(chunk)) !== null) {
        push(chunk.slice(fLast, f.index), '#9CA3AF')
        push(f[0], FUNCTION_COLOR)
        fLast = f.index + f[0].length
      }
      push(chunk.slice(fLast), '#9CA3AF')
    }
  }

  if (commentIdx >= 0 && langTag !== 'json') {
    scanPlain(line.slice(0, commentIdx), 0)
    push(line.slice(commentIdx), COMMENT_COLOR, { fontStyle: 'italic' })
  } else {
    scanPlain(line, 0)
  }
  return segments.length ? segments : [{ text: line }]
}

function HighlightedCode({ code, lang }) {
  const lines = useMemo(() => {
    const l = (lang || '').toLowerCase()
    const supported = ['sql', 'js', 'javascript', 'ts', 'python', 'py', 'json', 'bash', 'sh', 'shell', 'trace']
    if (!supported.includes(l)) return null
    return code.split('\n').map((line) => tokenizeLine(line, l === 'trace' ? 'js' : l))
  }, [code, lang])

  if (!lines) return <code style={{ color: '#D4D4D8' }}>{code}</code>

  return (
    <code>
      {lines.map((segments, i) => (
        <span key={i} style={{ display: 'block' }}>
          {segments.map((seg, j) => (
            <span key={j} style={{ color: seg.color, ...seg.style, whiteSpace: 'pre-wrap' }}>
              {seg.text}
            </span>
          ))}
          {segments.length === 1 && segments[0].text === '' ? '\u00A0' : null}
        </span>
      ))}
    </code>
  )
}

// ── Inline markdown ───────────────────────────────────────────

function renderInline(text, keyPrefix = '') {
  if (!text) return null

  const tokens = []
  const regex = /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g

  let lastIdx = 0
  let match
  let count = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(text.substring(lastIdx, match.index))
    }

    const raw = match[0]
    const key = `${keyPrefix}-t-${count++}`

    if (raw.startsWith('$') && raw.endsWith('$') && raw.length > 2) {
      const math = raw.slice(1, -1)
      try {
        const html = katex.renderToString(math, { displayMode: false, throwOnError: false })
        tokens.push(<span key={key} dangerouslySetInnerHTML={{ __html: html }} />)
      } catch {
        tokens.push(
          <code key={key} style={{
            background: C.cardSoft,
            border: `1px solid ${C.borderSoft}`,
            padding: '1px 5px',
            borderRadius: 3,
            fontSize: '0.88em',
            fontFamily: fonts.mono,
          }}>{math}</code>
        )
      }
    } else if (raw.startsWith('`') && raw.endsWith('`') && raw.length >= 2) {
      tokens.push(
        <code key={key} style={{
          background: C.cardSoft,
          border: `1px solid ${C.borderSoft}`,
          padding: '1px 5px',
          borderRadius: 3,
          fontFamily: fonts.mono,
          fontSize: '0.85em',
          fontVariantNumeric: 'tabular-nums',
          color: C.text,
        }}>
          {raw.slice(1, -1)}
        </code>
      )
    } else if (raw.startsWith('**') && raw.endsWith('**') && raw.length >= 4) {
      tokens.push(<strong key={key} style={{ fontWeight: 600, color: C.text }}>{raw.slice(2, -2)}</strong>)
    } else if (raw.startsWith('*') && raw.endsWith('*') && raw.length >= 2) {
      tokens.push(<em key={key} style={{ fontStyle: 'italic' }}>{raw.slice(1, -1)}</em>)
    } else if (raw.startsWith('[') && raw.includes('](')) {
      const label = raw.substring(1, raw.indexOf(']('))
      const url = raw.substring(raw.indexOf('](') + 2, raw.length - 1)
      tokens.push(
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: 'underline', textUnderlineOffset: 2 }}>
          {label}
        </a>
      )
    } else {
      tokens.push(raw)
    }

    lastIdx = regex.lastIndex
  }

  if (lastIdx < text.length) {
    tokens.push(text.substring(lastIdx))
  }

  return tokens
}

// ── Block renderer ────────────────────────────────────────────

export default function MarkdownContent({ content, style, codeActions }) {
  const blocks = useMemo(() => {
    if (!content) return []

    const lines = content.split('\n')
    const parsed = []
    let inCodeBlock = false
    let codeLang = ''
    let codeLines = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          codeLang = line.trim().slice(3).trim()
          codeLines = []
        } else {
          inCodeBlock = false
          parsed.push({ type: 'code', lang: codeLang, content: codeLines.join('\n') })
        }
        continue
      }

      if (inCodeBlock) {
        codeLines.push(line)
        continue
      }

      if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 4) {
        parsed.push({ type: 'math', content: line.trim().slice(2, -2) })
        continue
      }

      const h3Match = line.match(/^###\s+(.*)/)
      if (h3Match) { parsed.push({ type: 'h3', text: h3Match[1] }); continue }
      const h2Match = line.match(/^##\s+(.*)/)
      if (h2Match) { parsed.push({ type: 'h2', text: h2Match[1] }); continue }
      const h1Match = line.match(/^#\s+(.*)/)
      if (h1Match) { parsed.push({ type: 'h1', text: h1Match[1] }); continue }

      const bqMatch = line.match(/^>\s*(.*)/)
      if (bqMatch) { parsed.push({ type: 'blockquote', text: bqMatch[1] }); continue }

      const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)/)
      if (bulletMatch) {
        parsed.push({
          type: 'bullet',
          indent: Math.floor((bulletMatch[1] || '').length / 2),
          text: bulletMatch[2],
        })
        continue
      }

      const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/)
      if (numMatch) {
        parsed.push({
          type: 'numbered',
          num: numMatch[2],
          indent: Math.floor((numMatch[1] || '').length / 2),
          text: numMatch[3],
        })
        continue
      }

      if (line.trim() === '') {
        parsed.push({ type: 'blank' })
        continue
      }

      parsed.push({ type: 'paragraph', text: line })
    }

    if (inCodeBlock && codeLines.length) {
      parsed.push({ type: 'code', lang: codeLang, content: codeLines.join('\n') })
    }

    return parsed
  }, [content])

  return (
    <div style={{
      fontFamily: fonts.body,
      fontSize: '0.855rem',
      lineHeight: 1.65,
      color: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      ...style,
    }}>
      {blocks.map((b, idx) => {
        if (b.type === 'blank') {
          return <div key={idx} style={{ height: '0.3rem' }} />
        }

        if (b.type === 'h1') {
          return (
            <h1 key={idx} style={{
              fontFamily: fonts.body,
              fontSize: '1.1rem',
              fontWeight: 600,
              color: C.text,
              letterSpacing: '-0.02em',
              margin: '0.5rem 0 0.2rem',
              paddingBottom: '0.25rem',
              borderBottom: `1px solid ${C.borderSoft}`,
            }}>
              {renderInline(b.text, `h1-${idx}`)}
            </h1>
          )
        }

        if (b.type === 'h2') {
          return (
            <h2 key={idx} style={{
              fontFamily: fonts.body,
              fontSize: '0.98rem',
              fontWeight: 600,
              color: C.text,
              letterSpacing: '-0.015em',
              margin: '0.45rem 0 0.15rem',
            }}>
              {renderInline(b.text, `h2-${idx}`)}
            </h2>
          )
        }

        if (b.type === 'h3') {
          return (
            <h3 key={idx} style={{
              fontFamily: fonts.mono,
              fontSize: '0.72rem',
              fontWeight: 500,
              color: C.textMuted,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0.4rem 0 0.1rem',
            }}>
              {renderInline(b.text, `h3-${idx}`)}
            </h3>
          )
        }

        if (b.type === 'bullet') {
          return (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.55rem',
              paddingLeft: `${b.indent * 1.2 + 0.2}rem`,
              margin: '0.1rem 0',
            }}>
              <span style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: C.textFaint,
                flexShrink: 0,
                transform: 'translateY(-2px)',
              }} />
              <div style={{ flex: 1 }}>{renderInline(b.text, `b-${idx}`)}</div>
            </div>
          )
        }

        if (b.type === 'numbered') {
          return (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5rem',
              paddingLeft: `${b.indent * 1.2 + 0.2}rem`,
              margin: '0.1rem 0',
            }}>
              <span style={{
                fontFamily: fonts.mono,
                fontSize: '0.75em',
                fontWeight: 500,
                color: C.textFaint,
                minWidth: '1.2rem',
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}>{b.num}.</span>
              <div style={{ flex: 1 }}>{renderInline(b.text, `n-${idx}`)}</div>
            </div>
          )
        }

        if (b.type === 'blockquote') {
          return (
            <blockquote key={idx} style={{
              margin: '0.3rem 0',
              padding: '6px 12px',
              borderLeft: `2px solid ${C.borderStrong}`,
              background: C.bgSoft,
              borderRadius: '0 3px 3px 0',
              color: C.textMuted,
            }}>
              {renderInline(b.text, `bq-${idx}`)}
            </blockquote>
          )
        }

        if (b.type === 'code') {
          return (
            <CodeBlock
              key={idx}
              lang={b.lang}
              content={b.content}
              actions={codeActions}
            />
          )
        }

        if (b.type === 'math') {
          try {
            const html = katex.renderToString(b.content, { displayMode: true, throwOnError: false })
            return (
              <div key={idx} style={{ margin: '0.5rem 0', overflowX: 'auto', textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: html }} />
            )
          } catch {
            return (
              <pre key={idx} style={{ margin: '0.4rem 0', padding: 8, background: C.bgSoft, borderRadius: 4 }}>
                <code>{b.content}</code>
              </pre>
            )
          }
        }

        return (
          <p key={idx} style={{ margin: 0 }}>
            {renderInline(b.text, `p-${idx}`)}
          </p>
        )
      })}
    </div>
  )
}

// ── Code block with header actions (copy / insert / run) ──────

export function CodeBlock({ lang, content, actions }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }

  const langLabel = (lang || 'code').toLowerCase()

  return (
    <div key={langLabel} style={{
      margin: '0.4rem 0',
      borderRadius: 4,
      border: `1px solid ${C.border}`,
      background: '#0C0C0E',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 8px 4px 10px',
        background: 'var(--surface-low, #0C0C0E)',
        borderBottom: `1px solid ${C.borderSoft}`,
      }}>
        <span className="metric-label" style={{ padding: 0 }}>{langLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {actions?.onInsert && (
            <CodeAction label="Insert" onClick={() => actions.onInsert(content)} />
          )}
          {actions?.onRun && (
            <CodeAction label="Run" onClick={() => actions.onRun(content)} />
          )}
          <CodeAction label={copied ? 'Copied' : 'Copy'} onClick={copy} />
        </div>
      </div>
      <pre style={{
        margin: 0,
        padding: '10px 12px',
        fontFamily: fonts.mono,
        fontSize: '0.78rem',
        lineHeight: 1.55,
        color: '#D4D4D8',
        fontVariantNumeric: 'tabular-nums',
        overflowX: 'auto',
      }}>
        <HighlightedCode code={content} lang={langLabel} />
      </pre>
    </div>
  )
}

function CodeAction({ label, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '2px 7px',
        borderRadius: 3,
        border: 'none',
        background: hover ? C.cardHover : 'transparent',
        color: hover ? C.text : C.textFaint,
        cursor: 'pointer',
        fontFamily: fonts.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {label}
    </button>
  )
}
