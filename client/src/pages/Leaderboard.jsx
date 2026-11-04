import { useState, useEffect, useCallback } from 'react'
import { Trophy, Fire, Copy, Check, Users, UserPlus, SpinnerGap } from '@phosphor-icons/react'
import { useAuthStore, useXPStore, useUIStore, usePomodoroStore, calcStreak } from '../stores'
import { C, fonts, tint, btnGhost, btnPrimary, inputStyle } from '../utils/theme'
import { PageHeader, Card, SectionTitle } from '../components/ui'
import { isSupabaseConfigured } from '../lib/supabase'
import { ensureProfile, updateProfileStats, addFriendByCode, loadLeaderboard } from '../lib/db'

const MOCK_BOARD = [
  { rank: 1, name: 'Alex Kim', xp: 4200, level: 12, streak: 21, avatar: 'A' },
  { rank: 2, name: 'Maria Chen', xp: 3850, level: 11, streak: 14, avatar: 'M' },
  { rank: 3, name: 'Jordan Lee', xp: 3400, level: 10, streak: 9, avatar: 'J' },
  { rank: 4, name: 'Sam Rivera', xp: 2900, level: 9, streak: 6, avatar: 'S' },
  { rank: 5, name: 'Taylor Wu', xp: 2400, level: 8, streak: 3, avatar: 'T' },
]

const RANK_EMOJI = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Leaderboard() {
  const { user } = useAuthStore()
  const { xp: myXP, getProgress } = useXPStore()
  const { addToast } = useUIStore()
  const { dailyFocusLog } = usePomodoroStore()
  const myLevel = getProgress().cur.level
  const myStreak = calcStreak(dailyFocusLog || {})
  const [copied, setCopied] = useState(false)
  const [friendCode, setFriendCode] = useState('')
  const [adding, setAdding] = useState(false)
  const [realBoard, setRealBoard] = useState(null) // null = not loaded / unavailable
  const [shareCode, setShareCode] = useState(null)

  const myName = user?.name || user?.firstName || 'You'
  const myInitial = myName[0]?.toUpperCase() || 'Y'
  const live = isSupabaseConfigured() && !user?.isDemo && !!user?.id

  const refreshBoard = useCallback(async () => {
    if (!live) return
    await updateProfileStats(user.id, { xp: myXP, level: myLevel, streak: myStreak, name: myName })
    const board = await loadLeaderboard(user.id)
    if (board?.mine) {
      setShareCode(board.mine.share_code)
      setRealBoard([board.mine, ...board.friends])
    }
  }, [live, user?.id, myXP, myLevel, myStreak, myName])

  useEffect(() => {
    if (!live) return
    let cancelled = false
    ;(async () => {
      const profile = await ensureProfile(user.id, myName)
      if (cancelled || !profile) return
      await refreshBoard()
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, user?.id])

  const handleAddFriend = async () => {
    if (!friendCode.trim() || !live) return
    setAdding(true)
    const friend = await addFriendByCode(user.id, friendCode.trim())
    setAdding(false)
    if (friend) {
      addToast({ type: 'success', message: `Added ${friend.name} to your leaderboard!` })
      setFriendCode('')
      refreshBoard()
    } else {
      addToast({ type: 'error', message: 'No student found with that code' })
    }
  }

  const board = live && realBoard
    ? realBoard
        .map(p => ({
          rank: 0, name: p.user_id === user.id ? `${p.name} (You)` : p.name,
          xp: p.xp || 0, level: p.level || 1, streak: p.streak || 0,
          avatar: (p.name || '?')[0].toUpperCase(), isMe: p.user_id === user.id,
        }))
        .sort((a, b) => b.xp - a.xp)
        .map((e, i) => ({ ...e, rank: i + 1 }))
    : [...MOCK_BOARD, { rank: 6, name: myName + ' (You)', xp: myXP, level: myLevel, streak: myStreak, avatar: myInitial, isMe: true }]
        .sort((a, b) => b.xp - a.xp)
        .map((e, i) => ({ ...e, rank: i + 1 }))

  const myEntry = board.find(e => e.isMe)
  const displayCode = shareCode || '····'

  const copyCode = () => {
    if (!shareCode) return
    navigator.clipboard?.writeText(shareCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ fontFamily: fonts.body, color: C.text, maxWidth: 740, margin: '0 auto' }}>
      <PageHeader
        icon={Trophy}
        accent="#fbbf24"
        title="Leaderboard"
        subtitle="Compare weekly study velocity, XP rankings, and daily streaks"
      />

      {/* My rank card */}
      <Card style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color, rgba(52,211,153,0.22))',
        boxShadow: 'var(--shadow-lift, 0 8px 24px rgba(0,0,0,0.45))',
        padding: '20px 24px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{
          fontFamily: fonts.heading, fontSize: 36, fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '-0.02em',
        }}>#{myEntry?.rank}</div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: fonts.body }}>{myName}</span>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
              background: 'var(--accent-blue-soft, rgba(16,185,129,0.12))',
              color: 'var(--accent-blue)',
              letterSpacing: '0.04em',
            }}>YOU</span>
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Level {myLevel}</div>
        </div>
        {[
          { label: 'Total XP', value: `${myXP.toLocaleString()} XP`, color: C.amber },
          { label: 'Streak', value: `${myStreak}d`, color: C.amber },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: s.color,
            }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </Card>

      {/* Podium top 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {board.slice(0, 3).map((entry, i) => (
          <Card key={entry.rank} style={{
            padding: '18px 14px', textAlign: 'center',
            background: 'var(--bg-card)',
            border: i === 0 ? '1px solid rgba(251,191,36,0.35)' : `1px solid ${C.border}`,
            boxShadow: i === 0 ? '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)' : undefined,
            order: i === 0 ? 2 : i === 1 ? 1 : 3,
            marginTop: i === 0 ? 0 : 12,
          }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{RANK_EMOJI[entry.rank]}</div>
            <div style={{
              width: 38, height: 38, borderRadius: 10, margin: '0 auto 8px',
              background: i === 0 ? 'var(--grad-reward)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${i === 0 ? 'transparent' : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: fonts.heading, fontWeight: 700, fontSize: 14,
              color: i === 0 ? '#1a1005' : C.text,
            }}>{entry.avatar}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</div>
            <div style={{ fontSize: 11.5, color: C.textMuted }}>{entry.xp.toLocaleString()} XP</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 11, color: C.amber, fontWeight: 700, marginTop: 2 }}>
              <Fire size={11} /> {entry.streak}d
            </div>
          </Card>
        ))}
      </div>

      {/* Board */}
      <Card style={{ overflow: 'hidden', marginBottom: 20, padding: 0, background: 'var(--bg-card)' }}>
        {board.map((entry, i) => (
          <div key={entry.rank} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '13px 20px',
            borderBottom: i < board.length - 1 ? `1px solid ${C.borderSoft}` : 'none',
            background: entry.isMe ? 'rgba(16,185,129,0.08)' : 'transparent',
            position: 'relative',
          }}>
            {entry.isMe && (
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                background: 'var(--accent-blue)', borderRadius: '0 2px 2px 0',
              }} />
            )}
            <div style={{
              width: 28, fontFamily: fonts.heading, fontSize: 14, fontWeight: 700,
              color: entry.rank <= 3 ? C.amber : C.textMuted, textAlign: 'center', flexShrink: 0,
            }}>
              {RANK_EMOJI[entry.rank] || `#${entry.rank}`}
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: entry.isMe ? 'var(--grad-primary)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${entry.isMe ? 'transparent' : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: fonts.heading, fontWeight: 700, fontSize: 13,
              color: entry.isMe ? '#04120c' : C.text, flexShrink: 0,
            }}>
              {entry.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: entry.isMe ? 700 : 600, color: entry.isMe ? C.primary : C.text }}>{entry.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.textMuted }}>
                Level {entry.level} · <Fire size={11} color={C.amber} /> {entry.streak}d streak
              </div>
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: 13.5, fontWeight: 700, color: C.text }}>{entry.xp.toLocaleString()} XP</div>
          </div>
        ))}
      </Card>

      {/* Share code */}
      <Card style={{ padding: '20px 24px', marginBottom: live ? 20 : 0, background: 'var(--bg-card)' }}>
        <SectionTitle icon={Users} color={C.purple}>Study Circle & Invites</SectionTitle>
        <p style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 14 }}>
          {live ? 'Share your invite code so friends can join your study leaderboard:' : 'Share your invite code to study and compete together:'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: C.blue,
            letterSpacing: '0.14em', background: 'var(--surface-low, #0d1712)', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '8px 16px',
          }}>
            {displayCode}
          </div>
          <button onClick={copyCode} disabled={!shareCode} style={{ ...btnGhost, color: copied ? '#4ade80' : C.textMuted, opacity: shareCode ? 1 : 0.5 }}>
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy Code</>}
          </button>
        </div>
      </Card>

      {/* Add friend by code */}
      {live && (
        <Card style={{ padding: '20px 24px', background: 'var(--bg-card)' }}>
          <SectionTitle icon={UserPlus} color={C.blue}>Add Study Partner</SectionTitle>
          <p style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 14 }}>Enter your classmate's invite code to add them to your circle:</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={friendCode}
              onChange={e => setFriendCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
              placeholder="e.g. AB12"
              maxLength={8}
              style={{ ...inputStyle, flex: 1, minWidth: 140, width: 'auto', letterSpacing: '0.12em', fontFamily: fonts.heading }}
            />
            <button onClick={handleAddFriend} disabled={adding || !friendCode.trim()} style={{ ...btnPrimary, opacity: adding || !friendCode.trim() ? 0.6 : 1 }}>
              {adding ? <SpinnerGap size={14} className="spin" /> : <UserPlus size={14} />} {adding ? 'Adding…' : 'Add Friend'}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
