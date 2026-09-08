import { useMemo } from 'react'
import katex from 'katex'
import { C, fonts } from '../utils/theme'

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
        tokens.push(<code key={key} style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: 4, fontSize: '0.88em' }}>{math}</code>)
      }
    } else if (raw.startsWith('`') && raw.endsWith('`') && raw.length >= 2) {
      tokens.push(
        <code key={key} style={{
          background: 'rgba(255,255,255,0.08)',
          padding: '2px 5px',
          borderRadius: 4,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: '0.85em',
          color: 'var(--accent-blue, #10b981)',
        }}>
          {raw.slice(1, -1)}
        </code>
      )
    } else if (raw.startsWith('**') && raw.endsWith('**') && raw.length >= 4) {
      tokens.push(<strong key={key} style={{ fontWeight: 650, color: 'var(--text-primary, #f8fafc)' }}>{raw.slice(2, -2)}</strong>)
    } else if (raw.startsWith('*') && raw.endsWith('*') && raw.length >= 2) {
      tokens.push(<em key={key} style={{ fontStyle: 'italic' }}>{raw.slice(1, -1)}</em>)
    } else if (raw.startsWith('[') && raw.includes('](')) {
      const label = raw.substring(1, raw.indexOf(']('))
      const url = raw.substring(raw.indexOf('](') + 2, raw.length - 1)
      tokens.push(
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue, #10b981)', textDecoration: 'underline' }}>
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

export default function MarkdownContent({ content, style }) {
  const blocks = useMemo(() => {
    if (!content) return []

    const lines = content.split('\n')
    const parsed = []
    let inCodeBlock = false
    let codeLang = ''
    let codeLines = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Handle Code Block start/end
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          codeLang = line.trim().slice(3).trim()
          codeLines = []
        } else {
          inCodeBlock = false
          parsed.push({
            type: 'code',
            lang: codeLang,
            content: codeLines.join('\n'),
          })
        }
        continue
      }

      if (inCodeBlock) {
        codeLines.push(line)
        continue
      }

      // Handle Math Block $$ ... $$
      if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 4) {
        parsed.push({
          type: 'math',
          content: line.trim().slice(2, -2),
        })
        continue
      }

      // Handle Headings
      const h3Match = line.match(/^###\s+(.*)/)
      if (h3Match) {
        parsed.push({ type: 'h3', text: h3Match[1] })
        continue
      }
      const h2Match = line.match(/^##\s+(.*)/)
      if (h2Match) {
        parsed.push({ type: 'h2', text: h2Match[1] })
        continue
      }
      const h1Match = line.match(/^#\s+(.*)/)
      if (h1Match) {
        parsed.push({ type: 'h1', text: h1Match[1] })
        continue
      }

      // Handle Blockquotes
      const bqMatch = line.match(/^>\s*(.*)/)
      if (bqMatch) {
        parsed.push({ type: 'blockquote', text: bqMatch[1] })
        continue
      }

      // Handle Bullet lists (- or *)
      const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)/)
      if (bulletMatch) {
        parsed.push({
          type: 'bullet',
          indent: Math.floor((bulletMatch[1] || '').length / 2),
          text: bulletMatch[2],
        })
        continue
      }

      // Handle Numbered lists (1. 2.)
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

      // Empty line
      if (line.trim() === '') {
        parsed.push({ type: 'blank' })
        continue
      }

      // Default paragraph line
      parsed.push({ type: 'paragraph', text: line })
    }

    if (inCodeBlock && codeLines.length) {
      parsed.push({
        type: 'code',
        lang: codeLang,
        content: codeLines.join('\n'),
      })
    }

    return parsed
  }, [content])

  return (
    <div style={{
      fontFamily: fonts.body,
      fontSize: '0.885rem',
      lineHeight: 1.65,
      color: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      ...style,
    }}>
      {blocks.map((b, idx) => {
        if (b.type === 'blank') {
          return <div key={idx} style={{ height: '0.35rem' }} />
        }

        if (b.type === 'h1') {
          return (
            <h1 key={idx} style={{
              fontFamily: fonts.heading,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary, #f8fafc)',
              letterSpacing: '-0.02em',
              margin: '0.6rem 0 0.2rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '0.3rem',
            }}>
              {renderInline(b.text, `h1-${idx}`)}
            </h1>
          )
        }

        if (b.type === 'h2') {
          return (
            <h2 key={idx} style={{
              fontFamily: fonts.heading,
              fontSize: '1.08rem',
              fontWeight: 650,
              color: 'var(--text-primary, #f8fafc)',
              letterSpacing: '-0.015em',
              margin: '0.5rem 0 0.15rem',
            }}>
              {renderInline(b.text, `h2-${idx}`)}
            </h2>
          )
        }

        if (b.type === 'h3') {
          return (
            <h3 key={idx} style={{
              fontFamily: fonts.heading,
              fontSize: '0.98rem',
              fontWeight: 600,
              color: 'var(--accent-blue, #10b981)',
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
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--accent-blue, #10b981)',
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
                fontFamily: fonts.heading,
                fontSize: '0.82em',
                fontWeight: 700,
                color: 'var(--accent-blue, #10b981)',
                minWidth: '1.2rem',
                flexShrink: 0,
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
              borderLeft: '3px solid var(--accent-blue, #10b981)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '0 6px 6px 0',
              color: 'var(--text-secondary, #94a3b8)',
              fontStyle: 'italic',
            }}>
              {renderInline(b.text, `bq-${idx}`)}
            </blockquote>
          )
        }

        if (b.type === 'code') {
          return (
            <div key={idx} style={{
              margin: '0.4rem 0',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#090c10',
              overflow: 'hidden',
            }}>
              {b.lang && (
                <div style={{
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.72rem',
                  fontFamily: fonts.heading,
                  color: 'var(--text-muted, #64748b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {b.lang}
                </div>
              )}
              <pre style={{
                margin: 0,
                padding: '10px 12px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '0.82rem',
                lineHeight: 1.5,
                color: '#e2e8f0',
                overflowX: 'auto',
              }}>
                <code>{b.content}</code>
              </pre>
            </div>
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
              <pre key={idx} style={{ margin: '0.4rem 0', padding: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                <code>{b.content}</code>
              </pre>
            )
          }
        }

        // Paragraph
        return (
          <p key={idx} style={{ margin: 0 }}>
            {renderInline(b.text, `p-${idx}`)}
          </p>
        )
      })}
    </div>
  )
}
