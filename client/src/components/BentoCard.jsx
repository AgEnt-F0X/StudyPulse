import { motion } from 'framer-motion'
import { C } from '../utils/theme'

// Botanical Scholar Bento primitive — flat reading surface,
// hairline botanical border, top-edge sheen. Glass + glow only
// on variant="glow" (hero/dock), never on dense content.
const BentoCard = ({
  children,
  className = '',
  variant = 'default', // default | glow | interactive
  noShadow = false,
  ...props
}) => {
  const variantStyle =
    variant === 'glow'
      ? {
          background: 'var(--bg-card, #101c17)',
          boxShadow:
            'var(--shadow-lift, 0 8px 24px rgba(0,0,0,0.45)), inset 0 1px 0 rgba(255,255,255,0.08)',
        }
      : {
          boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0,0,0,0.4)), inset 0 1px 0 rgba(255,255,255,0.08)',
        }

  return (
    <motion.div
      whileHover={
        variant === 'interactive'
          ? { translateY: -2, borderColor: 'rgba(52,211,153,0.28)' }
          : {}
      }
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`relative overflow-hidden transition-sa ${className}`}
      style={{
        background: 'var(--bg-card, #101c17)',
        border: '1px solid var(--border-color, rgba(52,211,153,0.14))',
        borderRadius: 16,
        padding: '1.5rem',
        ...(!noShadow && variantStyle),
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default BentoCard
export { C }
