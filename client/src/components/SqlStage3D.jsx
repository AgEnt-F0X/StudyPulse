import { C, fonts } from '../utils/theme'

// 3D Relational Stage — the active mission's tables as isometric trays
// where rows are physical tiles: WHERE matches elevate + glow emerald,
// excluded rows dim and sink; JOINs draw animated laser arcs between
// matched PK→FK tiles; GROUP BY stacks rising aggregate buckets.

const ROW_H = 24
const HEADER_H = 40
const MAX_ROWS = 24

function Tray({ table, highlightSet, dimOthers, width }) {
  const cols = table.fields.slice(0, 5).map((f) => f.name)
  return (
    <div style={{ perspective: 1000, flexShrink: 0 }}>
      <div style={{
        transform: 'rotateX(22deg) rotateZ(-8deg)',
        transformStyle: 'preserve-3d',
        width,
        background: '#121218',
        border: `1px solid color-mix(in srgb, var(--md-primary) 30%, transparent)`,
        borderRadius: 10,
        boxShadow: '14px 18px 30px rgba(0,0,0,0.5), inset 0 1px 0 color-mix(in srgb, var(--md-primary) 10%, transparent)',
        overflow: 'hidden',
      }}>
        {/* Table name */}
        <div style={{
          height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'color-mix(in srgb, var(--md-primary) 14%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--md-primary) 30%, transparent)',
          fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          color: C.primaryBright,
        }}>
          {table.name}
          <span style={{ fontSize: 8.5, color: C.textFaint, letterSpacing: 0 }}>D{table.fields.length}·C{table.rows.length}</span>
        </div>
        {/* Column header */}
        <div style={{
          height: 16, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 10,
          fontFamily: fonts.mono, fontSize: 7.5, color: C.textFaint,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          borderBottom: '1px solid color-mix(in srgb, var(--md-primary) 15%, transparent)',
        }}>
          {cols.map((c) => <span key={c} style={{ width: 52, overflow: 'hidden', whiteSpace: 'nowrap' }}>{c}</span>)}
        </div>
        {/* Row tiles */}
        <div style={{ position: 'relative', transformStyle: 'preserve-3d' }}>
          {table.rows.slice(0, MAX_ROWS).map((row, ri) => {
            const isHit = highlightSet ? highlightSet.has(ri) : null
            const dim = highlightSet && highlightSet.size > 0 && !isHit
            return (
              <div key={ri} style={{
                height: ROW_H - 2, margin: '1px 4px', borderRadius: 4,
                display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 10,
                fontFamily: fonts.mono, fontSize: 8, fontVariantNumeric: 'tabular-nums',
                background: isHit ? 'color-mix(in srgb, var(--md-primary) 28%, transparent)' : 'color-mix(in srgb, var(--md-primary) 6%, transparent)',
                border: isHit ? '1px solid color-mix(in srgb, var(--md-primary) 65%, transparent)' : '1px solid color-mix(in srgb, var(--md-primary) 8%, transparent)',
                color: dim ? 'rgba(250,247,242,0.25)' : isHit ? '#FAF7F2' : C.textMuted,
                boxShadow: isHit ? '0 0 14px color-mix(in srgb, var(--md-primary) 55%, transparent), 0 6px 0 color-mix(in srgb, var(--md-primary) 25%, transparent)' : 'none',
                transform: isHit ? 'translateZ(24px) translateY(-3px)' : 'translateZ(0px)',
                opacity: dim ? 0.25 : 1,
                transition: 'transform 380ms cubic-bezier(0.22,1,0.36,1), box-shadow 380ms ease, opacity 380ms ease, background 380ms ease',
                willChange: 'transform',
              }}>
                {cols.map((c, ci) => {
                  const v = row[ci]
                  return (
                    <span key={ci} style={{
                      width: 52, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      color: ci === 0 && isHit ? 'var(--md-primary)' : undefined, fontWeight: ci === 0 ? 700 : 400,
                    }}>
                      {v === null || v === undefined ? 'NULL' : String(v)}
                    </span>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// JOIN laser arcs between two trays — drawn in the flat gap column
function BeamLayer({ countA, countB, links }) {
  if (!links?.length) return null
  const height = Math.max(countA, countB) * ROW_H + HEADER_H
  return (
    <svg width="72" height={height} style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: 4 }}>
      {links.slice(0, 40).map((l, i) => {
        const y1 = HEADER_H + l.a * ROW_H + ROW_H / 2
        const y2 = HEADER_H + l.b * ROW_H + ROW_H / 2
        const mx = 36
        return (
          <g key={i}>
            <path
              d={`M 0 ${y1} C ${mx} ${y1}, ${mx} ${y2}, 72 ${y2}`}
              fill="none"
              stroke="var(--md-primary)"
              strokeWidth="1.6"
              opacity="0.85"
              strokeDasharray="5 4"
              className="sql-beam"
              style={{ animationDelay: `${i * 90}ms`, filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--md-primary) 80%, transparent))' }}
            />
            <circle cx="0" cy={y1} r="2.5" fill="var(--md-primary)" />
            <circle cx="72" cy={y2} r="2.5" fill="var(--md-primary)" />
          </g>
        )
      })}
      <style>{`
        .sql-beam {
          stroke-dashoffset: 40;
          animation: beamFlow 1.1s linear infinite;
        }
        @keyframes beamFlow {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  )
}

// GROUP BY aggregate buckets — rising 3D bars
function GroupBuckets({ buckets, aggLabel }) {
  const maxV = Math.max(...buckets.map((b) => Math.abs(b.value) || 1), 1)
  return (
    <div style={{
      perspective: 700, minWidth: 190, flexShrink: 0,
      alignSelf: 'flex-start',
    }}>
      <div style={{
        transform: 'rotateX(16deg) rotateZ(-4deg)',
        transformStyle: 'preserve-3d',
        background: '#121218',
        border: `1px solid rgba(245,158,11,0.35)`,
        borderRadius: 10,
        padding: '12px 14px',
        boxShadow: '12px 16px 30px rgba(0,0,0,0.5)',
      }}>
        <div className="metric-label" style={{ padding: 0, marginBottom: 10, color: '#F59E0B' }}>
          Group buckets · {aggLabel}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 130 }}>
          {buckets.slice(0, 8).map((b, i) => {
            const hPct = Math.max(6, (Math.abs(b.value) / maxV) * 100)
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: fonts.mono, fontSize: 9, color: '#F59E0B',
                  fontVariantNumeric: 'tabular-nums', marginBottom: 3,
                }}>{b.value}</div>
                <div style={{
                  width: 34, height: `${hPct}%`, minHeight: 6,
                  background: 'linear-gradient(180deg, var(--md-primary), var(--md-secondary))',
                  borderRadius: '4px 4px 0 0',
                  boxShadow: '0 0 10px color-mix(in srgb, var(--md-primary) 40%, transparent), inset -3px 0 0 rgba(0,0,0,0.25)',
                  transformOrigin: 'bottom',
                  transform: 'scaleY(1)',
                  animation: `bucketRise 480ms cubic-bezier(0.22,1,0.36,1) ${i * 70}ms both`,
                }} />
                <div style={{
                  fontFamily: fonts.mono, fontSize: 7.5, color: C.textMuted,
                  marginTop: 5, maxWidth: 44, overflow: 'hidden',
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>{b.key}</div>
              </div>
            )
          })}
        </div>
        <style>{`
          @keyframes bucketRise {
            from { transform: scaleY(0.05); opacity: 0; }
            to { transform: scaleY(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}

/**
 * <SqlStage3D
 *   tables=[{name, fields, rows}]
 *   highlights={tableName: Set(rowIndex)}   — WHERE hits
 *   joinLinks=[{a:rowIdxA,b:rowIdxB}]       — JOIN beams between the two trays
 *   groupBuckets=[{key,value}] + aggLabel   — GROUP BY stacking
 *   note="Degree = 5 · Cardinality = 12"
 * />
 */
export default function SqlStage3D({ tables = [], highlights = {}, joinLinks = null, groupBuckets = null, aggLabel = 'COUNT', note = '' }) {
  if (!tables.length) return null
  const showDim = Object.values(highlights).some((s) => s && s.size > 0)
  const twoTables = tables.length >= 2

  return (
    <div style={{
      borderRadius: 14,
      background: 'radial-gradient(600px 220px at 50% 0%, color-mix(in srgb, var(--md-primary) 8%, transparent), transparent 65%), #101014',
      border: `1px solid color-mix(in srgb, var(--md-primary) 24%, transparent)`,
      padding: '16px 18px',
      contain: 'layout style paint',
      overflowX: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
        <span className="metric-label" style={{ padding: 0, color: C.primaryBright }}>
          3D relational stage — rows are physical tiles
        </span>
        {note && (
          <span style={{
            fontFamily: fonts.mono, fontSize: 10, color: '#F59E0B',
            border: '1px solid rgba(245,158,11,0.4)', borderRadius: 999, padding: '3px 11px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {note}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: '100%' }}>
        {tables.slice(0, 2).map((t, i) => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {i > 0 && twoTables && (
              <BeamLayer
                countA={tables[0].rows.length}
                countB={t.rows.length}
                links={joinLinks}
              />
            )}
            <Tray
              table={t}
              highlightSet={highlights[t.name]}
              dimOthers={showDim}
              width={i === 0 ? (twoTables ? 300 : 400) : 300}
            />
          </div>
        ))}
        {groupBuckets && groupBuckets.length > 0 && (
          <div style={{ marginLeft: 14 }}>
            <GroupBuckets buckets={groupBuckets} aggLabel={aggLabel} />
          </div>
        )}
      </div>
      <div style={{
        marginTop: 12, fontFamily: fonts.mono, fontSize: 9.5, color: C.textFaint, lineHeight: 1.6,
      }}>
        WHERE hits <span style={{ color: C.primaryBright }}>elevate + glow</span>; excluded rows dim to 25%.
        {twoTables ? ' Beam arcs connect the primary-key → foreign-key row pairs that actually join.' : ''}
        {groupBuckets ? ' GROUP BY tiles stack into aggregate buckets.' : ''}
      </div>
    </div>
  )
}
