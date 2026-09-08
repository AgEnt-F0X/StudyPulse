import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useXPStore, getLevel, getNextLevel } from '../stores'
import confetti from 'canvas-confetti'

const LevelUpOverlay = ({ level, onClose }) => {
  useEffect(() => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: [level.color, '#afc6ff', '#e5b5ff'] })
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', cursor: 'pointer',
      }}
    >
      <motion.div
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        style={{
          textAlign: 'center', padding: '40px 52px',
          background: 'var(--bg-card, #101c17)',
          border: `1px solid ${level.color}`,
          borderRadius: 16,
          boxShadow: `0 0 40px ${level.color}30, 0 24px 64px rgba(0,0,0,0.7)`,
        }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.01em', textTransform: 'none', color: 'var(--text-muted, #64748b)', marginBottom: 8 }}>
          Level up!
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 44, fontWeight: 800, color: level.color, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {level.level}
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text-primary, #f0f4fc)', marginBottom: 12 }}>
          {level.title}
        </div>
        <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: 'var(--text-muted, #64748b)' }}>
          Click anywhere to continue
        </div>
      </motion.div>
    </motion.div>
  )
}

const XPBar = ({ collapsed }) => {
  const { xp, levelUpPending, clearLevelUp, getProgress } = useXPStore()
  const { pct, cur, next, xpInLevel, xpToNext } = getProgress()

  return (
    <>
      <AnimatePresence>
        {levelUpPending && (
          <LevelUpOverlay level={levelUpPending} onClose={clearLevelUp} />
        )}
      </AnimatePresence>

      <div style={{ padding: collapsed ? '8px 4px' : '8px 12px' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={12} color={cur.color} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: cur.color }}>
                LV{cur.level} {cur.title}
              </span>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', monospace", fontSize: 11, fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
              {xp} XP
            </span>
          </div>
        )}
        <div style={{
          height: collapsed ? 3 : 5,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ height: '100%', background: cur.color, borderRadius: 3 }}
          />
        </div>
        {!collapsed && next && (
          <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: 'var(--text-muted, #64748b)', marginTop: 4, textAlign: 'right' }}>
            {xpToNext - xpInLevel} XP → LV{next.level}
          </div>
        )}
      </div>
    </>
  )
}

export default XPBar
